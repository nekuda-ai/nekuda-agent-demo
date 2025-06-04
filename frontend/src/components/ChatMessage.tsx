import React, { useState, useEffect } from 'react';
import { Message } from '../types'; // Assuming types.ts will be created in src/types
// import Lottie from 'react-lottie'; // Removed unused import
// Assuming processing.json or a similar Lottie file for agent thinking animation
// import thinkingAnimationData from '../assets/thinking.json'; 

interface ChatMessageProps {
    message: Message;
    isLastMessage?: boolean; // To potentially stop animation if a new message arrives
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLastMessage }) => {
    const isUser = message.sender === 'user';
    const [animatedText, setAnimatedText] = useState('');
    const [showTypingIndicator, setShowTypingIndicator] = useState(false);

    useEffect(() => {
        const currentContent = message.content || '';
        // Reset animation/typing state on new message or if it's not the last one anymore
        setAnimatedText('');
        setShowTypingIndicator(false);

        if (isUser || message.product || message.products || message.imageUrl || message.isError) {
            setAnimatedText(currentContent);
        } else if (message.sender === 'agent' && isLastMessage) {
            // Only animate agent messages if they are the last one
            setShowTypingIndicator(true);
            const words = currentContent.split(/(\s+)/); // Split by spaces, keeping spaces
            let wordIndex = 0;

            const timer = setInterval(() => {
                if (wordIndex < words.length) {
                    setAnimatedText(prev => prev + words[wordIndex]);
                    wordIndex++;
                } else {
                    clearInterval(timer);
                    setShowTypingIndicator(false);
                }
            }, 70); // Faster animation speed

            return () => {
                clearInterval(timer);
                setShowTypingIndicator(false); // Clean up typing indicator
            };
        } else {
            // If it's an older agent message, just show the full content immediately
            setAnimatedText(currentContent);
        }
    }, [message, isUser, isLastMessage]); // Rerun if message content or isLastMessage changes

    const messageBaseStyle = "px-4 py-2.5 rounded-xl max-w-lg lg:max-w-xl xl:max-w-2xl break-words";
    const userMessageStyle = `${messageBaseStyle} bg-blue-500 text-white rounded-br-none`;
    const agentMessageStyle = `${messageBaseStyle} bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm`;
    const errorMessageStyle = `${messageBaseStyle} bg-red-50 text-red-700 border border-red-200 rounded-bl-none shadow-sm`;

    const renderContent = () => {
        if (message.isError) {
            return <div className="whitespace-pre-wrap">{message.content}</div>;
        }
        if (message.product) {
            return (
                <div className="product-card p-1 bg-white max-w-xs rounded-md overflow-hidden">
                    {message.product.image_url && (
                        <img src={message.product.image_url} alt={message.product.name} className="w-full h-36 object-cover mb-2" />
                    )}
                    <div className="p-2">
                        <h3 className="font-semibold text-sm text-gray-800">{message.product.name}</h3>
                        {message.product.price != null && <p className="text-xs text-blue-600 font-medium">${message.product.price.toFixed(2)}</p>}
                        {message.product.description && <p className="text-xs text-gray-500 mt-1">{message.product.description}</p>}
                    </div>
                </div>
            );
        }
        if (message.products && message.products.length > 0) {
            return (
                <div className="products-list space-y-2.5">
                    {message.content && <p className="font-medium text-sm text-gray-800 mb-2">{message.content}</p>}
                    {message.products.map((product) => (
                        <div key={product.id} className="product-card-sm p-2.5 border border-gray-200 rounded-lg bg-white flex items-start space-x-3 hover:shadow-md transition-shadow duration-150">
                            {product.image_url && (
                                <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                            )}
                            <div className="flex-grow">
                                <h4 className="font-semibold text-xs text-gray-700">{product.name}</h4>
                                {product.price != null && <p className="text-xs text-blue-500">${product.price.toFixed(2)}</p>}
                                {/* Add to cart button - conceptual, needs wiring */}
                                {/* <button className="text-xs text-blue-500 hover:underline mt-1">Add to cart</button> */}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        if (message.imageUrl) {
            return (
                <div className="p-1 bg-white rounded-md overflow-hidden">
                    {message.content && <p className="font-medium text-sm text-gray-800 mb-1 px-1">{message.content}</p>}
                    <img src={message.imageUrl} alt="Chat image" className="max-w-xs rounded-md" />
                </div>
            );
        }
        // For agent messages that are not special content and are still typing
        if (showTypingIndicator && message.sender === 'agent') {
            return (
                <div className="flex items-center space-x-1.5">
                    {/* Replace with actual Lottie animation if available */}
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
            );
        }
        return <div className="whitespace-pre-wrap">{animatedText}</div>;
    };

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3`}>
            <div className={message.isError ? errorMessageStyle : (isUser ? userMessageStyle : agentMessageStyle)}>
                {renderContent()}
            </div>
            <div className={`text-xs mt-1 ${isUser ? 'text-right text-gray-400 mr-1' : 'text-left text-gray-400 ml-1'}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    );
}; 