// /app/api/products/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Utility to handle errors consistently
function errorResponse(message, status = 500) {
	console.error(`API Error (products): ${message}`);
	return NextResponse.json({ error: message }, { status });
}

// GET - Fetch products with optional filtering
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const category = searchParams.get("category");
		const search = searchParams.get("search");
		const inStock = searchParams.getAll("inStock[]");
		const sizes = searchParams.getAll("sizes[]");
		const colors = searchParams.getAll("colors[]");
		const minPrice = searchParams.get("minPrice");
		const maxPrice = searchParams.get("maxPrice");
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "10");
		const offset = (page - 1) * limit;

		// Start building the query with proper join
		let query = supabase
			.from("products")
			.select(`
				*,
				product_variants (
					id,
					gsm,
					size,
					color,
					color_hex,
					quantity,
					unit,
					price,
					stock,
					compare_at_price
				)
			`, { count: "exact" });

		// Apply filters
		if (category) {
			query = query.eq("category_name", category);
		}

		if (search) {
			query = query.or(`name.ilike.%${search}%,product_code.ilike.%${search}%`);
		}

		if (inStock.length > 0) {
			query = query.eq("in_stock", inStock.includes("true"));
		}

		if (sizes.length > 0) {
			query = query.in("product_variants.size", sizes);
		}

		if (colors.length > 0) {
			query = query.in("product_variants.color", colors);
		}

		if (minPrice) {
			query = query.gte("product_variants.price", parseFloat(minPrice));
		}

		if (maxPrice) {
			query = query.lte("product_variants.price", parseFloat(maxPrice));
		}

		// Apply pagination
		query = query.range(offset, offset + limit - 1);

		// Execute the query
		const { data: products, error, count } = await query;

		if (error) {
			console.error("Supabase query error:", error);
			return NextResponse.json(
				{ error: error.message },
				{ status: 500 }
			);
		}

		// Transform the data to match the expected format
		const transformedProducts = products.map(product => ({
			...product,
			variants: product.product_variants || []
		}));

		return NextResponse.json({
			success: true,
			products: transformedProducts,
			total: count
		});
	} catch (error) {
		console.error("Error in GET /api/products:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// POST - Create a new product
export async function POST(request) {
	try {
		const data = await request.json();
		console.log("Received product data:", JSON.stringify(data, null, 2));

		// Validate required fields
		if (!data.name || !data.product_code) {
			return NextResponse.json(
				{ error: "Product name and code are required" },
				{ status: 400 }
			);
		}

		if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0) {
			return NextResponse.json(
				{ error: "At least one variant is required" },
				{ status: 400 }
			);
		}

		// Validate variant data
		for (const variant of data.variants) {
			if (data.is_microfiber) {
				if (!variant.gsm || !variant.size || !variant.color || !variant.price) {
					return NextResponse.json(
						{ error: "GSM, size, color, and price are required for microfiber variants" },
						{ status: 400 }
					);
				}
			} else {
				// Optional fields for liquid variants
				if (!variant.price) {
					return NextResponse.json(
						{ error: "Price is required for liquid variants" },
						{ status: 400 }
					);
				}
			}
		}

		// Prepare the product data
		const productData = {
			name: data.name,
			product_code: data.product_code,
			description: data.description,
			category_name: data.category_name,
			is_microfiber: data.is_microfiber,
			main_image_url: data.main_image_url,
			images: data.images,
			key_features: data.key_features,
			taglines: data.taglines,
			subcategory_names: data.subcategory_names,
			meta_title: data.meta_title,
			meta_description: data.meta_description,
			meta_keywords: data.meta_keywords,
			og_title: data.og_title,
			og_description: data.og_description,
			og_image: data.og_image,
			twitter_title: data.twitter_title,
			twitter_description: data.twitter_description,
			twitter_image: data.twitter_image,
			schema_markup: data.schema_markup,
		};

		// Log the prepared product data
		console.log("Prepared product data for insert:", JSON.stringify(productData, null, 2));

		// Insert the product
		const { data: product, error: productError } = await supabase
			.from("products")
			.insert(productData)
			.select()
			.single();

		if (productError) {
			console.error("Error creating product:", {
				error: productError,
				message: productError.message,
				details: productError.details,
				hint: productError.hint,
				code: productError.code
			});
			return NextResponse.json(
				{ error: `Failed to create product: ${productError.message}` },
				{ status: 500 }
			);
		}

		// Prepare variants, ensuring the client-generated text ID is included
		const variantsToInsert = data.variants.map(variant => ({
			...variant,
			product_id: product.id, // This is an integer
		}));

		// Insert the variants
		const { error: variantsError } = await supabase
			.from("product_variants")
			.insert(variantsToInsert);

		if (variantsError) {
			// Rollback product creation on variant failure
			await supabase.from("products").delete().eq("id", product.id);
			return errorResponse(`Failed to create variants: ${variantsError.message}`);
		}

		// Fetch the complete product with variants
		const { data: completeProduct, error: fetchError } = await supabase
			.from("products")
			.select(`
				*,
				product_variants (
					id,
					gsm,
					size,
					color,
					color_hex,
					quantity,
					unit,
					price,
					stock,
					compare_at_price
				)
			`)
			.eq("id", product.id)
			.single();

		if (fetchError) {
			console.error("Error fetching complete product:", fetchError);
			return NextResponse.json(
				{ error: "Failed to fetch complete product" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			product: completeProduct,
		});
	} catch (error) {
		console.error("Error in POST /api/products:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// PUT - Update an existing product
export async function PUT(request) {
	try {
		const data = await request.json();
		const { id, variants, ...productData } = data;

		if (!id) {
			return errorResponse("Product ID is required for update", 400);
		}

		// Update the core product details
		const { error: productUpdateError } = await supabase
			.from("products")
			.update(productData)
			.eq("id", id);

		if (productUpdateError) {
			return errorResponse(`Failed to update product: ${productUpdateError.message}`);
		}

		// Perform a smart "upsert" for all variants.
		// This will update existing variants and insert new ones based on the 'id' field.
		if (variants && Array.isArray(variants)) {
			const { error: upsertError } = await supabase
				.from("product_variants")
				.upsert(
					variants.map(v => ({ ...v, product_id: id })),
					{ onConflict: 'id' }
				);

			if (upsertError) {
				return errorResponse(`Failed to upsert variants: ${upsertError.message}`);
			}
		}

		// Fetch the complete product with its updated variants
		const { data: completeProduct, error: fetchError } = await supabase
			.from("products")
			.select(`
				*,
				product_variants (*)
			`)
			.eq("id", id)
			.single();

		if (fetchError) {
			return errorResponse(`Failed to fetch updated product: ${fetchError.message}`);
		}

		return NextResponse.json({
			success: true,
			product: completeProduct,
			message: "Product updated successfully"
		});

	} catch (error) {
		console.error("PUT /api/products error:", error);
		return errorResponse(error.message || "Internal server error");
	}
}

// DELETE - Delete a product
export async function DELETE(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ error: "Product ID is required" },
				{ status: 400 }
			);
		}

		// Delete variants first
		const { error: variantsError } = await supabase
			.from("product_variants")
			.delete()
			.eq("product_id", id);

		if (variantsError) {
			console.error("Error deleting variants:", variantsError);
			return NextResponse.json(
				{ error: "Failed to delete product variants" },
				{ status: 500 }
			);
		}

		// Delete product
		const { error: productError } = await supabase
			.from("products")
			.delete()
			.eq("id", id);

		if (productError) {
			console.error("Error deleting product:", productError);
			return NextResponse.json(
				{ error: "Failed to delete product" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Product deleted successfully",
		});
	} catch (error) {
		console.error("Error in DELETE /api/products:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// Helper function to transform product data (can remain on frontend or be shared)
// Moving this to frontend productService.js is a good practice.
function transformProductData(product) {
	// This function is now primarily handled in frontend productService.js
	// The backend should return the raw data from the DB query result.
	return product;
}

// Helper function to get the lowest price from variants (can remain on frontend or be shared)
// Moving this to frontend productService.js is a good practice.
function getLowestPrice(variants) {
	// This function is now primarily handled in frontend productService.js
	return 0; // Placeholder
}
