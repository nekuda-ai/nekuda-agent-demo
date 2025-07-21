import { useCopilotAction, useCopilotAdditionalInstructions } from '@copilotkit/react-core';
import { WalletWidget } from '../components/WalletWidget';
import { useGlobalState } from './useGlobalState';
import { saveWalletToken, getWalletToken } from '../utils/walletState';

export function useStageCollectPayment() {
  const { stage, setStage, setPaymentToken, paymentToken } = useGlobalState();

  // Provide instructions to the AI when in this stage
  useCopilotAdditionalInstructions(
    {
      instructions: "CURRENT STATE: You need to collect payment information. Say 'I need to collect your payment information to complete the purchase. Please click anywhere in the chat if the payment form doesn't appear immediately.' and then call the 'collectPaymentInfo' action.",
      available: stage === "collectPayment" ? "enabled" : "disabled",
    },
    [stage]
  );

  // Action to collect payment information
  useCopilotAction(
    {
      name: "collectPaymentInfo",
      description: "Collect payment information from the user",
      available: stage === "collectPayment" ? "enabled" : "disabled",
      parameters: [],
      renderAndWaitForResponse: ({ respond, status }) => {
        if (status !== "executing") {
          return <></>;
        }

        // Check if we already have a payment token
        const existingToken = getWalletToken() || paymentToken;
        if (existingToken && existingToken !== '' && existingToken !== 'token_placeholder') {
          // Payment already exists, automatically move to next stage
          setTimeout(() => {
            respond("Payment information already exists");
            setStage("completePurchase");
          }, 0);
          return (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700">Payment information already on file. Proceeding with purchase...</p>
            </div>
          );
        }

        // Show payment collection widget
        return (
          <WalletWidget
            variant="inline"
            onSuccess={(cardTokenId) => {
              console.log('Payment collected:', cardTokenId);
              saveWalletToken(cardTokenId);
              setPaymentToken(cardTokenId);
              respond("Payment information collected successfully");
              setStage("completePurchase"); // Automatically move to purchase stage
            }}
          />
        );
      },
    },
    [stage, paymentToken]
  );
}