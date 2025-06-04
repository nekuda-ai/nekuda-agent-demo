import traceback
import os
from datetime import datetime
from dotenv import load_dotenv
from browser_use import Agent, Controller
from langchain_anthropic import ChatAnthropic  # Using Google's Gemini model
from pament_details_hander import (
    add_payment_details_handler_to_controller,
)
from models import OrderIntent


load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env")
)  # Look for .env in project root


async def run_order_automation(order_intent: OrderIntent):
    """Tests the full nekuda SDK payment flow with the actual SDK (no mocks)."""
    print("Starting nekuda payment flow integration test...")

    # Ensure API keys are loaded (basic check)
    if not os.getenv("NEKUDA_API_KEY"):
        print(
            "ERROR: NEKUDA_API_KEY environment variable not set. Cannot run test without it."
        )
        return
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY environment variable not set. Aborting test.")
        return

    # Print NEKUDA_BASE_URL for debugging
    nekuda_base_url = os.getenv("NEKUDA_BASE_URL", "http://localhost:8080")
    print(f"Using NEKUDA_BASE_URL: {nekuda_base_url}")

    # 1. Setup Controller
    controller = Controller()
    print("Adding payment details handler to controller...")
    add_payment_details_handler_to_controller(controller)

    # 2. Setup LLM
    print("Initializing LLM (Google Gemini)...")
    llm = ChatAnthropic(model="claude-3-5-sonnet-20240620")

    # 3. Define Initial Actions
    initial_actions = [{"go_to_url": {"url": order_intent.checkout_url}}]

    # 4. Define the Agent Task Prompt
    task_prompt = f"""
You are a payment testing assistant. Your goal is to test the Nekuda SDK payment flow on the Nekuda store website.
Follow the steps carefully to verify that all parts of the payment API integration work correctly.
User ID for all nekuda SDK operations: '{order_intent.user_id}'.

Follow these steps EXACTLY in order:

Phase 1: Navigate the nekuda Store and Add the Hat to Cart
1. You are now on the nekuda store homepage: {order_intent.checkout_url}
2. Locate the "nekuda hat" product tile
3. Click the "Add to Cart" button for the hat
4. Click on the "Checkout" button to proceed to the payment page

Phase 2: Use nekuda SDK Payment Flow (EXACTLY AS DESCRIBED)
On the checkout page, follow these steps precisely to test each nekuda SDK action:

STEP 1: Call the 'Create nekuda Purchase Intent' action with these EXACT parameters:
- user_id: "{order_intent.user_id}"
- product_name: "{order_intent.order_items[0].name}"
- product_description: "Black nekuda hat with logo"
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
- The response should contain "nekuda card details revealed. Card Number:" followed by card details.
- If the response contains an error, call 'done' with the error details.
- Otherwise, extract the following details: Card Number, Expiry Date, CVV, and Name on Card.

Phase 3: Enter Payment Details
1. Use the payment details from the SDK response to fill out the payment form:
   - Email: test.user@example.com
   - Card Number: [The card number from step 6]
   - Expiry Date: [The expiry date from step 6]
   - CVC: [The CVV from step 6]
   - Full name on card: [The name on card from step 6]
2. Make sure country is set to "United States"
3. Enter ZIP code: [The ZIP code from step 6]

Don't actually complete the purchase - after filling in all the fields, call the 'done' action with a detailed summary of:
1. The mandate ID that was created
2. The card details that were retrieved (mask all but last 4 digits of the card number)
3. Whether each step in the nekuda SDK flow completed successfully
"""

    # 5. Initialize and Run the Agent
    print("\nInitializing agent...")
    agent = Agent(
        task=task_prompt,
        llm=llm,
        controller=controller,
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
