import { useCopilotAction, useCopilotAdditionalInstructions } from '@copilotkit/react-core';
import { useGlobalState } from './useGlobalState';
import { getWalletToken } from '../utils/walletState';
import { useCart } from '../components/ShoppingLayout';

export function useStageShopping() {
  const { stage, setStage, paymentToken } = useGlobalState();
  const { cartItems, total } = useCart();

  // Provide instructions to the AI when in shopping stage
  useCopilotAdditionalInstructions(
    {
      instructions: "CURRENT STATE: Shopping mode. Help the user browse products, manage their cart, and when they're ready to checkout, use the 'startCheckout' action.",
      available: stage === "shopping" ? "enabled" : "disabled",
    },
    [stage]
  );

  // Action to start checkout process
  useCopilotAction(
    {
      name: "startCheckout",
      description: "Start the checkout process for items in the cart",
      available: stage === "shopping" ? "enabled" : "disabled",
      parameters: [],
      handler: async () => {
        if (cartItems.length === 0) {
          return "Your cart is empty. Please add some items before checking out.";
        }

        // Check if we already have payment information
        const existingToken = getWalletToken() || paymentToken;
        const hasValidToken = existingToken && existingToken !== '' && existingToken !== 'token_placeholder';

        if (hasValidToken) {
          // We have payment, go directly to purchase
          setStage("completePurchase");
          return `Starting checkout for ${cartItems.length} items totaling $${total.toFixed(2)}. Payment information found, processing purchase...`;
        } else {
          // Need to collect payment
          setStage("collectPayment");
          return `Starting checkout for ${cartItems.length} items totaling $${total.toFixed(2)}. I'll need to collect your payment information.`;
        }
      },
    },
    [stage, cartItems, total, paymentToken]
  );
}