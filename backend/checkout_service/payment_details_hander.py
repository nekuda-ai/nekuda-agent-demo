"""
Payment details handler for browser-use controller.

Provides custom actions for obtaining payment details via nekuda SDK:
1. Create nekuda Purchase Intent - Creates a purchase mandate and returns a mandate_id
2. Get nekuda Card Reveal Token - Gets a short-lived token for revealing card details
3. Get Payment Details from nekuda SDK - Gets actual card details using the token
4. Get Payment Details (Mock) - Provides mock payment details for testing

All actions store their results in the `extracted_content` field of ActionResult,
which makes them accessible to the LLM model (data field is not accessible to the model).

Usage:
    controller = Controller()
    add_payment_details_handler_to_controller(controller)
"""

import logging
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from browser_use import Controller, ActionResult
from nekuda import (
    NekudaClient,
)
from models import PurchaseIntent, FlexibleMandateData

logger = logging.getLogger(__name__)


class PaymentDetails(BaseModel):
    """Payment details model."""

    card_number: str
    expiry_date: str
    cvv: str
    name_on_card: str
    billing_zip: Optional[str] = None


# Initialize the NekudaClient once at module level
def get_nekuda_client():
    """Get the NekudaClient."""
    try:
        client = NekudaClient.from_env()
        error_msg = f"NekudaClient initialized. Using Base URL: {client.base_url}"
        logger.info(error_msg)
        print(error_msg)
        return client
    except ValueError as exc:
        error_msg = f"Failed to initialize NekudaClient: {exc}"
        logger.error(error_msg)
        print(error_msg)
        print(
            "Ensure NEKUDA_API_KEY (required) and NEKUDA_BASE_URL (optional) environment variables are set."
        )
        return None
    except Exception as e:
        error_msg = (
            f"An unexpected error occurred during NekudaClient initialization: {e}"
        )
        logger.error(error_msg)
        print(error_msg)
        return None


