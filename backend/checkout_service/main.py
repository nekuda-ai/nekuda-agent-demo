# Placeholder for backend/checkout_service/main.py
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from nekuda_browser_automation import run_order_automation
from models import OrderIntent, OrderItem, BrowserCheckoutRequest

app = FastAPI(title="Checkout Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/browser-checkout")
async def browser_checkout(request: BrowserCheckoutRequest):
    """Complete checkout using browser automation with nekuda SDK payment details."""
    try:
        print(f"Starting nekuda browser checkout for user: {request.user_id}")
        
        # Log conversation history if provided
        if request.conversation_history:
            print(f"Conversation history received with {len(request.conversation_history)} messages")
            # You can process or store the conversation history here
            # For now, we'll just log a summary
            for i, msg in enumerate(request.conversation_history[-5:]):  # Last 5 messages
                print(f"Message {i+1}: Type={msg.get('type')}, Role={msg.get('role', 'N/A')}")
                if msg.get('type') == 'text':
                    print(f"  Content: {msg.get('content', '')[:100]}...")  # First 100 chars

        # Prepare order details for nekuda browser automation
        order_intent = OrderIntent(
            user_id=request.user_id,
            store_id=request.store_id,
            checkout_url=request.checkout_url,
            merchant_name=request.merchant_name,
            order_items=[
                OrderItem(
                    item_id=item["id"],
                    name=item["name"],
                    quantity=item["quantity"],
                    price=item["price"],
                )
                for item in request.items
            ],
        )
        
        # Store conversation history in order_intent for potential future use
        # (e.g., analytics, customer service, personalization)
        if request.conversation_history:
            order_intent.conversation_history = request.conversation_history

        await run_order_automation(order_intent)

        return {
            "success": True,
            "message": "Checkout completed successfully",
            "store_order_id": request.store_id,
            "payment_method": "nekuda_sdk",
            "total_amount": request.total,
            "items_processed": len(request.items),
            "checkout_method": "nekuda_browser_automation",
        }

    except Exception as e:
        print(f"Browser checkout error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during browser checkout: {str(e)}",
        )


if __name__ == "__main__":
    print("Starting Checkout Service...")
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
