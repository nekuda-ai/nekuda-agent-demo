import traceback
import os
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv
from browser_use import Agent, Controller, BrowserSession
from browser_use.agent.memory import MemoryConfig
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from payment_details_handler import add_payment_handler
from models import OrderIntent


load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env")
)  # Look for .env in project root


def get_llm_model(model_type="openai", is_planner=False):
    """Get the configured LLM model.

    Args:
        model_type: Type of model ('openai', 'anthropic', or 'gemini')
        is_planner: If True, returns a faster model for planning tasks

    Returns:
        BaseChatModel: Configured LLM instance

    Raises:
        ValueError: If required API key is not set or model type is unsupported
    """
    if model_type.lower() == "openai":
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable not set")

        if is_planner:
            return ChatOpenAI(
                model="gpt-4o", temperature=0, max_tokens=1000, timeout=15
            )
        else:
            return ChatOpenAI(
                model="gpt-4o-2024-08-06", temperature=0, max_tokens=4000, timeout=30
            )
    elif model_type.lower() == "anthropic":
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        if is_planner:
            return ChatAnthropic(model="claude-3-7-sonnet-20250219", temperature=0)
        else:
            return ChatAnthropic(model="claude-3-5-haiku-20241022")
    elif model_type.lower() == "gemini":
        if not os.getenv("GOOGLE_API_KEY"):
            raise ValueError("GOOGLE_API_KEY environment variable not set")

        if is_planner:
            return ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                timeout=5,
            )
        else:
            return ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                timeout=5,
            )
    else:
        raise ValueError(f"Unsupported model type: {model_type}")


async def run_order_automation(order_intent: OrderIntent):
    """Execute browser automation for checkout using Nekuda SDK payment details.

    Args:
        order_intent: Order details including items, user ID, and checkout URL
    """
    logger = logging.getLogger(__name__)
    logger.info("Starting nekuda payment flow automation...")

    # Ensure API keys are loaded
    if not os.getenv("NEKUDA_API_KEY"):
        raise ValueError("NEKUDA_API_KEY environment variable not set")

    nekuda_base_url = os.getenv("NEKUDA_BASE_URL", "http://localhost:8080")
    logger.debug(f"Using NEKUDA_BASE_URL: {nekuda_base_url}")

    controller = Controller()
    add_payment_handler(controller)

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
        # planner_llm = get_llm_model(model_type, is_planner=True) # to enable planner, uncomment this line
        memory_config = MemoryConfig(
            memory_interval=20,
            vector_store_provider="faiss",
            llm_instance=llm,
            embedder_provider=model_type,
        )
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
4. Fill form with payment details you got from the "Get Nekuda Payment Details" action (close any popup to fill the form manually)
5. validate form is filled exactly with the details you got from the "Get Nekuda Payment Details" action
6. Complete purchase
"""

    # Detailed context for the agent
    message_context = f"""Key Points:
- Match products by name exactly
- At checkout, call "Get Nekuda Payment Details" with:
  * product: exact product name from page
  * price: total price shown
  * confidence_score: 0.0-1.0 (how sure you are)
- Use ALL payment details from action response
- MUST close any modal popups AND skip verifications
- Click "Enter address manually" if needed
- User ID: {order_intent.user_id}
"""

    # 5. Initialize and Run the Agent
    logger.info("Initializing browser automation agent...")
    agent = Agent(
        task=task_prompt,
        llm=llm,
        use_vision=True,
        # to enable planner, uncomment the following lines
        # planner_llm=planner_llm,
        # use_vision_for_planner=False,
        # planner_interval=4,
        controller=controller,
        browser_session=browser_session,
        initial_actions=initial_actions,
        message_context=message_context,  # Add detailed context
        memory_config=memory_config,
        max_failures=5,
        retry_delay=3,
        generate_gif=f"test_nekuda_payment_flow_{datetime.now().strftime('%Y%m%d_%H%M%S')}.gif",
    )

    logger.info("Starting agent run...")
    try:
        # Add timeout and better error handling
        result = await asyncio.wait_for(
            agent.run(max_steps=50),
            timeout=600  # 10 minutes timeout
        )
        logger.info("Agent run completed.")
        logger.info(f"Final Result: {result.final_result()}")

        # Check for errors
        if result.errors():
            logger.warning("Errors encountered during agent run:")
            for error in result.errors():
                if error:
                    logger.warning(f"- Error: {error}")

        # Record info for debugging
        logger.debug(f"Visited URLs: {result.urls()}")
        logger.info(f"GIF saved to: {agent.settings.generate_gif}")
        logger.debug(f"Final URL visited: {result.urls()[-1] if result.urls() else 'N/A'}")

    except Exception as e:
        logger.error(f"Browser automation failed: {e}")
        logger.debug(traceback.format_exc())
        raise
