import { useState, useEffect } from 'react';
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';

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
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [purchaseHistory, setPurchaseHistory] = useState<string[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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

    // Make cart state readable to Copilot
    useCopilotReadable({
        description: "Current shopping cart contents and product catalog. The catalog includes product ID, name, description, and category, which can be used to find a specific product.",
        value: {
            cartItems,
            total: total.toFixed(2),
            itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            availableProducts: products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                category: product.category,
                price: product.price
            })),
            purchaseHistory,
            loading,
            error
        },
    });

    // Action to view all products
    useCopilotAction({
        name: "viewProducts",
        description: "Show all available products in the store. Triggers when user asks to: 'show me all products', 'show products', 'view products', 'list all products', 'display products', 'what products do you have', 'show me your products', 'see all products'",
        parameters: [],
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

            // Return specific instruction to prevent AI duplication
            return "Products are displayed below. Do not generate additional product listings.";
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

            // Return specific instruction to prevent AI duplication
            return `Search results for "${query}" are displayed below. Do not generate additional product listings.`;
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

    // Action to add items to cart
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

            setCartItems(prev => {
                const existingItem = prev.find(item => item.id === productId);

                if (existingItem) {
                    return prev.map(item =>
                        item.id === productId
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                } else {
                    return [...prev, {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        quantity
                    }];
                }
            });

            return `Added ${quantity}x ${product.name} to cart!`;
        },
    });

    // Action to view cart
    useCopilotAction({
        name: "viewCart",
        description: "Show current shopping cart contents",
        parameters: [],
        handler: async () => {
            if (cartItems.length === 0) {
                return "Your cart is empty. Add some products to get started!";
            }

            const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            return `Cart contents are displayed below. You have ${itemCount} items totaling $${total.toFixed(2)}. Do not generate additional cart listings.`;
        },
        render: () => {
            if (cartItems.length === 0) {
                return (
                    <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mt-2">Your Cart is Empty</h3>
                            <p className="text-gray-500">Add some amazing Nekuda products to get started!</p>
                        </div>
                    </div>
                );
            }

            const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

            return (
                <div className="p-6 bg-green-50 rounded-lg">
                    <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                        🛒 <span className="ml-2">Your Shopping Cart ({itemCount} items)</span>
                    </h3>
                    <div className="space-y-4">
                        {cartItems.map((item) => {
                            const product = products.find(p => p.id === item.id);
                            const itemTotal = (item.price * item.quantity).toFixed(2);

                            return (
                                <div key={item.id} className="bg-white rounded-lg border border-green-200 p-4 shadow-sm">
                                    <div className="flex items-start space-x-3">
                                        {product?.image_url && (
                                            <img
                                                src={product.image_url}
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="text-sm text-gray-600">
                                                    ${item.price} each × {item.quantity}
                                                </div>
                                                <span className="text-lg font-bold text-green-600">${itemTotal}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6 pt-4 border-t border-green-200">
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900">Total:</span>
                            <span className="text-2xl font-bold text-green-600">${total.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-green-700 mt-2">Ready to checkout? Just say "complete purchase" to proceed!</p>
                    </div>
                </div>
            );
        },
    });

    // Action to remove items from cart
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

            setCartItems(prev => {
                if (quantity === undefined || quantity >= existingItem.quantity) {
                    // Remove entire item
                    return prev.filter(item => item.id !== productId);
                } else {
                    // Reduce quantity
                    return prev.map(item =>
                        item.id === productId
                            ? { ...item, quantity: item.quantity - quantity }
                            : item
                    );
                }
            });

            const removedQty = quantity === undefined ? existingItem.quantity : Math.min(quantity, existingItem.quantity);
            return `Removed ${removedQty}x ${existingItem.name} from cart`;
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

    useCopilotAction({
        name: "completePurchase",
        description: "Complete the purchase of items in cart using nekuda SDK and browser automation.",
        parameters: [], // No parameters needed from user, userId and merchantName are now fixed
        handler: async () => {
            if (cartItems.length === 0) {
                return "Cannot complete purchase - your cart is empty!";
            }

            // Fixed userId and merchantName for nekuda integration
            const fixedUserId = "test_user_123"; // Or retrieve from actual wallet context later
            const fixedMerchantName = "nekuda Store";

            try {
                // Prepare order details for nekuda browser automation
                const orderDetails = {
                    user_id: fixedUserId,
                    store_id: 'nekuda',
                    items: cartItems,
                    total: total,
                    merchant_name: fixedMerchantName,
                    checkout_url: 'https://nekuda-store-frontend.onrender.com/',
                    payment_method: 'nekuda_sdk'
                };

                // Call the Nekuda browser checkout service endpoint
                const response = await fetch('http://localhost:8001/api/browser-checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderDetails)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    return `❌ Checkout with Nekuda SDK failed: ${errorData.detail || 'Unknown error'}. Please try again.`;
                }

                const result = await response.json();

                if (result.success) {
                    const orderId = result.store_order_id || `NEKUDA-${Date.now()}`;
                    const itemsSummary = cartItems.map(item => `${item.quantity}x ${item.name}`).join(', ');

                    setPurchaseHistory(prev => [...prev, `Order ${orderId}: ${itemsSummary} - $${total.toFixed(2)} (Nekuda SDK + Browser)`]);
                    setCartItems([]);

                    return `🎉 Purchase completed successfully using nekuda SDK + Browser Automation!\n\n✅ Order ID: ${orderId}\n👤 User: ${fixedUserId}\n💰 Total: $${total.toFixed(2)}\n📦 Items: ${itemsSummary}\n🔐 Payment: Real Nekuda SDK credentials\n🤖 Method: AI Browser Automation\n\nYour cart has been cleared.`;
                } else {
                    return `❌ Purchase failed via nnekuda SDK: ${result.message || 'Unknown error'}. Please try again.`;
                }

            } catch (error) {
                console.error('nekuda SDK checkout error:', error);
                return `❌ Error during nekuda SDK checkout: ${error instanceof Error ? error.message : 'Network error'}. Please ensure the checkout service is running.`;
            }
        },
    });

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
                                <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                <p className="text-sm text-gray-500">${item.price} each</p>
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