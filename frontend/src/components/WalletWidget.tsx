/// <reference types="vite/client" />

import React from 'react';
import {
    NekudaWalletProvider,
    NekudaPaymentForm
} from '@nekuda/react-nekuda-js';
import { useClickOutside } from '../hooks/useClickOutside';

interface WalletFormProps {
    onSuccess: (cardTokenId: string) => void;
    onClose?: () => void;
    variant?: 'modal' | 'inline';
}

const WalletForm: React.FC<WalletFormProps> = ({ onSuccess, onClose, variant = 'modal' }) => {
    const handlePaymentSave = (formData: any) => {
        console.log('Payment saved:', formData);
        // Extract token ID from formData or generate one for testing
        const tokenId = formData?.id || formData?.cardTokenId || `token_${Date.now()}`;
        onSuccess(tokenId);
    };

    return (
        <div className={variant === 'inline' ? "bg-white rounded-xl shadow-lg p-6 max-w-md w-full" : ""}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className={variant === 'inline' ? "text-xl font-bold text-gray-900" : "text-2xl font-bold text-gray-900"}>
                        {variant === 'inline' ? 'Payment Information Required' : 'Add Card'}
                    </h2>
                    {variant === 'inline' && (
                        <p className="text-sm text-gray-600 mt-1">Please add your card details to complete the purchase</p>
                    )}
                </div>
                {variant === 'modal' && onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <NekudaPaymentForm onSave={handlePaymentSave}>
                <button
                    type="submit"
                    className="mt-8 w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-sm transition-colors duration-150 ease-in-out"
                >
                    {variant === 'inline' ? 'Save Card & Continue' : 'Save Card Details'}
                </button>
            </NekudaPaymentForm>
        </div>
    );
};

interface WalletWidgetProps {
    isOpen?: boolean;
    onClose?: () => void;
    onSuccess?: (cardTokenId: string) => void;
    variant?: 'modal' | 'inline';
}

export const WalletWidget: React.FC<WalletWidgetProps> = ({ isOpen = true, onClose, onSuccess, variant = 'modal' }) => {
    // Only log when actually visible
    if (variant === 'modal' && isOpen) {
        console.log('🎯 WalletWidget modal opened');
    } else if (variant === 'inline') {
        console.log('🎯 WalletWidget inline rendering');
    }
    const userId = 'test_user_123';

    const handleSuccess = (cardTokenId: string) => {
        console.log('Wallet interaction successful with cardTokenId:', cardTokenId);
        if (onSuccess) {
            onSuccess(cardTokenId);
        }
        if (onClose && variant === 'modal') {
            onClose();
        }
    };

    const handleProviderSuccess = (successInfo: any) => {
        console.log('Success:', successInfo);
    };

    const handleProviderError = (errorInfo: any) => {
        console.error('Error:', errorInfo);
        alert(`Error: ${errorInfo.validationError?.userMessage || errorInfo.apiError?.userMessage || 'Unknown error'}`);
    };

    // Get Nekuda public key from environment variables
    const nekudaPublicKey = import.meta.env.VITE_NEKUDA_PUBLIC_KEY || "your_nekuda_public_key_fallback";

    // Use click outside hook only for modal variant
    const walletRef = useClickOutside<HTMLDivElement>(
        () => onClose && onClose(),
        isOpen && variant === 'modal'
    );

    // Don't render if not open (for modal variant)
    if (variant === 'modal' && !isOpen) return null;
    
    // Render inline variant (for chat)
    if (variant === 'inline') {
        return (
            <NekudaWalletProvider 
                publicKey={nekudaPublicKey} 
                userId={userId}
                onSuccess={handleProviderSuccess}
                onError={handleProviderError}
            >
                <WalletForm
                    onSuccess={handleSuccess}
                    variant="inline"
                />
            </NekudaWalletProvider>
        );
    }
    
    // Render modal variant (sliding panel from right)
    return (
        <div className="fixed right-4 top-20 z-50 animate-slide-in-right">
            <div ref={walletRef} className="bg-white rounded-xl shadow-2xl p-8 w-96">
                <NekudaWalletProvider 
                    publicKey={nekudaPublicKey} 
                    userId={userId}
                    onSuccess={handleProviderSuccess}
                    onError={handleProviderError}
                >
                    <WalletForm
                        onSuccess={handleSuccess}
                        onClose={() => {
                            console.log('Closing wallet');
                            onClose && onClose();
                        }}
                        variant="modal"
                    />
                </NekudaWalletProvider>
            </div>
        </div>
    );
}; 