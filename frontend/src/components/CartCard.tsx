import React from 'react';
import { useCopilotChat } from '@copilotkit/react-core';
import { TextMessage, Role } from '@copilotkit/runtime-client-gql';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

interface CartCardProps {
    items: CartItem[];
    total: number;
    onRemoveItem?: (itemId: string) => void;
    onUpdateQuantity?: (itemId: string, quantity: number) => void;
    onCheckout?: () => void;
    showCheckoutButton?: boolean;
}

export const CartCard: React.FC<CartCardProps> = ({ 
    items, 
    total, 
    onRemoveItem, 
    onCheckout,
    showCheckoutButton = true 
}) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const { appendMessage } = useCopilotChat();
    
    const handleCheckout = () => {
        // Append user message to complete purchase
        appendMessage(
            new TextMessage({
                content: "complete purchase",
                role: Role.User,
            })
        );
        
        // Call the onCheckout callback if provided
        onCheckout?.();
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Shopping Cart</h3>
                <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
            </div>

            {/* Cart Items */}
            {items.length === 0 ? (
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-gray-500 text-sm">Your cart is empty</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            {/* Product Image */}
                            {item.image_url ? (
                                <img 
                                    src={item.image_url} 
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-500">${item.price} × {item.quantity}</span>
                                    <span className="text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Remove Button */}
                            {onRemoveItem && (
                                <button
                                    onClick={() => onRemoveItem(item.id)}
                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                    aria-label={`Remove ${item.name}`}
                                >
                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Divider */}
            {items.length > 0 && (
                <>
                    <div className="border-t border-gray-200 my-4"></div>
                    
                    {/* Total */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Total</span>
                        <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                    </div>

                    {/* Checkout Button */}
                    {showCheckoutButton && onCheckout && (
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                            <span>Checkout</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </>
            )}
        </div>
    );
};