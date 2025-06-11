import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from nekuda import MandateData


class BrowserCheckoutRequest(BaseModel):
    """Request for the browser checkout."""

    user_id: str
    store_id: str
    items: List[Dict[str, Any]]
    total: float
    merchant_name: str = "nekuda Store"
    checkout_url: str


class OrderItem(BaseModel):
    """Order item model."""

    item_id: Optional[str] = None
    name: str
    quantity: int
    price: float
    customizations: Optional[List[Dict[str, Any]]] = None  # Placeholder


class DeliveryAddress(BaseModel):
    """Delivery address model."""

    street_address: str
    city: str
    state: str
    zip_code: str
    apartment_suite_etc: Optional[str] = None


class DeliveryDetails(BaseModel):
    """Delivery details model."""

    delivery_time_requested: (
        str  # Initially string (e.g., "ASAP", "2025-06-15T18:30:00Z")
    )
    delivery_address: DeliveryAddress
    contact_name: str
    contact_phone: str
    delivery_instructions: Optional[str] = None


class PaymentSummary(BaseModel):
    """Payment summary model."""

    subtotal: float
    estimated_tax: float = 0.0
    estimated_delivery_fee: float = 0.0
    estimated_total: float  # To be calculated: subtotal + tax + delivery_fee

class PurchaseIntent(BaseModel):
    """Purchase intent model with User ID and MandateData."""
    user_id: str
    mandate_data: MandateData


class OrderIntent(BaseModel):
    """Represents the user's intention to order, accumulating items."""

    intent_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: Optional[str] = None
    store_id: Optional[str] = None
    checkout_url: Optional[str] = None
    merchant_name: Optional[str] = None
    delivery_instructions: Optional[str] = None
    order_items: List[OrderItem] = []
    payment_summary: Optional[PaymentSummary] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.now)

    def touch(self):
        self.updated_at = datetime.utcnow()

    def calculate_summary(self):
        if not self.order_items:
            self.payment_summary = None
            self.touch()
            return

        subtotal = sum(item.quantity * item.price for item in self.order_items)
        # Placeholder for tax and delivery fee logic for now
        # These could be fetched based on restaurant_id or other configurations later
        tax = 0.0
        delivery_fee = 0.0

        self.payment_summary = PaymentSummary(
            subtotal=subtotal,
            estimated_tax=tax,
            estimated_delivery_fee=delivery_fee,
            estimated_total=subtotal + tax + delivery_fee,
        )
        self.touch()

    def update_status(self, new_status: str):
        self.status = new_status
        self.touch()
