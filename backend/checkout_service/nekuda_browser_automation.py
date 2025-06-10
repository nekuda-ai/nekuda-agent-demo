import traceback
import os
from datetime import datetime
from dotenv import load_dotenv
from browser_use import Agent, Controller, BrowserSession
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from payment_details_hander import (
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

    # Create browser session with optimized timing settings and larger viewport
    browser_session = BrowserSession(
        user_data_dir=None,
        headless=False,
        highlight_elements=True,
        window_size={
            "width": 1920,
            "height": 1080,
        },  # Set larger viewport to show all products
    )

    # 2. Setup LLM - Use OpenAI by default, can be changed to "anthropic"
    try:
        llm = get_llm_model("anthropic")  # Change to "anthropic" to switch back
    except ValueError as e:
        print(f"ERROR: {e}")
        return

    # 3. Define Initial Actions
    initial_actions = [{"go_to_url": {"url": order_intent.checkout_url}}]

    # 4. Define the Agent Task Prompt
    # Calculate total price and create items summary
    total_price = sum(item.price * item.quantity for item in order_intent.order_items)
    items_list = [
        f"{item.quantity}x {item.name} (${item.price} each)"
        for item in order_intent.order_items
    ]
    items_summary = ", ".join(items_list)

    task_prompt = f"""
You are a payment testing assistant. Your goal is to test the Nekuda SDK payment flow on the Nekuda store website. 
Follow the steps carefully to verify that all parts of the payment API integration work correctly.
DO NOT get stuck repeating the same actions. If something doesn't work after 2 attempts, try an alternative approach.
CRUCIAL: Always use extract_content or scroll_to_text to identify products before clicking buttons.
WARNING: Button indices are NOT reliable - clicking by index often adds wrong products to cart!
VIEWPORT ISSUE: Button indices change when page scrolls - always ensure full page visibility first!
User ID for all nekuda SDK operations: '{order_intent.user_id}'.

Follow these steps EXACTLY in order:

Phase 1: Navigate the nekuda Store and Add Items to Cart
1. You are now on the nekuda store homepage: {order_intent.checkout_url}
2. VIEWPORT SETUP: First, ensure all products are visible by scrolling to see the full page
3. IMPORTANT: Before clicking any "Add to Cart" button, first identify the product by reading the text near it
4. TARGET PRODUCTS: You need to find and add these exact items: {items_summary}
5. For each item needed, follow this EXACT process:
{chr(10).join([f"   - Scroll to or find text containing '{item.name}' on the page" + f"{chr(10)}   - Verify this is the correct product (name and price match)" + f"{chr(10)}   - Find the 'Add to Cart' button that belongs to THIS specific product" + f"{chr(10)}   - DO NOT use click_element_by_index - use text-based or position-based clicking" + (f"{chr(10)}   - Click 'Add to Cart' {item.quantity} times for this specific product" if item.quantity > 1 else f"{chr(10)}   - Click 'Add to Cart' once for this specific product") + f"{chr(10)}   - Use extract_content to verify the correct item was added to cart" for item in order_intent.order_items])}
6. VERIFY: After adding items, check that you have the correct products in cart: {items_summary}
7. Look for and click the "Checkout" button to proceed to payment

Phase 2: Use nekuda SDK Payment Flow (EXACTLY AS DESCRIBED)
On the checkout page, follow these steps precisely to test each nekuda SDK action:

STEP 1: Call the 'Create nekuda Purchase Intent' action with these EXACT parameters:
- user_id: "{order_intent.user_id}"
- product_name: "Multiple Items: {items_summary}"
- price: {total_price}
- currency: "USD"
- merchant_name: "nekuda Store"
- conversation_context: {{"notes": "SDK integration test - multi-item cart", "test_run": true, "items": {len(order_intent.order_items)}}}
- human_messages: ["Testing the nekuda SDK purchase flow with multiple items"]

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
3. The process success - "payment success" will appear on the page.

BUTTON CLICKING RULES:
- NEVER click "Add to Cart" buttons by index number
- Always verify you're clicking the button for the correct product
- Use text proximity to determine which "Add to Cart" button belongs to which product

CRITICAL PROGRESS RULES:
- Maximum retries for clicking pay button is 3 times
- Do not check or unckeck any checkboxes
- Close any popups that appear or try baypass it in any way
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
        result = await agent.run(max_steps=20)
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
