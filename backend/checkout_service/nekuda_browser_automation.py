import traceback
import os
from datetime import datetime
from dotenv import load_dotenv
from browser_use import Agent, Controller, BrowserSession
from langchain_openai import ChatOpenAI  # Switched from ChatAnthropic to ChatOpenAI
from pament_details_hander import (
    add_payment_details_handler_to_controller,
)
from models import OrderIntent


load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env")
)  # Look for .env in project root


def get_llm_model(model_type="openai"):
    """Get the configured LLM model. Supports 'openai' and 'anthropic'."""
    if model_type.lower() == "openai":
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable not set")
        print("Initializing LLM (OpenAI GPT-4 Mini)...")
        return ChatOpenAI(
            model="gpt-4o-mini", temperature=0, max_tokens=4000, timeout=30
        )
    elif model_type.lower() == "anthropic":
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        print("Initializing LLM (Claude 3.5 Sonnet)...")
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(model="claude-3-5-sonnet-20240620")
    else:
        raise ValueError(f"Unsupported model type: {model_type}")


async def run_order_automation(order_intent: OrderIntent):
    """Tests the full nekuda SDK payment flow with the actual SDK (no mocks)."""
    print("Starting nekuda payment flow integration test...")

    # Ensure API keys are loaded (basic check)
    if not os.getenv("NEKUDA_API_KEY"):
        print(
            "ERROR: NEKUDA_API_KEY environment variable not set. Cannot run test without it."
        )
        return

    # Print NEKUDA_BASE_URL for debugging
    nekuda_base_url = os.getenv("NEKUDA_BASE_URL", "http://localhost:8080")
    print(f"Using NEKUDA_BASE_URL: {nekuda_base_url}")

    controller = Controller()
    print("Adding payment details handler to controller...")
    add_payment_details_handler_to_controller(controller)

    # Create browser session with optimized timing settings
    browser_session = BrowserSession(
        user_data_dir=None,
        headless=False,
        highlight_elements=True,
    )

    # 2. Setup LLM - Use OpenAI by default, can be changed to "anthropic"
    try:
        llm = get_llm_model("openai")  # Change to "anthropic" to switch back
    except ValueError as e:
        print(f"ERROR: {e}")
        return

    # 3. Define Initial Actions
    initial_actions = [{"go_to_url": {"url": order_intent.checkout_url}}]
    # 4. Define the Agent Task Prompt
    task_prompt = f"""
You are a payment testing assistant. Your goal is to test the Nekuda SDK payment flow on the Nekuda store website. 
Follow the steps carefully to verify that all parts of the payment API integration work correctly.
YOU NEED TO BE FAST AND ACCURATE, BUT ALSO THOROUGH - DO NOT SKIP VALIDATION STEPS.
User ID for all nekuda SDK operations: '{order_intent.user_id}'.

Follow these steps EXACTLY in order:

Phase 1: Navigate the nekuda Store and Add the {order_intent.order_items[0].name} to Cart
1. You are now on the nekuda store homepage: {order_intent.checkout_url}
2. Locate the {order_intent.order_items[0].name} product tile
3. double check the price is {order_intent.order_items[0].price}
4. Click the "Add to Cart" button for the {order_intent.order_items[0].name}
5. Click on the "Checkout" button to proceed to the payment page

Phase 2: Use nekuda SDK Payment Flow (EXACTLY AS DESCRIBED)
On the checkout page, follow these steps precisely to test each nekuda SDK action:

STEP 1: Call the 'Create nekuda Purchase Intent' action with these EXACT parameters:
- user_id: "{order_intent.user_id}"
- product_name: "{order_intent.order_items[0].name}"
- price: {order_intent.order_items[0].price}
- currency: "USD"
- merchant_name: "nekuda Store"
- conversation_context: {{"notes": "SDK integration test", "test_run": true}}
- human_messages: ["Testing the nekuda SDK purchase flow"]

STEP 2: After completing Step 1, carefully examine the response.
- The response should contain "Mandate ID: "
- Extract the complete Mandate ID value (2).
- If the response contains an error, call 'done' with the error details.

STEP 3: Call the 'Get nekuda Card Reveal Token' action with these EXACT parameters:
- user_id: "{order_intent.user_id}"
- mandate_id: [The exact Mandate ID you extracted in step 2]

STEP 4: After completing Step 3, carefully examine the response.
- The response should contain "nekuda card reveal token obtained. User ID: {order_intent.user_id}. Reveal Token:"
- Extract the complete Reveal Token value (starting with "tok_").
- If the response contains an error, call 'done' with the error details.

STEP 5: Call the 'Get Payment Details from nekuda SDK' action with these EXACT parameters:
- user_id: "{order_intent.user_id}"
- reveal_token: [The exact Reveal Token you extracted in step 4]

STEP 6: After completing Step 5, carefully examine the response.
- The response should contain "nekuda card details revealed." followed by card details.
- If the response contains an error, throw error and send the error to the chat
- Otherwise, extract the following details: Card Number, Expiry Date, CVV, and Name on Card, Zip Code, Email, Phone Number, Billing Address.

Phase 3: Enter Payment Details (CRITICAL: VALIDATE BEFORE PROCEEDING)
1. Use the payment details from the SDK response to fill out the payment form:
   - Email: test.user@example.com <>IMPORTANT: If you see that the system recognized this email and use "link" payment, you will recognized the UI have already filled the details of the shipment and other data and you can just click on pay and skip the rest of the steps<>
   - Full name on card: [The name on card from step 6]

2. Fill the address details:
    ⚠️ CRITICAL FIRST STEP: BEFORE entering ANY address information:
    - Look for the button "Enter address manually" 
    - If this button exists, you MUST click on it FIRST before filling any address fields
    - If this button does not exist, then proceed to fill address fields
    
    After clicking "Enter address manually" (if it exists), fill the address details:
        - Billing Address: [The billing address from step 6]
        - City: [The city from step 6]
        - State: [The state from step 6]
        - Zip Code: [The zip code from step 6]

3. Fill the payment details:   
   - Card Number: [The card number from step 6]
   - Expiry Date: [The expiry date from step 6]
   - CVC: [The CVV from step 6] if not exists use 123

Phase 4: Complete the Purchase
1. Enter Phone Number in the end of the form: [The phone number from step 6]
2. If the "Pay" button is hidden or cannot be clicked, please review which fields are missing and fill them by step 6.
2. Click the "Pay" button to complete the purchase.
3. if the process success - "payment success" will appear on the page. if not exist and fail the process and show it in the chat

CRITICAL:
- Maximum retries for clicking pay button is 3 times.
- DO not Fill in the cardholder name and check the billing info checkbox.
"""

    # 5. Initialize and Run the Agent
    print("\nInitializing agent...")
    agent = Agent(
        task=task_prompt,
        llm=llm,
        controller=controller,
        browser_session=browser_session,  # Use the incognito browser session
        initial_actions=initial_actions,
        use_vision=False,
        generate_gif=f"test_nekuda_payment_flow_{datetime.now().strftime('%Y%m%d_%H%M%S')}.gif",
    )

    print("\nStarting agent run...")
    try:
        result = await agent.run(max_steps=30)
        print("\nAgent run completed.")
        print("Final Result:", result.final_result())

        # Check for errors
        if result.errors():
            print("\nErrors encountered during agent run:")
            for error in result.errors():
                try:
                    print(f"- Step {error.step_id}: {error.error_message}")
                except AttributeError:
                    print(f"- Error: {error}")

        # Record info for debugging
        print("\nVisited URLs:", result.urls())
        print(f"\nGIF saved to: {agent.settings.generate_gif}")
        print(f"Final URL visited: {result.urls()[-1] if result.urls() else 'N/A'}")

    except Exception as e:
        print(f"\n--- An Top-Level Exception Occurred ---")
        print(f"Error: {e}")
        traceback.print_exc()

    print("\nNekuda payment flow test finished.")
