// frontend/src/types.ts

// From your architecture document for Order data structure
export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Order {
    user_id: string;
    store_id: string;
    items: OrderItem[];
    total: number;
    status: 'draft' | 'processing_checkout' | 'confirmed' | 'failed' | 'pending_payment'; // Added more statuses
    payment_mandate_id: string | null;
    checkout_url: string;
    // Added fields that might be useful from backend responses
    order_id?: string; // Assigned after successful checkout usually
    estimated_delivery?: string;
    last_error?: string; // To store error messages related to the order
}

// For Store Catalog (JSON files)
export interface StoreItem extends OrderItem { // StoreItem can inherit from OrderItem and add more
    description?: string;
    image_url?: string;
}

export interface Store {
    store_id: string;
    store_name: string;
    checkout_url: string;
    items: StoreItem[];
}

// For Chat Messages (used in ChatMessage.tsx and chatStore.ts)
export interface Message {
    id: string; // Unique ID for each message
    sender: 'user' | 'agent';
    content?: string; // Text content of the message
    timestamp: number; // Unix timestamp or ISO string
    product?: StoreItem; // Optional: for displaying a single product card
    products?: StoreItem[]; // Optional: for displaying a list of products
    imageUrl?: string; // Optional: for displaying a standalone image
    isError?: boolean; // Optional: if the message represents an error from the agent
    // Potentially add: action_name, action_params, action_result for structured logging or display
}

// For Wallet State in chatStore.ts
export interface WalletState {
    isOpen: boolean;
    isConfigured: boolean;
    mandateId: string | null; // Or a more generic paymentMethodId
    cardTokenId: string | null; // Specifically for nekuda card token
    error: string | null;
}

// For WebSocket messages (could be more specific for request/response)
// This is a generic structure, specific types for `payload` would be better.
export interface WebSocketMessage {
    type: string; // e.g., 'chat_message', 'action_request', 'action_response', 'system_notification', 'wallet_update'
    payload: any;
    actionName?: string; // For action_response
    success?: boolean;   // For action_response
    userId?: string; // To associate message with user if needed on client
}

// For Nekuda submission result (as seen in WalletWidget.tsx)
// This is illustrative, the actual type from @nekuda/react-nekuda-js might be more complex
export interface NekudaSubmissionResult {
    success?: boolean;
    status?: string;
    id?: string; // This could be the cardTokenId
    cardTokenId?: string;
    message?: string;
    [key: string]: any; // For any other properties
} 