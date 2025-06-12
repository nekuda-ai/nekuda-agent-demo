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


def get_llm_model(model_type="openai", is_planner=False):
    """Get the configured LLM model. Supports 'openai' and 'anthropic'.

    Args:
        model_type: Type of model ('openai' or 'anthropic')
        is_planner: If True, returns a faster model for planning tasks
    """
    if model_type.lower() == "openai":
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable not set")

        if is_planner:
            print("Initializing Planner LLM (OpenAI GPT-3.5 Turbo)...")
            return ChatOpenAI(
                model="gpt-3.5-turbo", temperature=0, max_tokens=1000, timeout=15
            )
        else:
            print("Initializing Main LLM (OpenAI GPT-4 Mini)...")
            return ChatOpenAI(
                model="gpt-4o-mini", temperature=0, max_tokens=4000, timeout=30
            )
    elif model_type.lower() == "anthropic":
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        if is_planner:
            print("Initializing Planner LLM (Claude 3 Haiku)...")
            return ChatAnthropic(model="claude-3-haiku-20241022", temperature=0)
        else:
            print("Initializing Main LLM (Claude 3.5 Haiku)...")
            return ChatAnthropic(model="claude-3-5-haiku-20241022")
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
            "width": 1020,
            "height": 1020,
        },
    )

    # 2. Setup LLM - Use OpenAI by default, can be changed to "anthropic"
    try:
        model_type = "anthropic"  # Change to "openai" if needed
        llm = get_llm_model(model_type)
        # planner_llm = get_llm_model(model_type, is_planner=True)
    except ValueError as e:
        print(f"ERROR: {e}")
        return

    # 3. Define Initial Actions
    initial_actions = [{"go_to_url": {"url": order_intent.checkout_url}, "wait": {"seconds": 5}}]

    # 4. Define the Agent Task Prompt
    # Calculate total price and create items summary
    total_price = sum(item.price * item.quantity for item in order_intent.order_items)
    items_list = [
        f"{item.quantity}x {item.name} (${item.price} each)"
        for item in order_intent.order_items
    ]
    items_summary = ", ".join(items_list)

    # Concise task message
    task_prompt = f"""Complete a purchase on the Nekuda store using the Nekuda SDK for payment.

Order details:
- Items: {items_summary}
- Total: ${total_price}
- User ID: {order_intent.user_id}
- purchase intent: {order_intent}

Steps:
1. Add the exact items to cart (verify each product by name before clicking)
2. Go to checkout
3. Use Nekuda SDK actions in order: Create Purchase Intent → Get Card Reveal Token → Get Payment Details
4. Fill checkout form with the revealed payment details, never complete OTP/verification windows, always close them
5. Complete the purchase
"""

    # Detailed context for the agent
    message_context = """Important Guidelines:

**Cart Management:**
- Always scroll to see all products first
- Identify products by their text/name, NOT by button index
- Verify correct items, and quantities are in cart before checkout
- For multiple quantities, click Add to Cart multiple times

**Nekuda SDK Flow:**
1. Create Purchase Intent filling the purchase intent with the following details:
- user_id: {order_intent.user_id}
- product: {order_intent.product}
- product_description: {order_intent.product_description}
- price: {order_intent.price}
- currency: {order_intent.currency}
- merchant: {order_intent.merchant}
- conversation_context: {order_intent.conversation_history}
- human_messages: {order_intent.human_messages}
- additional_details: {order_intent.additional_details}

2. Extract Mandate ID from response
3. Get Card Reveal Token using the Mandate ID (id should be digits only)
4. Extract Reveal Token from response
5. Get Payment Details using the Reveal Token
6. Extract all payment fields from response

**Checkout Form:**
- Email: test.user@example.com (ALWAYS exit OTP windows without completing it)
- IMPORTANT: If popup window is detected, close it
- IMPORTANT: Click "Enter address manually" button if present before filling address
- Use all details from SDK response (card, expiry, CVV, name, address, etc.)
- Phone number goes at the end of form
- Default CVV to 123 if not provided
- Billing address should be the same as shipping address (keep the checkbox the same)

**Error Handling:**
- Max 2 retries per action
- Max 3 retries for final Pay button
- Close/bypass any popups
- Don't toggle checkboxes
- ALWAYS close OTP window including email and phone verification
"""

    # 5. Initialize and Run the Agent
    print("\nInitializing agent...")
    agent = Agent(
        task=task_prompt,
        llm=llm,
        controller=controller,
        browser_session=browser_session,
        initial_actions=initial_actions,
        use_vision=True,
        message_context=message_context,  # Add detailed context
        max_failures=3,  # Limit consecutive failures
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
