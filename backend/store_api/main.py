# Simplified chat service - now that CopilotKit handles everything frontend-only
import os
import json
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from patchright.async_api import async_playwright

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",  # Default create-react-app port
    "http://localhost:5173",  # Default Vite port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store products in memory
PRODUCTS_CACHE: List[Dict[str, Any]] = []


class CheckoutRequest(BaseModel):
    """Request body for checkout."""

    user_id: str
    store_id: str
    items: list
    total: float


async def scrape_nekuda_products():
    """Scrape products from the Nekuda store website."""
    products = []
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            print("🌐 Navigating to Nekuda store...")
            await page.goto('https://nekuda-store-frontend.onrender.com')
            await page.wait_for_selector('#products', timeout=10000)
            
            # Wait for product articles to load
            await page.wait_for_selector('#products article', timeout=10000)
            
            # Get all product articles
            product_articles = page.locator('#products article')
            count = await product_articles.count()
            
            print(f"📦 Found {count} products to scrape")
            
            for i in range(count):
                article = product_articles.nth(i)
                
                # Extract product information
                product_name = await article.locator('.product-name').text_content()
                product_name = product_name.strip() if product_name else ""
                
                # Extract price (remove $ and convert to float)
                price_text = await article.locator('.product-price').text_content()
                price = float(price_text.replace('$', '').strip()) if price_text else 0.0
                
                # Extract image URL
                img_element = article.locator('.product-image')
                image_url = await img_element.get_attribute('src') if await img_element.count() > 0 else None
                
                # Generate ID based on name (similar to original IDs)
                product_id = f"NK-{str(i+1).zfill(3)}"
                
                # Determine category based on product name
                category = "apparel" if any(word in product_name.lower() for word in ["t-shirt", "hoodie"]) else "accessories"
                
                # Create product dictionary matching the original structure
                product = {
                    "id": product_id,
                    "name": product_name,
                    "price": price,
                    "description": product_name,  # Use name as description for now
                    "category": category,
                    "image_url": image_url
                }
                
                products.append(product)
                print(f"  ✅ Scraped: {product_name} - ${price}")
            
            await browser.close()
            
            print(f"🎉 Successfully scraped {len(products)} products")
            return products
            
    except Exception as e:
        print(f"❌ Error scraping products: {e}")
        # Fall back to loading from JSON file
        return load_nekuda_products_from_json()


def load_nekuda_products_from_json():
    """Load products from the nekuda.json file as fallback."""
    try:
        # Load from the same directory as this file
        current_dir = os.path.dirname(__file__)
        nekuda_file = os.path.join(current_dir, "nekuda.json")

        with open(nekuda_file, "r") as f:
            data = json.load(f)
            return data.get("items", [])
    except Exception as e:
        print(f"Error loading products from JSON: {e}")
        return []


async def load_products_on_startup():
    """Load products when the server starts."""
    global PRODUCTS_CACHE
    print("🚀 Loading products on server startup...")
    PRODUCTS_CACHE = await scrape_nekuda_products()
    if not PRODUCTS_CACHE:
        print("⚠️ No products loaded from scraping, using fallback JSON")
    else:
        print(f"✅ Loaded {len(PRODUCTS_CACHE)} products into memory")


@app.on_event("startup")
async def startup_event():
    """Run tasks on server startup."""
    await load_products_on_startup()


@app.get("/api/products")
async def get_products():
    """Get all products from the nekuda store."""
    global PRODUCTS_CACHE
    
    # If cache is empty, try to load products
    if not PRODUCTS_CACHE:
        print("⚠️ Products cache is empty, attempting to reload...")
        PRODUCTS_CACHE = await scrape_nekuda_products()
    
    return PRODUCTS_CACHE


@app.post("/api/products/refresh")
async def refresh_products():
    """Manually refresh the products cache by re-scraping the website."""
    global PRODUCTS_CACHE
    
    print("🔄 Manually refreshing products cache...")
    old_count = len(PRODUCTS_CACHE)
    PRODUCTS_CACHE = await scrape_nekuda_products()
    new_count = len(PRODUCTS_CACHE)
    
    return {
        "success": True,
        "message": f"Products refreshed. Old count: {old_count}, New count: {new_count}",
        "products_count": new_count
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    global PRODUCTS_CACHE
    return {
        "status": "healthy", 
        "service": "chat-service-simplified",
        "products_loaded": len(PRODUCTS_CACHE),
        "products_cache_status": "loaded" if PRODUCTS_CACHE else "empty"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    global PRODUCTS_CACHE
    return {
        "message": "nekuda Chat Commerce Agent - Frontend Only",
        "note": "All commerce actions are now handled in the frontend using CopilotKit",
        "endpoints": {
            "health": "/health",
            "products": "/api/products",
            "refresh_products": "/api/products/refresh (POST)",
        },
        "features": [
            "CopilotKit frontend actions",
            "Local state management",
            "Dynamic product loading from live Nekuda store",
            "In-memory product caching",
            "Automatic fallback to JSON if scraping fails",
        ],
        "products_loaded": len(PRODUCTS_CACHE),
    }


if __name__ == "__main__":
    print("Starting Simplified Chat Service...")
    print("Note: All commerce functionality moved to frontend CopilotKit actions")
    print("Products will be dynamically loaded from https://nekuda-store-frontend.onrender.com/")
    print("Health check: http://localhost:8000/health")
    print("Products API: http://localhost:8000/api/products")
    print("Refresh products: POST http://localhost:8000/api/products/refresh")

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
