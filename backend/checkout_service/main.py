"""Checkout Service API for Nekuda SDK browser automation demo."""
import uvicorn
import uuid
import json
from typing import Dict, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

from nekuda_browser_automation import run_order_automation
from models import OrderIntent, OrderItem, BrowserCheckoutRequest
from payment_details_handler import store_purchase_intent

app = FastAPI(title="Checkout Service")

# In-memory storage for purchase status (in production, use Redis or a database)
purchase_status: Dict[str, dict] = {}

class PurchaseStatus(BaseModel):
    purchase_id: str
    status: str  # "pending", "processing", "completed", "failed"
    message: str
    created_at: datetime
    updated_at: datetime
    result: Optional[dict] = None
    error: Optional[str] = None

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def process_purchase_background(purchase_id: str, order_intent: OrderIntent, request: BrowserCheckoutRequest):
    """Background task to process purchase"""
    try:
        # Update status to processing
        purchase_status[purchase_id]["status"] = "processing"
        purchase_status[purchase_id]["message"] = "Initializing nekuda browser automation..."
        purchase_status[purchase_id]["updated_at"] = datetime.utcnow()
        
        # Simulate progress updates (in real implementation, these would come from the automation)
        await asyncio.sleep(1)
        purchase_status[purchase_id]["message"] = "Navigating to checkout page..."
        purchase_status[purchase_id]["updated_at"] = datetime.utcnow()
        
        await asyncio.sleep(2)
        purchase_status[purchase_id]["message"] = "Filling in order details..."
        purchase_status[purchase_id]["updated_at"] = datetime.utcnow()
        
        await asyncio.sleep(2)
        purchase_status[purchase_id]["message"] = "Processing payment with nekuda SDK..."
        purchase_status[purchase_id]["updated_at"] = datetime.utcnow()
        
        # Run the actual automation
        await run_order_automation(order_intent)
        
        # Update status to completed
        purchase_status[purchase_id]["status"] = "completed"
        purchase_status[purchase_id]["message"] = "Checkout completed successfully"
        purchase_status[purchase_id]["updated_at"] = datetime.utcnow()
        purchase_status[purchase_id]["result"] = {
            "success": True,
            "message": "Checkout completed successfully",
            "store_order_id": request.store_id,
            "payment_method": "nekuda_sdk",
            "total_amount": request.total,
            "items_processed": len(request.items),
            "checkout_method": "nekuda_browser_automation",
        }
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Purchase failed - ID: {purchase_id}, User: {order_intent.user_id}, Amount: ${request.total}, Error: {str(e)}")
        
        purchase_status[purchase_id]["status"] = "failed"
        purchase_status[purchase_id]["message"] = f"Checkout failed: {str(e)}"
        purchase_status[purchase_id]["error"] = str(e)
        purchase_status[purchase_id]["updated_at"] = datetime.utcnow()


@app.post("/api/browser-checkout")
async def browser_checkout(request: BrowserCheckoutRequest, background_tasks: BackgroundTasks):
    """Initiate checkout using browser automation with nekuda SDK payment details."""
    # Generate a unique purchase ID
    purchase_id = str(uuid.uuid4())
    
    # Initialize purchase status
    purchase_status[purchase_id] = {
        "purchase_id": purchase_id,
        "status": "pending",
        "message": "Purchase initiated",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "result": None,
        "error": None
    }
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Starting nekuda browser checkout for user: {request.user_id} with purchase_id: {purchase_id}")
    logger.debug(f"Request data: items={len(request.items)}, total=${request.total}, merchant={request.merchant_name}")

    # Prepare order details for nekuda browser automation
    order_intent = OrderIntent(
        user_id=request.user_id,
        store_id=request.store_id,
        checkout_url=request.checkout_url,
        merchant_name=request.merchant_name,
        order_items=[
            OrderItem(
                item_id=item.get("id"),
                name=item["name"],
                quantity=item["quantity"],
                price=item["price"],
            )
            for item in request.items
        ],
    )
    
    # Store conversation context in order_intent (for browser automation)
    if request.conversation_context and 'messages' in request.conversation_context:
        order_intent.conversation_history = request.conversation_context['messages']
    
    # Build a simple product description from items
    product_names = [item['name'] for item in request.items]
    product_desc = ', '.join(product_names) if product_names else 'Purchase'
    
    # Store purchase intent in memory for the payment handler
    store_purchase_intent({
        'user_id': request.user_id,
        'mandate_data': {
            'product': product_desc,
            'product_description': f"{len(request.items)} items from {request.merchant_name}",
            'price': request.total,
            'currency': 'USD',
            'merchant': request.merchant_name,
            'merchant_link': request.checkout_url,
            'conversation_context': request.conversation_context or {},
            'human_messages': request.human_messages or [],
            'additional_details': {
                'store_id': request.store_id,
                'items': request.items
            },
            'confidence_score': 0.9,
            'mode': 'sandbox'
        }
    })

    # Add the purchase processing to background tasks
    background_tasks.add_task(
        process_purchase_background,
        purchase_id,
        order_intent,
        request
    )
    
    # Return immediately with the purchase ID
    return {
        "purchase_id": purchase_id,
        "status": "pending",
        "message": "Purchase initiated. Check status endpoint for updates."
    }


@app.get("/api/purchase-status/{purchase_id}")
async def get_purchase_status(purchase_id: str):
    """Get the status of a purchase by ID."""
    if purchase_id not in purchase_status:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    status = purchase_status[purchase_id]
    return PurchaseStatus(**status)




if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.info("Starting Checkout Service...")
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
