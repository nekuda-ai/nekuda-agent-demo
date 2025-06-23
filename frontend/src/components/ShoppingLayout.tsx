import React, { useState, useContext, createContext, ReactNode } from 'react';
import { CopilotChat } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import './CopilotChatContainer.css';
import { ShoppingCart } from './ShoppingCart';
import { WalletWidget } from './WalletWidget';
import { CartSidebar } from './CartSidebar';
import { GlobalStateProvider, useGlobalState } from '../hooks/useGlobalState';

// Create a context for cart state to share between components
interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

interface CartContextType {
    cartItems: CartItem[];
    setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
    total: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

const ShoppingLayoutContent: React.FC = () => {
    const { stage } = useGlobalState();
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [showCartSidebar, setShowCartSidebar] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Load products to get image URLs
    React.useEffect(() => {
        fetch('http://localhost:8000/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error('Failed to load products:', err));
    }, []);

    // Show cart sidebar whenever items are added
    React.useEffect(() => {
        if (cartItems.length > 0) {
            setShowCartSidebar(true);
        }
    }, [cartItems.length]);

    return (
        <CartContext.Provider value={{ cartItems, setCartItems, total }}>
            <>
                <div className="flex h-screen bg-gray-100 font-sans">
                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Header */}
                        <div className="bg-white shadow-md border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <img src="/logo.png" alt="nekuda Logo" className="h-7 w-auto mr-4" />
                                </div>
                                <div className="flex items-center space-x-4">
                                    {/* Cart Toggle Button */}
                                    <button
                                        onClick={() => setShowCartSidebar(!showCartSidebar)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            cartItems.length > 0 
                                                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        } relative`}
                                        title="Toggle cart"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                            />
                                        </svg>
                                        {cartItems.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                                            </span>
                                        )}
                                    </button>

                                    {/* Wallet Button */}
                                    <button
                                        onClick={() => setIsWalletOpen(true)}
                                        className="p-2 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        title="Configure wallet"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Hidden Shopping Cart Component (for actions) */}
                        <div style={{ display: 'none' }}>
                            <ShoppingCart />
                        </div>

                        {/* Chat Interface */}
                        <div className="flex-1 flex flex-col bg-white">
                            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                                <div className="copilot-chat-container flex-1">
                                    <CopilotChat
                                        instructions="You are a helpful shopping assistant for Nekuda Store. Help customers browse products, manage their cart, and complete purchases. Use the available actions to interact with the shopping system."
                                        labels={{
                                            title: "Shopping Assistant",
                                            initial: "Hi! I can help you browse products and manage your shopping cart. Try saying 'show me all products' or 'add a t-shirt to my cart'.",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cart Sidebar */}
                    <CartSidebar
                        cartItems={cartItems.map(item => {
                            const product = products.find(p => p.id === item.id);
                            return {
                                ...item,
                                image_url: product?.image_url || item.image_url
                            };
                        })}
                        total={total}
                        onRemoveItem={(itemId) => {
                            setCartItems(prev => prev.filter(item => item.id !== itemId));
                        }}
                        onCheckout={() => {
                            // Checkout is handled by CartCard which will append the message
                            console.log("Checkout triggered from sidebar");
                        }}
                        isVisible={showCartSidebar}
                        onClose={() => setShowCartSidebar(false)}
                    />
                </div>

                    {/* Wallet Widget Modal */}
                    <WalletWidget
                        isOpen={isWalletOpen}
                        onClose={() => setIsWalletOpen(false)}
                    />
                </>
            </CartContext.Provider>
    );
};

export const ShoppingLayout: React.FC = () => {
    return (
        <GlobalStateProvider>
            <ShoppingLayoutContent />
        </GlobalStateProvider>
    );
};