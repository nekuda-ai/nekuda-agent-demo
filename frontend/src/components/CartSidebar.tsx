import React from 'react';
import { CartCard } from './CartCard';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

interface CartSidebarProps {
    cartItems: CartItem[];
    total: number;
    onRemoveItem: (itemId: string) => void;
    onCheckout: () => void;
    isVisible: boolean;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
    cartItems,
    total,
    onRemoveItem,
    onCheckout,
    isVisible
}) => {
    if (!isVisible) return null;

    return (
        <div className="fixed right-4 top-20 z-50 animate-slide-in-right">
            <CartCard
                items={cartItems}
                total={total}
                onRemoveItem={onRemoveItem}
                onCheckout={onCheckout}
            />
        </div>
    );
};