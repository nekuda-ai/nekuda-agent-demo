import traceback
import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from browser_use import Agent, Controller, BrowserSession
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from payment_details_handler_simplified import (
    add_simplified_payment_handler,
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
            print("Initializing Planner LLM (OpenAI GPT-4o-mini)...")
            return ChatOpenAI(
                model="gpt-4o", temperature=0, max_tokens=1000, timeout=15
            )
        else:
            print("Initializing Main LLM (OpenAI GPT-4o)...")
            return ChatOpenAI(
                model="gpt-4o-2024-08-06", temperature=0, max_tokens=4000, timeout=30
            )
    elif model_type.lower() == "anthropic":
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        if is_planner:
            print("Initializing Planner LLM (Claude 3 Haiku)...")
            return ChatAnthropic(model="claude-3-7-sonnet-20250219", temperature=0)
        else:
            print("Initializing Main LLM (Claude 3.5 Haiku)...")
            return ChatAnthropic(model="claude-3-5-haiku-20241022")
    elif model_type.lower() == "gemini":
        if not os.getenv("GOOGLE_API_KEY"):
            raise ValueError("GOOGLE_API_KEY environment variable not set")

        print("Configuring Gemini 2.5 Flash for browser-use compatibility...")

        if is_planner:
            print("Initializing Planner LLM (Gemini 2.5 Flash)...")
            return ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=0,
            )
        else:
            print("Initializing Main LLM (Gemini 2.5 Flash)...")
            return ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=0,
            )
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
    print("Adding simplified payment details handler to controller...")
    add_simplified_payment_handler(controller)

    # Create browser session with optimized timing settings and larger viewport
    browser_session = BrowserSession(
        user_data_dir=None,
        headless=False,
        highlight_elements=True,
        window_size={
            "width": 1020,
            "height": 1020,
        },
        viewport_expansion=-1,
        include_dynamic_attributes=True,
    )

    # 2. Setup LLM - Use OpenAI by default, can be changed to "anthropic"
    try:
        model_type = "openai"  # Change to "openai" if needed
        llm = get_llm_model(model_type)
        planner_llm = get_llm_model(model_type, is_planner=True)
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
    task_prompt = f"""Purchase {items_summary} for ${total_price} using Nekuda payment.

Steps:
1. Add items to cart (match by name)
2. Go to checkout and validate you see the checkout form
3. Use "Get Nekuda Payment Details" action with actual product name and total price
4. Fill form with payment details you got from the "Get Nekuda Payment Details" action (close any popups)
5. Complete purchase
"""

    # Detailed context for the agent
    message_context = f"""Key Points:
- Match products by name exactly
- At checkout, call "Get Nekuda Payment Details" with:
  * product: exact product name from page
  * price: total price shown
  * confidence_score: 0.0-1.0 (how sure you are)
- Use ALL payment details from action response
- Close any popups (email/phone verification)
- Click "Enter address manually" if needed
- User ID: {order_intent.user_id}
"""

    # 5. Initialize and Run the Agent
    print("\nInitializing agent...")
    agent = Agent(
        task=task_prompt,
        llm=llm,
        use_vision=True,
        planner_llm=planner_llm,
        use_vision_for_planner=False,
        planner_interval=4,
        controller=controller,
        browser_session=browser_session,
        initial_actions=initial_actions,
        message_context=message_context,  # Add detailed context
        max_failures=3,  # Limit consecutive failures
        generate_gif=f"test_nekuda_payment_flow_{datetime.now().strftime('%Y%m%d_%H%M%S')}.gif",
    )

    print("\nStarting agent run...")
    try:
        # Add timeout and better error handling
        result = await asyncio.wait_for(
            agent.run(max_steps=20),
            timeout=600  # 10 minutes timeout
        )
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
        print("\n--- An Top-Level Exception Occurred ---")
        print(f"Error: {e}")
        traceback.print_exc()

    print("\nNekuda payment flow test finished.")
