import { useCopilotAction, useCopilotAdditionalInstructions, useCopilotChat } from '@copilotkit/react-core';
import { TextMessage, Role } from '@copilotkit/runtime-client-gql';
import { useGlobalState } from './useGlobalState';
import { getWalletToken, clearWalletToken } from '../utils/walletState';
import { classifyError, getErrorMessage, formatErrorForHistory } from '../utils/errorHandlers';
import { useCart } from '../components/ShoppingLayout';

export function useStageCompletePurchase() {
  const { stage, setStage, paymentToken, setPaymentToken, setLastPurchaseResult, setLastError } = useGlobalState();
  const { cartItems, setCartItems, total } = useCart();
  const { visibleMessages, appendMessage } = useCopilotChat();

  // Provide instructions to the AI when in this stage
  useCopilotAdditionalInstructions(
    {
      instructions: "CURRENT STATE: Payment has been collected. Now complete the purchase by calling the 'processPurchase' action. Say something like 'Processing your purchase now...' and call the action.",
      available: stage === "completePurchase" ? "enabled" : "disabled",
    },
    [stage]
  );

  // Action to process the purchase
  useCopilotAction(
    {
      name: "processPurchase",
      description: "Process the purchase with the collected payment information",
      available: stage === "completePurchase" ? "enabled" : "disabled",
      parameters: [],
      render: ({ status }) => {
        if (status === "executing") {
          return (
            <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-700">Processing your purchase with nekuda...</span>
            </div>
          );
        }
        return null;
      },
      handler: async () => {
        if (cartItems.length === 0) {
          setStage("shopping");
          return "Cannot complete purchase - your cart is empty!";
        }

        // Get the payment token
        const token = paymentToken || getWalletToken();
        
        if (!token || token === '' || token === 'token_placeholder') {
          setStage("collectPayment");
          return "Payment information is missing. Please provide payment details.";
        }

        const fixedUserId = "test_user_123";
        const fixedMerchantName = "nekuda Store";

        try {
          // Prepare conversation history
          const conversationHistory = visibleMessages.map(msg => {
            if (msg.isTextMessage()) {
              return {
                type: 'text',
                role: msg.role,
                content: msg.content,
                timestamp: msg.createdAt
              };
            } else if (msg.isActionExecutionMessage()) {
              return {
                type: 'action',
                name: msg.name,
                arguments: msg.arguments,
                timestamp: msg.createdAt
              };
            } else if (msg.isResultMessage()) {
              return {
                type: 'result',
                actionName: msg.actionName,
                result: msg.result,
                timestamp: msg.createdAt
              };
            }
            return null;
          }).filter(Boolean);

          // Prepare order details
          const orderDetails = {
            user_id: fixedUserId,
            store_id: 'nekuda',
            items: cartItems,
            total: total,
            merchant_name: fixedMerchantName,
            checkout_url: 'https://nekuda-store-frontend.onrender.com/',
            payment_method: 'nekuda_sdk',
            payment_card_token: token,
            conversation_history: conversationHistory
          };

          console.log('=== SENDING TO BACKEND ===');
          console.log('Order Details:', JSON.stringify(orderDetails, null, 2));

          // Call the Nekuda browser checkout service
          const response = await fetch('http://localhost:8001/api/browser-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderDetails)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Checkout failed');
          }

          const initialResult = await response.json();
          const purchaseId = initialResult.purchase_id;

          // Show initial status
          appendMessage(new TextMessage({
            content: `🔄 Purchase initiated with ID: ${purchaseId}. Monitoring status...`,
            role: Role.ASSISTANT
          }));

          // Poll for status updates
          const maxAttempts = 120;
          let attempts = 0;
          let lastStatus = '';

          while (attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000));

            const statusResponse = await fetch(`http://localhost:8001/api/purchase-status/${purchaseId}`);

            if (!statusResponse.ok) {
              throw new Error('Error checking purchase status');
            }

            const statusData = await statusResponse.json();

            // Update user on status changes
            if (statusData.message && statusData.message !== lastStatus) {
              lastStatus = statusData.message;
              appendMessage(new TextMessage({
                content: `📍 Status update: ${statusData.message}`,
                role: Role.ASSISTANT
              }));
            }

            if (statusData.status === "completed") {
              const result = statusData.result || {};
              const orderId = result.store_order_id || `NEKUDA-${Date.now()}`;
              const itemsSummary = cartItems.map(item => `${item.quantity}x ${item.name}`).join(', ');

              // Clear cart and payment token
              setCartItems([]);
              setPaymentToken(null);
              clearWalletToken();
              
              // Store result and go back to shopping
              setLastPurchaseResult(result);
              setStage("shopping");

              return `🎉 Purchase completed successfully!\n\n✅ Order ID: ${orderId}\n👤 User: ${fixedUserId}\n💰 Total: $${total.toFixed(2)}\n📦 Items: ${itemsSummary}\n\nYour cart has been cleared. You can continue shopping!`;
            }

            if (statusData.status === "failed") {
              const error = classifyError(statusData);
              setLastError(error);
              setStage("shopping");
              return getErrorMessage(error);
            }
          }

          throw new Error(`Purchase timed out after ${maxAttempts * 5 / 60} minutes`);

        } catch (error) {
          console.error('Purchase error:', error);
          const classifiedError = classifyError(error);
          setLastError(classifiedError);
          setStage("shopping");
          return getErrorMessage(classifiedError);
        }
      },
    },
    [stage, cartItems, total, paymentToken, visibleMessages]
  );

  // Action to go back to shopping
  useCopilotAction(
    {
      name: "continueShopping",
      description: "Continue shopping after purchase",
      available: stage === "completePurchase" ? "enabled" : "disabled",
      handler: async () => {
        setStage("shopping");
        return "Returning to shopping. How can I help you?";
      },
    },
    [stage]
  );
}