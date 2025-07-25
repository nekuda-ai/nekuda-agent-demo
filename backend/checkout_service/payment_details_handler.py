"""
Payment details handler for browser-use controller.

Provides a single unified action that handles all Nekuda SDK operations
for browser automation workflows. This handler stores purchase intent
from the frontend and updates it with runtime information from the
browser agent before processing payment details.
"""

import logging
from pydantic import BaseModel, Field
from browser_use import Controller, ActionResult
from nekuda import NekudaClient, MandateData

logger = logging.getLogger(__name__)

# Global storage for purchase intent from frontend
stored_purchase_intent = None


class RuntimeMandateUpdate(BaseModel):
    """Runtime updates for mandate data from browser agent"""

    product: str = Field(description="Exact product name from checkout page")
    price: float = Field(description="Total price from checkout page")
    confidence_score: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Agent confidence (0-1) that this is correct",
    )


def store_purchase_intent(purchase_intent_data: dict):
    """Store purchase intent from frontend for later use"""
    global stored_purchase_intent
    stored_purchase_intent = purchase_intent_data
    logger.info(
        f"Stored purchase intent for user: {purchase_intent_data.get('user_id')}"
    )


def get_nekuda_client():
    """Initialize and return the NekudaClient instance.

    Returns:
        NekudaClient: Configured client instance or None if initialization fails.
    """
    try:
        client = NekudaClient.from_env()
        logger.info(f"NekudaClient initialized. Using Base URL: {client.base_url}")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize NekudaClient: {e}")
        return None


def add_payment_handler(controller: Controller):
    """Register payment action with controller."""
    nekuda_client = get_nekuda_client()

    @controller.action("Get Nekuda Payment Details", param_model=RuntimeMandateUpdate)
    async def get_nekuda_payment_details(update: RuntimeMandateUpdate) -> ActionResult:
        """Single action to get payment details from Nekuda SDK.

        Updates stored mandate with runtime info and returns payment details.
        """
        if not nekuda_client:
            return ActionResult(
                extracted_content="ERROR: NekudaClient not initialized",
                error="NekudaClient not initialized",
            )

        if not stored_purchase_intent:
            return ActionResult(
                extracted_content="ERROR: No purchase intent stored",
                error="No purchase intent found",
            )

        try:
            # 1. Update mandate data with runtime information
            mandate_dict = stored_purchase_intent["mandate_data"].copy()
            mandate_dict["product"] = update.product
            mandate_dict["price"] = update.price
            mandate_dict["confidence_score"] = update.confidence_score

            # Create MandateData instance
            mandate_data = MandateData(**mandate_dict)

            user_id = stored_purchase_intent["user_id"]
            logger.debug(
                f"Processing payment for user {user_id}, product: {update.product}, price: ${update.price}"
            )

            # 2. Create mandate
            user_api = nekuda_client.user(user_id)
            mandate_response = user_api.create_mandate(mandate_data)
            mandate_id = mandate_response.mandate_id

            if not mandate_id:
                raise Exception("No mandate_id returned")

            logger.debug(f"Created mandate: {mandate_id}")

            # 3. Get card reveal token
            token_data = user_api.request_card_reveal_token(mandate_id)
            reveal_token = token_data.token

            if not reveal_token:
                raise Exception("No reveal_token returned")

            logger.debug(f"Got reveal token: {reveal_token[:10]}...")

            # 4. Get payment details
            card_details = user_api.reveal_card_details(reveal_token)

            # Format expiry date
            expiry_date = card_details.card_exp
            if (
                expiry_date
                and "/" in expiry_date
                and len(expiry_date.split("/")[1]) == 4
            ):
                month, year = expiry_date.split("/")
                expiry_date = f"{month}/{year[-2:]}"

            # Create formatted response
            payment_info = (
                f"Payment details retrieved successfully:\n"
                f"Card Number: {card_details.card_number}\n"
                f"Expiry: {expiry_date}\n"
                f"CVV: {card_details.card_cvv or '123'}\n"
                f"Name: {card_details.card_holder}\n"
                f"Email: {card_details.email}\n"
                f"Phone: {card_details.phone_number}\n"
                f"Address: {card_details.billing_address}\n"
                f"City: {card_details.city}\n"
                f"State: {card_details.state}\n"
                f"Zip: {card_details.zip_code}"
            )

            logger.debug("Successfully retrieved all payment details")
            return ActionResult(extracted_content=payment_info, include_in_memory=True)

        except Exception as e:
            error_msg = f"Error getting payment details: {str(e)}"
            logger.error(error_msg)
            return ActionResult(extracted_content=error_msg, error=error_msg)

    logger.info("Registered action: Get Nekuda Payment Details")
