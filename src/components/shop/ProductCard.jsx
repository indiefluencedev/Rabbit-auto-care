'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Heart, Sparkles } from 'lucide-react';
import { WishlistService } from '@/lib/service/wishlistService'; // Step 1: Import service

export default function ProductCard({ product, index }) {
  const router = useRouter();
  const [hasImageError, setHasImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Validate product data
  if (!product) {
    console.error('ProductCard received null/undefined product');
    return null;
  }

  const handleImageError = () => {
    console.log('Image error for product:', product.name);
    setHasImageError(true);
  };

  // Replace calculateMaxPrice with logic to get the highest base_price among variants
  const calculateMaxBasePrice = () => {
    try {
      if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        const basePrices = product.variants
          .map((variant) => Number(variant?.base_price) || 0)
          .filter((price) => !isNaN(price));
        if (basePrices.length > 0) {
          return Math.max(...basePrices);
        }
      }
      // Fallback to product.base_price, product.price, or 0
      return Number(product.base_price) || Number(product.price) || 0;
    } catch (error) {
      console.error('Error calculating max base price for product:', product.name, error);
      return 0;
    }
  };
  const maxPrice = calculateMaxBasePrice();

  // Get the main image with improved error handling
  const getImageUrl = (url) => {
    if (!url) return '/placeholder.svg?height=200&width=200';

    try {
      // If it's already a full URL, return it
      new URL(url);
      return url;
    } catch {
      // Handle relative URLs or file names
      if (typeof url === 'string' && url.trim()) {
        if (!url.startsWith('http') && !url.startsWith('/')) {
          // Construct full URL for Supabase storage
          const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (baseUrl) {
            return `${baseUrl}/storage/v1/object/public/product-images/${url}`;
          }
        }
        if (url.startsWith('/')) {
          return url;
        }
      }
      return '/placeholder.svg?height=200&width=200';
    }
  };

  // Try multiple image sources
  const getMainImage = () => {
    const imageSources = [
      product.main_image_url,
      product.mainImage,
      product.image,
      product.images?.[0],
      product.imageUrl,
    ].filter(Boolean);

    return imageSources.length > 0
      ? getImageUrl(imageSources[0])
      : '/placeholder.svg?height=200&width=200';
  };

  const imageUrl = getMainImage();

  // Generate rating with better defaults
  const rating = product.averageRating || product.rating || 4.0;
  const ratingCount =
    product.reviews?.length ||
    product.reviewCount ||
    Math.floor(Math.random() * 50) + 10;

  // Get product ID for navigation
  const productIdentifier =
    product.product_code || product.id || product._id || product.productId;

  const handleViewProduct = () => {
    if (!productIdentifier) {
      console.error(
        'Cannot navigate: Product identifier (product_code or ID) is missing',
        product
      );
      return;
    }
    router.push(`/products/${productIdentifier}`);
  };

  // Step 2: Wishlist toggle logic
  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    setWishlistLoading(true);
    try {
      if (!isWishlisted) {
        // Add to wishlist
        await WishlistService.addToWishlist({
          product_id: product.id,
          variant: product.selectedVariant || product.variants?.[0] || null, // Send variant if available
        });
        setIsWishlisted(true);
      } else {
        // Remove from wishlist
        // You may need to fetch the wishlist item id for this product for real apps
        // For demo, assume product.id is wishlist id (adjust as per your data)
        await WishlistService.removeFromWishlist(product.id);
        setIsWishlisted(false);
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    }
    setWishlistLoading(false);
  };

  // Format product name with fallback
  const productName = product.name || product.title || `Product ${index + 1}`;

  // Format description with fallback
  const description =
    product.description ||
    product.shortDescription ||
    'High quality car care product designed for optimal performance and lasting results.';

  return (
    <div
      className='bg-white overflow-hidden hover:shadow-sm transition-shadow duration-300 flex flex-col cursor-pointer relative border border-gray-200 rounded-sm '
      style={{ width: '300px', height: '470px' }}
      onClick={handleViewProduct}
    >
      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className='absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm border border-gray-100'
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        disabled={wishlistLoading}
      >
        <Heart
          size={16}
          className={`${
            isWishlisted ? 'text-red-500 fill-current' : 'text-gray-500'
          } transition-colors`}
        />
      </button>

      {/* Product Image - Full width */}
      <div className='relative h-56 w-full bg-gray-50 flex-shrink-0'>
        {imageUrl && !hasImageError ? (
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className='object-cover'
            onError={handleImageError}
            unoptimized={!imageUrl.startsWith('http')}
            sizes='300px'
          />
        ) : (
          <div className='flex items-center justify-center h-full bg-gray-50'>
            <div className='text-center'>
              <svg
                className='w-12 h-12 text-gray-300 mx-auto mb-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z'
                />
              </svg>
              <span className='text-gray-400 text-xs'>No Image</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Details - Compact layout matching reference */}
      <div className='px-4 py-3 flex flex-col flex-grow'>
        {/* Product Name - Larger, bolder */}
        <h3 className='text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight'>
          {productName}
        </h3>

        {/* Rating - Matching reference style */}
        <div className='flex items-center mb-2'>
          <div className='flex items-center'>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={`${
                  star <= Math.floor(rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-200'
                }`}
              />
            ))}
            <span className='ml-2 text-sm text-gray-500'>
              | {ratingCount} Ratings
            </span>
          </div>
        </div>

        {/* Description - Single line only */}
        <p className='text-sm text-gray-600 mb-4 line-clamp-1 leading-relaxed'>
          {description}
        </p>

        {/* Price and Button - Fixed at Bottom */}
        <div className='mt-auto'>
          <hr className='border-gray-700 mb-4' />
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-baseline'>
              <span className='text-xl font-bold text-gray-900'>
                ₹{maxPrice || 0}
              </span>
              {product.originalPrice && product.originalPrice > maxPrice && (
                <span className='ml-2 text-sm text-gray-400 line-through'>
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Add to Shine List Button */}
          <button
            className='w-full bg-white border border-gray-800 text-gray-700 py-2.5 px-4 rounded-sm text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            onClick={(e) => {
              e.stopPropagation();
              handleViewProduct();
            }}
            disabled={!productIdentifier}
          >
            View Product
          </button>
        </div>
      </div>
    </div>
  );
}
