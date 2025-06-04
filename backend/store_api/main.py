# Simplified chat service - now that CopilotKit handles everything frontend-only
import os
import json
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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


class CheckoutRequest(BaseModel):
    """Request body for checkout."""

    user_id: str
    store_id: str
    items: list
    total: float


def load_nekuda_products():
    """Load products from the nekuda.json file."""
    try:
        # Load from the same directory as this file
        current_dir = os.path.dirname(__file__)
        nekuda_file = os.path.join(current_dir, "nekuda.json")

        with open(nekuda_file, "r") as f:
            data = json.load(f)
            return data.get("items", [])
    except Exception as e:
        print(f"Error loading products: {e}")
        return []


@app.get("/api/products")
async def get_products():
    """Get all products from the nekuda store."""
    products = load_nekuda_products()
    return products


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "chat-service-simplified"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "nekuda Chat Commerce Agent - Frontend Only",
        "note": "All commerce actions are now handled in the frontend using CopilotKit",
        "endpoints": {
            "health": "/health",
            "products": "/api/products",
        },
        "features": [
            "CopilotKit frontend actions",
            "Local state management",
            "Product API from JSON files",
        ],
    }


if __name__ == "__main__":
    print("Starting Simplified Chat Service...")
    print("Note: All commerce functionality moved to frontend CopilotKit actions")
    print(f"Health check: http://localhost:8000/health")
    print(f"Products API: http://localhost:8000/api/products")

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
