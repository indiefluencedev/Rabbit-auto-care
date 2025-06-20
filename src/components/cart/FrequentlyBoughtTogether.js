"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { Package, Plus, ShoppingCart, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { ComboService } from "@/lib/service/comboService";

export default function FrequentlyBoughtTogether() {
	const { cartItems, clearCart, removeFromCart, addToCart } = useCart();
	const [frequentlyBought, setFrequentlyBought] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [showComboModal, setShowComboModal] = useState(false);
	const [pendingCombo, setPendingCombo] = useState(null);

	// Fetch combo products based on cart items
	const fetchComboProducts = async () => {
		if (!cartItems || cartItems.length === 0) {
			setFrequentlyBought([]);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			// Get all combos
			const allCombos = await ComboService.getCombos();

			// Filter combos that contain cart items with the same variant
			const matchingCombos = allCombos.filter(combo => {
				// Check if any product in the combo matches a cart item with the same variant
				return combo.combo_products.some(comboProduct => {
					return cartItems.some(cartItem => {
						// Match product ID
						const productMatch = cartItem.product_id === comboProduct.product_id ||
							cartItem.product?.id === comboProduct.product_id;

						// Match variant ID
						const variantMatch = cartItem.variant?.id === comboProduct.variant_id;

						return productMatch && variantMatch;
					});
				});
			});

			// Transform the combos to include necessary data
			const transformedCombos = matchingCombos.map(combo => ({
				id: combo.id,
				name: combo.name,
				description: combo.description,
				image_url: combo.image_url,
				original_price: combo.original_price,
				price: combo.price,
				discount_percent: combo.discount_percent,
				products: combo.combo_products.map(cp => ({
					product_id: cp.product_id,
					variant_id: cp.variant_id,
					quantity: cp.quantity,
					product: cp.product,
					variant: cp.variant
				}))
			}));

			setFrequentlyBought(transformedCombos);
		} catch (error) {
			console.error("Error fetching combo products:", error);
			setError(`Failed to load suggestions: ${error.message}`);
			setFrequentlyBought([]);
		} finally {
			setLoading(false);
		}
	};

	// Fetch combos when cart items change
	useEffect(() => {
		console.log("Component: Cart items changed, fetching combos...");
		fetchComboProducts();
	}, [cartItems]);

	const handleAddComboClick = (comboItem) => {
		setPendingCombo(comboItem);
		setShowComboModal(true);
	};

	const handleAddCombo = async (keepOnlyCombo) => {
		setShowComboModal(false);
		if (!pendingCombo) return;
		if (keepOnlyCombo) {
			// Remove all related products (products in the combo) from the cart
			const comboProductIds = pendingCombo.products.map(p => p.product_id);
			const comboVariantIds = pendingCombo.products.map(p => p.variant_id);
			const removals = cartItems
				.filter(cartItem =>
					comboProductIds.includes(cartItem.product_id || cartItem.product?.id) &&
					comboVariantIds.includes(cartItem.variant?.id)
				)
				.map(cartItem => removeFromCart(cartItem.id));
			await Promise.all(removals);
		}
		try {
			// Use addToCart from context for combos
			const includedVariants = pendingCombo.products.map(item => ({
				product_id: item.product_id,
				variant_id: item.variant_id,
				quantity: item.quantity
			}));
			const comboObj = { combo_id: pendingCombo.id, ...pendingCombo };
			console.log('FrequentlyBoughtTogether: Adding COMBO to cart:', { comboObj, includedVariants, quantity: 1 });
			const success = await addToCart(comboObj, includedVariants, 1);
			if (success) {
				window.location.reload();
			} else {
				console.error("Failed to add combo to cart");
			}
		} catch (error) {
			console.error("Error adding combo to cart:", error);
		} finally {
			setPendingCombo(null);
		}
	};

	// Calculate savings
	const calculateSavings = (combo) => {
		if (combo.original_price && combo.price) {
			return combo.original_price - combo.price;
		}
		return 0;
	};

	// Don't render if no cart items
	if (!cartItems || cartItems.length === 0) {
		console.log("Component: No cart items, not rendering");
		return null;
	}

	// console.log("Component: Rendering with state:", {
	// 	loading,
	// 	error,
	// 	combosCount: frequentlyBought.length,
	// });

	return (
		<div className="bg-gray-50 rounded-lg p-4">
			<h4 className="text-sm font-medium flex items-center gap-2 mb-3">
				<ShoppingCart size={16} className="text-green-600" />
				Frequently Bought Together
			</h4>

			{loading ? (
				<div className="flex items-center justify-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
					<span className="ml-2 text-sm text-gray-600">
						Finding suggestions...
					</span>
				</div>
			) : error ? (
				<div className="flex flex-col items-center justify-center py-6 text-center bg-white rounded border border-dashed border-red-300">
					<div className="bg-red-100 p-2 rounded-full mb-2">
						<Package size={20} className="text-red-500" />
					</div>
					<p className="text-red-600 text-sm">{error}</p>
					<button
						onClick={fetchComboProducts}
						className="text-red-600 text-xs hover:text-red-800 mt-1 underline"
					>
						Try again
					</button>
				</div>
			) : frequentlyBought.length > 0 ? (
				<div className="space-y-3">
					<p className="text-xs text-gray-600 mb-3">
						Based on items in your cart, customers also bought:
					</p>
					<div className="flex overflow-x-auto space-x-3 pb-2 -mx-4 px-4">
						{frequentlyBought.map((item, index) => {
							const savings = calculateSavings(item);
							return (
								<motion.div
									key={item.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="flex-shrink-0 w-48 border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
								>
									<div className="relative">
										<img
											src={
												item.image_url || "/placeholder.svg?height=96&width=192"
											}
											alt={item.name}
											className="w-full h-24 object-cover"
										/>
										{savings > 0 && (
											<div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
												<Percent size={10} />
												SAVE ₹{savings.toFixed(0)}
											</div>
										)}
										{item.discount_percent && (
											<div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
												{item.discount_percent}% OFF
											</div>
										)}
									</div>
									<div className="p-3">
										<p className="text-sm font-medium mb-2 line-clamp-2 leading-tight">
											{item.name}
										</p>
										{item.description && (
											<p className="text-xs text-gray-500 mb-2 line-clamp-1">
												{item.description}
											</p>
										)}

										{/* Show number of products in combo */}
										<p className="text-xs text-blue-600 mb-2">
											{item.products.length} products included
										</p>

										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-1">
												{item.original_price &&
													item.original_price > item.price && (
														<span className="text-gray-500 text-xs line-through">
															₹{item.original_price}
														</span>
													)}
												<span className="text-sm font-semibold text-green-600">
													₹{item.price}
												</span>
											</div>
										</div>
										<button
											onClick={() => handleAddComboClick(item)}
											className="w-full bg-black text-white text-xs py-2 rounded hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
										>
											<Plus size={12} />
											ADD COMBO
										</button>
									</div>
								</motion.div>
							);
						})}
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-6 text-center bg-white rounded border border-dashed border-gray-300">
					<div className="bg-gray-100 p-2 rounded-full mb-2">
						<Package size={20} className="text-gray-500" />
					</div>
					<p className="text-gray-600 text-sm">
						No combo suggestions available
					</p>
					<p className="text-gray-500 text-xs mt-1">
						Add more items to see personalized recommendations
					</p>
				</div>
			)}

			{/* Combo Modal */}
			{showComboModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
					<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center">
						<h3 className="text-lg font-semibold mb-4 text-center">How do you want to add this combo?</h3>
						<button
							className="w-full mb-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-medium"
							onClick={() => handleAddCombo(true)}
						>
							Keep only combo (remove other items)
						</button>
						<button
							className="w-full mb-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded font-medium"
							onClick={() => handleAddCombo(false)}
						>
							Keep combo and existing products
						</button>
						<button
							className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700"
							onClick={() => setShowComboModal(false)}
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
