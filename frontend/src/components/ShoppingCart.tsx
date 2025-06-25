import React, { useState, useEffect, useMemo } from 'react';
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { CartCard } from './CartCard';
import { CartContext } from './ShoppingLayout';
import { ProductUpdate } from './ProductUpdate';
import { useStageShopping } from '../hooks/useStageShopping';
import { useStageCollectPayment } from '../hooks/useStageCollectPayment';
import { useStageCompletePurchase } from '../hooks/useStageCompletePurchase';

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image_url?: string;
}

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export function ShoppingCart() {
    // Try to use cart context if available, otherwise use local state
    const cartContext = React.useContext(CartContext);
    const [localCartItems, setLocalCartItems] = useState<CartItem[]>([]);

    // Use context cart items if available, otherwise use local state
    const cartItems = cartContext?.cartItems || localCartItems;
    const setCartItems = cartContext?.setCartItems || setLocalCartItems;

    const [purchaseHistory, setPurchaseHistory] = useState<string[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use stage hooks
    useStageShopping();
    useStageCollectPayment();
    useStageCompletePurchase();

    // Clear cart on app open/refresh
    useEffect(() => {
        setCartItems([]);
        console.log('Cart cleared on app open/refresh');
    }, []);

    // Load products from backend API
    useEffect(() => {
        const loadProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:8000/api/products');
                if (!response.ok) {
                    throw new Error('Failed to load products');
                }
                const productsData = await response.json();
                setProducts(productsData);
                setError(null);
            } catch (err) {
                console.error('Error loading products:', err);
                setError('Failed to load products from backend');
                // Fallback to empty array
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    // Calculate total (memoized to prevent unnecessary recalculations)
    const total = useMemo(() => {
        const calculatedTotal = cartItems.reduce((sum, item) => {
            // Ensure price and quantity are valid numbers
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;
            return sum + (price * quantity);
        }, 0);
        // Round to 2 decimal places to prevent floating point issues
        return Math.round(calculatedTotal * 100) / 100;
    }, [cartItems]);

    // Memoize cart data for Copilot to prevent infinite re-renders
    const copilotValue = useMemo(() => {
        const itemCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        return {
            cartItems: cartItems.map(item => ({
                id: item.id,
                name: item.name,
                price: Number(item.price) || 0,
                quantity: Number(item.quantity) || 0,
                subtotal: ((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)
            })),
            total: total.toFixed(2),
            itemCount,
            hasItems: cartItems.length > 0,
            // Only include essential product info to reduce payload
            productCatalog: products.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price
            })),
            loading,
            error: error ? error : undefined
        };
    }, [cartItems, total, products, loading, error]);

    // Make cart state readable to Copilot
    useCopilotReadable({
        description: "Shopping cart state with calculated totals. Use this data directly without recalculating.",
        value: copilotValue,
    });

    // Action to view all products
    useCopilotAction({
        name: "viewProducts",
        description: "Show all available products in the store. Triggers when user asks to view products.",
        parameters: [],
        followUp: false,
        handler: async () => {
            if (loading) {
                return "Loading products from server...";
            }

            if (error) {
                return `Error loading products: ${error}`;
            }

            if (products.length === 0) {
                return "No products available at the moment.";
            }

        },
        render: () => {
            if (loading) {
                return <div className="p-4 text-center text-gray-600">Loading products from server...</div>;
            }

            if (error) {
                return <div className="p-4 text-center text-red-600">Error loading products: {error}</div>;
            }

            if (products.length === 0) {
                return <div className="p-4 text-center text-gray-600">No products available at the moment.</div>;
            }

            return (
                <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        🏪 <span className="ml-2">nekuda Store Products</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start space-x-3">
                                    {product.image_url && (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 text-sm">{product.name}</h4>
                                        <p className="text-xs text-gray-600 mt-1">{product.description}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-lg font-bold text-green-600">${product.price}</span>
                                            <span className="text-xs text-gray-500">ID: {product.id}</span>
                                        </div>
                                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        },
    });

    // Action to search products
    useCopilotAction({
        name: "searchProducts",
        description: "Search for products by name, description, or category",
        parameters: [
            {
                name: "query",
                type: "string",
                description: "Search query to find products",
                required: true,
            },
        ],
        handler: async ({ query }: { query: string }) => {
            if (loading) {
                return "Loading products from server...";
            }

            if (error) {
                return `Error loading products: ${error}`;
            }

            const searchTerm = query.toLowerCase();
            const results = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );

            if (results.length === 0) {
                return `No products found matching "${query}". Try searching for: t-shirt, hoodie, hat, beanie, apparel, accessories`;
            }

        },
        render: ({ args }) => {
            if (loading) {
                return <div className="p-4 text-center text-gray-600">Loading products from server...</div>;
            }

            if (error) {
                return <div className="p-4 text-center text-red-600">Error loading products: {error}</div>;
            }

            const query = args?.query || '';
            const searchTerm = query.toLowerCase();
            const results = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );

            if (results.length === 0) {
                return (
                    <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 No Results Found</h3>
                        <p className="text-yellow-700">No products found matching "{query}".</p>
                        <p className="text-sm text-yellow-600 mt-2">Try searching for: t-shirt, hoodie, hat, beanie, apparel, accessories</p>
                    </div>
                );
            }

            return (
                <div className="p-6 bg-blue-50 rounded-lg">
                    <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                        🔍 <span className="ml-2">Search Results for "{query}" ({results.length} found)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start space-x-3">
                                    {product.image_url && (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 text-sm">{product.name}</h4>
                                        <p className="text-xs text-gray-600 mt-1">{product.description}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-lg font-bold text-green-600">${product.price}</span>
                                            <span className="text-xs text-gray-500">ID: {product.id}</span>
                                        </div>
                                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        },
    });

    // Action to add items to cart with automatic cart display
    useCopilotAction({
        name: "addToCart",
        description: "Add a specified quantity of a product to the shopping cart. If the user provides a product name, use the availableProducts context (which includes product IDs, names, descriptions, and categories) to find the correct productId before calling this action. If multiple products match, ask for clarification.",
        parameters: [
            {
                name: "productId",
                type: "string",
                description: "The unique ID of the product to add (e.g., NK-001, NK-002). This should be derived from the user's query by looking up the product name in the availableProducts context.",
                required: true,
            },
            {
                name: "quantity",
                type: "number",
                description: "Quantity to add to cart. Defaults to 1 if not specified.",
                defaultValue: 1,
            },
        ],
        handler: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
            if (loading) {
                return "Loading products from server...";
            }

            if (error) {
                return `Error loading products: ${error}`;
            }

            const product = products.find(p => p.id === productId);

            if (!product) {
                return `Product ${productId} not found. Available products: ${products.map(p => p.id).join(', ')}`;
            }

            setCartItems((prev: CartItem[]) => {
                const existingItem = prev.find((item: { id: string; }) => item.id === productId);

                if (existingItem) {
                    console.log(`Adding ${quantity} to existing item. Current quantity: ${existingItem.quantity}`);
                    return prev.map((item: CartItem) =>
                        item.id === productId
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                } else {
                    console.log(`Adding new item: ${product.name}, quantity: ${quantity}, price: ${product.price}`);
                    return [...prev, {
                        id: product.id,
                        name: product.name,
                        price: Number(product.price) || 0,
                        quantity: Number(quantity) || 1
                    }];
                }
            });

            return `Added ${quantity}x ${product.name} to cart!`;
        },
        render: ({ status, args }: any) => {
            if (status === "complete" && args) {
                const product = products.find((p: Product) => p.id === args.productId);
                if (product) {
                    return (
                        <ProductUpdate
                            product={{
                                ...product,
                                quantity: args.quantity || 1
                            }}
                            action="added"
                            quantity={args.quantity || 1}
                        />
                    );
                }
            }
            return <></>;
        },
    });

    // Action to view cart - now using the beautiful CartCard component
    useCopilotAction({
        name: "viewCart",
        description: "Show current shopping cart contents",
        parameters: [],
        followUp: false,
        handler: async () => {
            if (cartItems.length === 0) {
                return "Your cart is empty. Add some products to get started!";
            }

            // Return cart snapshot data to be used by render
            return {
                items: cartItems.map(item => {
                    const product = products.find(p => p.id === item.id);
                    return {
                        ...item,
                        image_url: product?.image_url
                    };
                }),
                total: total
            };
        },
        render: ({ result, status }) => {
            if (status !== "complete") {
                return <></>;
            }

            if (typeof result === 'string') {
                return <></>;
            }

            const snapshotData = result as { items: any[], total: number };

            return (
                <CartCard
                    items={snapshotData.items}
                    total={snapshotData.total}
                    onRemoveItem={(itemId) => {
                        // Remove functionality still works but won't update this displayed card
                        setCartItems((prev: CartItem[]) => prev.filter((item: CartItem) => item.id !== itemId));
                    }}
                    showCheckoutButton={false}  // Hide checkout button in chat
                />
            );
        },
    });

    // Action to remove items from cart with cart display
    useCopilotAction({
        name: "removeFromCart",
        description: "Remove items from the shopping cart",
        parameters: [
            {
                name: "productId",
                type: "string",
                description: "The ID of the product to remove",
                required: true,
            },
            {
                name: "quantity",
                type: "number",
                description: "Quantity to remove (leave empty to remove all)",
            },
        ],
        handler: async ({ productId, quantity }: { productId: string; quantity?: number }) => {
            const existingItem = cartItems.find(item => item.id === productId);

            if (!existingItem) {
                return `Product ${productId} not found in cart`;
            }

            setCartItems((prev: CartItem[]) => {
                if (quantity === undefined || quantity >= existingItem.quantity) {
                    return prev.filter((item: CartItem) => item.id !== productId);
                } else {
                    return prev.map((item: CartItem) =>
                        item.id === productId
                            ? { ...item, quantity: item.quantity - quantity }
                            : item
                    );
                }
            });

            const removedQty = quantity === undefined ? existingItem.quantity : Math.min(quantity, existingItem.quantity);
            const remainingQty = existingItem.quantity - removedQty;
            return `Removed ${removedQty}x ${existingItem.name} from cart${remainingQty > 0 ? `. ${remainingQty} remaining.` : '.'}`;
        },
        render: ({ status, args }: any) => {
            // Show product update after removal
            if (status === "complete" && args) {
                const product = products.find((p: Product) => p.id === args.productId);
                const existingItem = cartItems.find((item: CartItem) => item.id === args.productId);
                if (product && existingItem) {
                    return (
                        <ProductUpdate
                            product={{
                                ...product,
                                quantity: existingItem.quantity
                            }}
                            action="removed"
                            quantity={existingItem.quantity}
                            previousQuantity={existingItem.quantity + (args.quantity || existingItem.quantity)}
                        />
                    );
                }
            }
            return <></>;
        },
    });

    // Action to clear cart
    useCopilotAction({
        name: "clearCart",
        description: "Clear all items from the shopping cart",
        parameters: [],
        handler: async () => {
            setCartItems([]);
            return "Cart cleared successfully!";
        },
    });

    // The completePurchase action is now handled by the stage hooks

    if (loading) {
        return (
            <div className="p-6 max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading products from server...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
                <div className="text-center py-8">
                    <div className="text-red-500 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <p className="text-red-600">{error}</p>
                    <p className="text-sm text-gray-500 mt-2">Please check that the backend service is running</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>

            {cartItems.length === 0 ? (
                <div className="text-gray-500 text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h3>
                    <p className="text-sm text-gray-500 mb-4">Start shopping by asking the AI assistant!</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                        <h4 className="font-medium text-blue-900 mb-2">💬 Try asking:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• "Show me all products"</li>
                            <li>• "Add a nekuda t-shirt to my cart"</li>
                            <li>• "Search for hoodies"</li>
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-4 bg-white border rounded-lg shadow-sm">
                            <div>
                                <h3 className="font-medium text-gray-900">{item.name}</h3>
                                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium text-gray-900">${((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}</p>
                                <p className="text-sm text-gray-500">${Number(item.price).toFixed(2)} each</p>
                            </div>
                        </div>
                    ))}

                    <div className="border-t pt-4 bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                            <span>Total:</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}

            {purchaseHistory.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Purchase History</h3>
                    <div className="space-y-2">
                        {purchaseHistory.map((purchase, index) => (
                            <div key={index} className="text-sm p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                                ✅ {purchase}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
