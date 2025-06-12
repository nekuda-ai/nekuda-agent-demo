import React from 'react';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface PurchaseConfirmationProps {
    items: CartItem[];
    total: number;
    onConfirm: () => void;
    onCancel: () => void;
    status?: 'inProgress' | 'executing' | 'complete';
}

export const PurchaseConfirmation: React.FC<PurchaseConfirmationProps> = ({
    items,
    total,
    onConfirm,
    onCancel,
    status
}) => {
    const isExecuting = status === 'executing';
    
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Your Purchase</h3>
                <p className="text-gray-600">Review your order and confirm to proceed with checkout</p>
            </div>

            {/* Order Summary */}
            <div className="border rounded-lg p-4 mb-6 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-3">Order Summary</h4>
                <div className="space-y-2">
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                                {item.quantity}x {item.name}
                            </span>
                            <span className="font-medium text-gray-900">
                                ${(item.price * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="border-t mt-3 pt-3">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Total</span>
                        <span className="text-xl font-bold text-blue-600">${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Payment Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">Secure Checkout with Nekuda SDK</p>
                        <p className="mt-1">Your payment will be processed using browser automation with your stored credentials</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
                <button
                    onClick={onCancel}
                    disabled={isExecuting}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isExecuting}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    {isExecuting ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Confirm Purchase</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};