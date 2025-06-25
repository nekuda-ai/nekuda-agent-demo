"""Data models for the Nekuda SDK checkout service demo.

This module contains Pydantic models used for request/response validation
and data transfer between the frontend, backend, and browser automation.
"""

import uuid
import json
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator
from nekuda import MandateData


class BrowserCheckoutRequest(BaseModel):
    """Request model for initiating browser-based checkout automation.
    
    This model represents the data sent from the frontend to start a
    checkout process using browser automation with Nekuda SDK payment.
    """

    user_id: str
    store_id: str
    items: List[Dict[str, Any]]
    total: float
    merchant_name: str = "nekuda Store"
    checkout_url: str
    payment_method: Optional[str] = None
    payment_card_token: Optional[str] = None
    conversation_context: Optional[Dict[str, Any]] = None  # Full conversation context with intent, session_id, messages
    human_messages: Optional[List[str]] = None  # User messages only, extracted from conversation
    conversation_history: Optional[List[Dict[str, Any]]] = None  # Deprecated, for backward compatibility


class OrderItem(BaseModel):
    """Represents a single item in an order.
    
    Attributes:
        item_id: Optional unique identifier for the item
        name: Display name of the item
        quantity: Number of units ordered
        price: Price per unit
        customizations: Optional list of item customizations
    """

    item_id: Optional[str] = None
    name: str
    quantity: int
    price: float
    customizations: Optional[List[Dict[str, Any]]] = None


class DeliveryAddress(BaseModel):
    """Physical address for order delivery."""

    street_address: str
    city: str
    state: str
    zip_code: str
    apartment_suite_etc: Optional[str] = None


class DeliveryDetails(BaseModel):
    """Complete delivery information for an order.
    
    Attributes:
        delivery_time_requested: Requested delivery time ("ASAP" or ISO format)
        delivery_address: Physical delivery location
        contact_name: Name of the recipient
        contact_phone: Contact phone number
        delivery_instructions: Optional special instructions
    """

    delivery_time_requested: str
    delivery_address: DeliveryAddress
    contact_name: str
    contact_phone: str
    delivery_instructions: Optional[str] = None


class PaymentSummary(BaseModel):
    """Financial breakdown of an order.
    
    Attributes:
        subtotal: Sum of all item prices
        estimated_tax: Calculated tax amount
        estimated_delivery_fee: Delivery charge
        estimated_total: Sum of subtotal, tax, and delivery fee
    """

    subtotal: float
    estimated_tax: float = 0.0
    estimated_delivery_fee: float = 0.0
    estimated_total: float

class FlexibleMandateData(MandateData):
    """Extended MandateData with flexible parsing for frontend inputs.
    
    This class extends Nekuda's MandateData to handle various input formats
    that might come from the frontend, including JSON strings that need
    to be parsed into proper dictionaries.
    """

    @field_validator('conversation_context', mode='before')
    @classmethod
    def parse_conversation_context(cls, v):
        if isinstance(v, str):
            try:
                # First try to parse as JSON
                return json.loads(v)
            except json.JSONDecodeError:
                # If it's not valid JSON, wrap it in a dictionary
                # This handles cases like 'add 2 shirts' -> {'message': 'add 2 shirts'}
                return {'message': v}
        return v

    @field_validator('additional_details', mode='before')
    @classmethod
    def parse_additional_details(cls, v):
        if isinstance(v, str):
            try:
                # First try to parse as JSON
                return json.loads(v)
            except json.JSONDecodeError:
                # If it's not valid JSON, wrap it in a dictionary
                return {'details': v}
        return v
    
    @field_validator('human_messages', mode='before')
    @classmethod
    def parse_human_messages(cls, v):
        if isinstance(v, str):
            # If it's a string, wrap it in a list
            return [v]
        elif v is None:
            return []
        return v


class PurchaseIntent(BaseModel):
    """Purchase intent model with User ID and MandateData."""
    user_id: str
    mandate_data: Union[FlexibleMandateData, Dict[str, Any]] = Field(
        description="""The mandate data for the purchase intent. Contains the following fields:

        Product Information:
        - product: Optional[str] = None - The product name/identifier
        - product_description: Optional[str] = None - Detailed product description
        - price: Optional[float] = None - Product price
        - currency: Optional[str] = None - Currency code (e.g., USD, EUR)
        - merchant: Optional[str] = None - Merchant/store name
        - merchant_link: Optional[str] = None - Link to merchant's website/store

        Contextual/Conversational Metadata:
        - confidence_score: Optional[float] = None - AI confidence in the mandate extraction
        - conversation_context: Optional[Mapping[str, Any]] = None - Context from conversation (can be JSON string)
        - human_messages: Optional[List[str]] = None - Relevant human messages
        - additional_details: Optional[Mapping[str, Any]] = None - Any additional contextual data (can be JSON string)

        Internal Fields:
        - request_id: str - Unique idempotency key (automatically generated)"""
    )


class OrderIntent(BaseModel):
    """Represents a user's complete order intent for browser automation.
    
    This model accumulates all necessary information for the browser
    automation agent to complete a purchase, including items, merchant
    details, and conversation context.
    
    Attributes:
        intent_id: Unique identifier for this order intent
        user_id: Nekuda user identifier
        session_id: Optional session tracking ID
        store_id: Merchant's store identifier
        checkout_url: URL where checkout should be performed
        merchant_name: Display name of the merchant
        delivery_instructions: Optional special delivery notes
        order_items: List of items to purchase
        payment_summary: Calculated payment breakdown
        conversation_history: Optional conversation context
        created_at: Timestamp when intent was created
        updated_at: Timestamp of last update
        last_updated: Deprecated, use updated_at
    """

    intent_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: Optional[str] = None
    store_id: Optional[str] = None
    checkout_url: Optional[str] = None
    merchant_name: Optional[str] = None
    delivery_instructions: Optional[str] = None
    order_items: List[OrderItem] = []
    payment_summary: Optional[PaymentSummary] = None
    conversation_history: Optional[List[Dict[str, Any]]] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.now)

    def touch(self):
        """Update the timestamp to reflect recent changes."""
        self.updated_at = datetime.utcnow()

    def calculate_summary(self):
        """Calculate the payment summary based on current items.
        
        Note: Tax and delivery fee calculation is simplified for this demo.
        In production, these would be calculated based on location, merchant
        rules, and other factors.
        """
        if not self.order_items:
            self.payment_summary = None
            self.touch()
            return

        subtotal = sum(item.quantity * item.price for item in self.order_items)
        tax = 0.0  # Simplified for demo
        delivery_fee = 0.0  # Simplified for demo

        self.payment_summary = PaymentSummary(
            subtotal=subtotal,
            estimated_tax=tax,
            estimated_delivery_fee=delivery_fee,
            estimated_total=subtotal + tax + delivery_fee,
        )
        self.touch()

    def update_status(self, new_status: str):
        """Update the order status and timestamp."""
        self.status = new_status
        self.touch()