def add_payment_details_handler_to_controller(controller: Controller):
    """Register payment details actions with the provided controller.

    This function doesn't return the controller, it just adds actions to it.
    """
    nekuda_client = get_nekuda_client()
    print(f"Registering payment actions with client: {nekuda_client}")


    @controller.action("Create nekuda Purchase Intent", param_model=PurchaseIntent)
    async def create_purchase_intent(
        purchase_intent: PurchaseIntent
    ) -> ActionResult:
        """Creates a purchase mandate with nekuda to get a mandate_id."""
        if not nekuda_client:
            return ActionResult(
                extracted_content="ERROR: NekudaClient not initialized. Check NEKUDA_API_KEY and NEKUDA_BASE_URL.",
                action_type="Create nekuda Purchase Intent",
                error="nekudaClient not initialized.",
            )

        # Log the received data for debugging
        logger.info(f"Received purchase_intent: {purchase_intent}")
        logger.info(f"Mandate data type: {type(purchase_intent.mandate_data)}")
        
        mandate_data = purchase_intent.mandate_data
        mandate_data.mode = "sandbox" # mode can be "sandbox" or "live"
        
        # Log the processed mandate data
        logger.info(f"Processed mandate_data: {mandate_data}")

        try:
            print(
                f"Attempting to create mandate for user_id: {purchase_intent.user_id} with request_id: {mandate_data.request_id}"
            )
            # Note: The conversation history context is passed through the browser automation agent
            # which has access to the full order context including conversation history
            user_api = nekuda_client.user(purchase_intent.user_id)
            mandate_response = user_api.create_mandate(mandate_data)

            created_mandate_id = mandate_response.mandate_id
            if not created_mandate_id:
                error_msg = "Error: mandate_id not returned by nekuda backend."
                print(error_msg)
                return ActionResult(
                    extracted_content=error_msg,
                    action_type="Create nekuda Purchase Intent",
                    error=error_msg,
                )

            success_msg = (
                f"nekuda mandate created successfully. Mandate ID: {created_mandate_id}"
            )
            print(success_msg)
            return ActionResult(
                extracted_content=success_msg,
                action_type="Create nekuda Purchase Intent",
                include_in_memory=True,
            )
        except Exception as exc:
            error_msg = f"Error creating nekuda mandate: {str(exc)}"
            print(error_msg)
            return ActionResult(
                extracted_content=error_msg,
                action_type="Create nekuda Purchase Intent",
                error=error_msg,
            )

    print("✅ Registered action: Create nekuda Purchase Intent")

    @controller.action("Get nekuda Card Reveal Token")
    async def get_card_reveal_token(user_id: str, mandate_id: str) -> ActionResult:
        """Gets a short-lived card reveal token using a mandate_id."""
        if not nekuda_client:
            return ActionResult(
                extracted_content="ERROR: NekudaClient not initialized. Check NEKUDA_API_KEY and NEKUDA_BASE_URL.",
                action_type="Get nekuda Card Reveal Token",
                error="NekudaClient not initialized.",
            )

        try:
            print(
                f"Requesting card reveal token for user_id: {user_id}, mandate_id: {mandate_id}"
            )
            user_api = nekuda_client.user(user_id)
            token_data = user_api.request_card_reveal_token(mandate_id)

            reveal_token = token_data.reveal_token
            if not reveal_token:
                error_msg = "Error: reveal_token not returned by nekuda backend."
                print(error_msg)
                return ActionResult(
                    extracted_content=error_msg,
                    action_type="Get nekuda Card Reveal Token",
                    error=error_msg,
                )

            # Include full token in the extracted_content
            success_msg = f"nekuda card reveal token obtained. User ID: {user_id}. Reveal Token: {reveal_token}"
            print(success_msg)
            return ActionResult(
                extracted_content=success_msg,
                action_type="Get nekuda Card Reveal Token",
                include_in_memory=True,
            )
        except Exception as exc:
            error_msg = f"Error getting card reveal token: {str(exc)}"
            print(error_msg)
            return ActionResult(
                extracted_content=error_msg,
                action_type="Get nekuda Card Reveal Token",
                error=error_msg,
            )

    print("✅ Registered action: Get nekuda Card Reveal Token")

    @controller.action("Get Payment Details from nekuda SDK")
    async def get_payment_details_from_sdk(
        user_id: str, reveal_token: str
    ) -> ActionResult:
        """Reveals card details from nekuda using a one-time reveal_token."""
        if not nekuda_client:
            return ActionResult(
                extracted_content="ERROR: NekudaClient not initialized. Check NEKUDA_API_KEY and NEKUDA_BASE_URL.",
                action_type="Get Payment Details from nekuda SDK",
                error="NekudaClient not initialized.",
            )

        try:
            print(
                f"Attempting to reveal card details for user_id: {user_id} using token (first 10 chars): {reveal_token[:10]}..."
            )
            user_api = nekuda_client.user(user_id)
            nekuda_card_details = user_api.reveal_card_details(reveal_token)

            # Process the expiry date format
            expiry_date = nekuda_card_details.card_expiry_date
            if (
                expiry_date
                and len(expiry_date.split("/")) == 2
                and len(expiry_date.split("/")[1]) == 4
            ):
                month, year = expiry_date.split("/")
                expiry_date = f"{month}/{year[-2:]}"

            # Create a clear, parse-friendly string with explicit labels
            card_details_str = (
                f"Card Number: {nekuda_card_details.card_number}, "
                f"Expiry Date: {expiry_date}, "
                f"CVV: {nekuda_card_details.card_cvv}, "
                f"Name on Card: {nekuda_card_details.cardholder_name}, "
                f"Zip Code: {nekuda_card_details.zip_code}, "
                f"Email: {nekuda_card_details.email}, "
                f"Phone Number: {nekuda_card_details.phone_number}, "
                f"Billing Address: {nekuda_card_details.billing_address}, "
                f"City: {nekuda_card_details.city}, "
                f"State: {nekuda_card_details.state}"
            )

            success_msg = f"nekuda card details revealed. {card_details_str}"
            print(success_msg)
            return ActionResult(
                extracted_content=success_msg,
                action_type="Get Payment Details from nekuda SDK",
                include_in_memory=True,
            )
        except Exception as exc:
            error_msg = f"Error revealing card details: {str(exc)}"
            print(error_msg)
            return ActionResult(
                extracted_content=error_msg,
                action_type="Get Payment Details from nekuda SDK",
                error=error_msg,
            )

    print("✅ Registered action: Get Payment Details from nekuda SDK")


# Example of how the AI would be instructed (conceptual):
# 1. Extract user_id, product_name, price, etc. from the current order context.
# 2. Call "Create nekuda Purchase Intent" with these details.
#    - Result: { "data": { "mandate_id": "xyz", "user_id": "123" } }
# 3. Extract mandate_id and user_id from the result.
# 4. Call "Get nekuda Card Reveal Token" with user_id and mandate_id.
#    - Result: { "data": { "reveal_token": "abc", "user_id": "123" } }
# 5. Extract reveal_token and user_id.
# 6. Call "Get Payment Details from nekuda SDK" with user_id and reveal_token.
#    - Result: { "data": { "card_number": "...", "expiry_date": "...", ... } }
# 7. Use the payment details to fill the form.
