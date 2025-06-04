import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        const trimmedInput = input.trim();
        if (trimmedInput && !disabled) {
            onSend(trimmedInput);
            setInput('');
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => { // Changed to HTMLTextAreaElement for multiline
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline in textarea on Enter (without Shift)
            handleSend();
        }
    };

    return (
        <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
                <textarea
                    rows={1} // Start with one row, expands automatically
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Shift+Enter for new line)"
                    disabled={disabled}
                    className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-y-auto bg-gray-50 disabled:opacity-60 disabled:bg-gray-100 transition-colors duration-150 ease-in-out text-sm sm:text-base"
                    style={{ maxHeight: '120px' }} // Limit max height to prevent excessive expansion
                    onInput={(e) => {
                        const textarea = e.currentTarget;
                        textarea.style.height = 'auto'; // Reset height to shrink if text is deleted
                        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Grow to content or max height
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={disabled || !input.trim()}
                    className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out shadow-sm text-sm sm:text-base"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                        <path d="M3.105 3.105a1.5 1.5 0 012.122-.001l11.22 11.22a1.5 1.5 0 01-2.121 2.122L3.105 5.227a1.5 1.5 0 01-.001-2.122zM3.105 16.895a1.5 1.5 0 01.001-2.121l11.22-11.22a1.5 1.5 0 012.122 2.122L5.227 16.895a1.5 1.5 0 01-2.122.001z" />
                        <path d="M16.895 3.105a1.5 1.5 0 012.122.001l-11.22 11.22a1.5 1.5 0 01-2.121-2.122l11.22-11.22zM16.895 16.895a1.5 1.5 0 01.001 2.121l-11.22-11.22a1.5 1.5 0 012.122-2.122l11.22 11.22a1.5 1.5 0 01-.001 2.122zM10 1.5a1.5 1.5 0 011.5 1.5v14a1.5 1.5 0 01-3 0v-14A1.5 1.5 0 0110 1.5z" /> {/* Using a send icon path - this is a placeholder, actual send icon would be better */}
                    </svg>
                    <span className="hidden sm:inline ml-1">Send</span>
                </button>
            </div>
        </div>
    );
}; 