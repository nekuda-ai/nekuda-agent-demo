import React from 'react';

interface Product {
    id: string;
    name: string;
    price: number;
    quantity?: number;
    image_url?: string;
}

interface ProductUpdateProps {
    product: Product;
    action: 'added' | 'removed' | 'updated';
    quantity?: number;
    previousQuantity?: number;
}

export const ProductUpdate: React.FC<ProductUpdateProps> = ({ 
    product, 
    action, 
    quantity = 1,
    previousQuantity 
}) => {
    const getActionMessage = () => {
        switch (action) {
            case 'added':
                return `Added ${quantity}x to cart`;
            case 'removed':
                return previousQuantity && previousQuantity > quantity 
                    ? `Removed ${previousQuantity - quantity}x from cart`
                    : 'Removed from cart';
            case 'updated':
                return `Updated quantity to ${quantity}`;
            default:
                return '';
        }
    };

    const getActionColor = () => {
        switch (action) {
            case 'added':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'removed':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'updated':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    return (
        <div className={`rounded-lg border p-4 ${getActionColor()} max-w-sm`}>
            <div className="flex items-start space-x-3">
                {/* Product Image */}
                {product.image_url ? (
                    <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                
                {/* Product Details */}
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">${product.price.toFixed(2)} each</p>
                    <p className="text-sm font-medium mt-1">{getActionMessage()}</p>
                </div>
            </div>
        </div>
    );
};