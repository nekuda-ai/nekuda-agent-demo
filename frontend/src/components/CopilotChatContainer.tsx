import React, { useState } from 'react';
import { CopilotChat } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import './CopilotChatContainer.css';
import { ShoppingCart } from './ShoppingCart';
import { WalletWidget } from './WalletWidget';

export const CopilotChatContainer: React.FC = () => {
    const [isWalletOpen, setIsWalletOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-100 font-sans">
                {/* Header */}
                <div className="bg-white shadow-md border-b border-gray-200 px-6 py-4 sticky top-0 z-10 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <img src="/logo.png" alt="nekuda Logo" className="h-7 w-auto mr-4" />
                        </div>
                        <div className="flex items-center space-x-4">
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
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6" style={{ display: 'none' }}>
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center text-gray-500 mb-8">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <p className="mt-5 text-lg font-medium">Welcome to nekuda Demo!</p>
                                <p className="mt-1 text-sm text-gray-400">
                                    Chat with the AI assistant below. Try "show me products" or "add a nekuda t-shirt to cart"
                                </p>
                            </div>
                            <div>
                                <ShoppingCart />
                            </div>
                        </div>
                    </div>

                    {/* Chat Interface - takes full remaining space */}
                    <div className="flex-1 flex flex-col bg-white">
                        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                            <div className="copilot-chat-container flex-1">
                                <CopilotChat
                                    instructions="You are a helpful shopping assistant for Nekuda Store. Help customers browse products, manage their cart, and complete purchases. Use the available actions to interact with the shopping system."
                                    labels={{
                                        title: "Shopping Assistant",
                                        initial: "Hi! I can help you browse products and manage your shopping cart. What would you like to do?",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wallet Widget Modal with sliding animation */}
            <WalletWidget
                isOpen={isWalletOpen}
                onClose={() => setIsWalletOpen(false)}
            />
        </>
    );
}; 