"use client"

import { useEffect } from "react"
import { Star, X } from "lucide-react"

const MobileFilterModal = ({
  isOpen,
  onClose,
  selectedSize,
  setSelectedSize,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  priceRange,
  setPriceRange,
  category,
  selectedRating,
  setSelectedRating,
  inStockOnly,
  setInStockOnly,
  selectedColor,
  setSelectedColor,
  selectedGsm,
  setSelectedGsm,
  selectedQuantity,
  setSelectedQuantity,
  onClearFilters,
  onApplyFilters,
  onCategoryChange,
  products = [],
}) => {
  // Define filter options based on actual product data
  const CATEGORIES = [
    { value: "all", label: "All Products" },
    { value: "microfiber-cloth", label: "Microfibers" },
    { value: "car-interior", label: "Car Interior" },
    { value: "car-exterior", label: "Car Exterior" },
    { value: "kits-combos", label: "Kits & Combos" },
  ]

  // Extract unique filter options from ALL products (static)
  const extractFilterOptions = () => {
    const sizes = new Set()
    const colors = new Set()
    const gsmValues = new Set()
    const quantities = new Set()
    let minProductPrice = Number.POSITIVE_INFINITY
    let maxProductPrice = 0

    // Always use all products to maintain static filter options
    products.forEach((product) => {
      // Extract filter options from variants
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((variant) => {
          // Handle size (could be size or size_cm)
          if (variant.size) sizes.add(variant.size)
          if (variant.size_cm) sizes.add(variant.size_cm)

          // Handle color
          if (variant.color) colors.add(variant.color)

          // Handle GSM for microfiber products
          if (variant.gsm) gsmValues.add(variant.gsm)

          // Handle quantity for non-microfiber products
          if (variant.quantity) quantities.add(variant.quantity)

          // Track price range
          if (variant.price) {
            minProductPrice = Math.min(minProductPrice, Number.parseFloat(variant.price))
            maxProductPrice = Math.max(maxProductPrice, Number.parseFloat(variant.price))
          }
        })
      }

      // Also check product-level properties
      if (product.size) sizes.add(product.size)
      if (product.color) colors.add(product.color)
      if (product.gsm) gsmValues.add(product.gsm)
      if (product.quantity) quantities.add(product.quantity)
      if (product.price) {
        minProductPrice = Math.min(minProductPrice, Number.parseFloat(product.price))
        maxProductPrice = Math.max(maxProductPrice, Number.parseFloat(product.price))
      }
    })

    return {
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors).sort(),
      gsmValues: Array.from(gsmValues).sort((a, b) => Number(a) - Number(b)),
      quantities: Array.from(quantities).sort((a, b) => {
        // Extract numeric part for sorting
        const numA = Number.parseInt(a.match(/\d+/)?.[0] || "0")
        const numB = Number.parseInt(b.match(/\d+/)?.[0] || "0")
        return numA - numB
      }),
      minPrice: minProductPrice === Number.POSITIVE_INFINITY ? 0 : minProductPrice,
      maxPrice: maxProductPrice || 1000,
    }
  }

  const filterOptions = extractFilterOptions()

  // Handle price range change - only allow max price to change
  const handlePriceRangeChange = (e) => {
    const value = Number.parseInt(e.target.value)
    const newRange = [filterOptions.minPrice, value]
    setPriceRange(newRange)
    setMinPrice(filterOptions.minPrice.toString())
    setMaxPrice(value.toString())
  }

  // Determine which filters to show based on category
  const getFilterVisibility = () => {
    switch (category) {
      case "microfiber-cloth":
      case "microfiber":
        return {
          showMicrofiberFilters: true,
          showCarCareFilters: false,
          showAllFilters: false,
        }
      case "car-interior":
      case "car-exterior":
        return {
          showMicrofiberFilters: false,
          showCarCareFilters: true,
          showAllFilters: false,
        }
      case "kits-combos":
        return {
          showMicrofiberFilters: true,
          showCarCareFilters: true,
          showAllFilters: true,
        }
      case "all":
      default:
        return {
          showMicrofiberFilters: true,
          showCarCareFilters: true,
          showAllFilters: true,
        }
    }
  }

  const { showMicrofiberFilters, showCarCareFilters } = getFilterVisibility()

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="bg-white w-full h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-medium text-gray-900">FILTER</h2>
          <div className="flex items-center gap-4">
            <button onClick={onClearFilters} className="text-sm text-blue-600 hover:text-blue-800">
              Clear all
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Content */}
        <div className="p-4 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">CATEGORY</h3>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <label key={cat.value} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    checked={category === cat.value}
                    onChange={() => onCategoryChange(cat.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">RATING</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <label key={rating} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    checked={selectedRating === rating}
                    onChange={() => setSelectedRating(rating)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-2 flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-700">& up</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">AVAILABILITY</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
            </label>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">PRICE</h3>
            <div className="space-y-3">
              {/* Price display above slider */}
              <div className="text-sm text-gray-600">
                ₹{filterOptions.minPrice} to ₹{priceRange[1]}
              </div>
              {/* Custom slider that only moves from max side */}
              <div className="relative">
                <input
                  type="range"
                  min={filterOptions.minPrice}
                  max={filterOptions.maxPrice}
                  value={priceRange[1]}
                  onChange={handlePriceRangeChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      ((priceRange[1] - filterOptions.minPrice) / (filterOptions.maxPrice - filterOptions.minPrice)) *
                      100
                    }%, #e5e7eb ${
                      ((priceRange[1] - filterOptions.minPrice) / (filterOptions.maxPrice - filterOptions.minPrice)) *
                      100
                    }%, #e5e7eb 100%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Size (for microfiber products) */}
          {showMicrofiberFilters && filterOptions.sizes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">SIZE</h3>
              <div className="space-y-2">
                {filterOptions.sizes.map((size) => (
                  <label key={size} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedSize.includes(size)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSize([...selectedSize, size])
                        } else {
                          setSelectedSize(selectedSize.filter((s) => s !== size))
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          {filterOptions.colors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">COLOR</h3>
              <div className="space-y-2">
                {filterOptions.colors.map((color) => (
                  <label key={color} className="flex items-center cursor-pointer">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedColor.includes(color)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColor([...selectedColor, color])
                          } else {
                            setSelectedColor(selectedColor.filter((c) => c !== color))
                          }
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border mr-2 ${
                          selectedColor.includes(color) ? "border-gray-800 border-2" : "border-gray-300"
                        }`}
                        style={{
                          backgroundColor:
                            color.toLowerCase() === "white"
                              ? "#ffffff"
                              : color.toLowerCase() === "black"
                                ? "#000000"
                                : color.toLowerCase() === "blue"
                                  ? "#3b82f6"
                                  : color.toLowerCase() === "purple"
                                    ? "#8b5cf6"
                                    : color.toLowerCase() === "green"
                                      ? "#10b981"
                                      : color.toLowerCase() === "red"
                                        ? "#ef4444"
                                        : color.toLowerCase() === "yellow"
                                          ? "#f59e0b"
                                          : color.toLowerCase() === "orange"
                                            ? "#f97316"
                                            : color.toLowerCase() === "pink"
                                              ? "#ec4899"
                                              : color.toLowerCase() === "gray" || color.toLowerCase() === "grey"
                                                ? "#6b7280"
                                                : "#9ca3af",
                        }}
                      />
                      <span className="text-sm text-gray-700 capitalize">{color}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quantity (for non-microfiber products) */}
          {showCarCareFilters && filterOptions.quantities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">QUANTITY</h3>
              <div className="space-y-2">
                {filterOptions.quantities.map((quantity) => (
                  <label key={quantity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedQuantity.includes(quantity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuantity([...selectedQuantity, quantity])
                        } else {
                          setSelectedQuantity(selectedQuantity.filter((q) => q !== quantity))
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{quantity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* GSM (for microfiber products) */}
          {showMicrofiberFilters && filterOptions.gsmValues.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase">GSM</h3>
              <div className="space-y-2">
                {filterOptions.gsmValues.map((gsm) => (
                  <label key={gsm} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedGsm.includes(gsm)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGsm([...selectedGsm, gsm])
                        } else {
                          setSelectedGsm(selectedGsm.filter((g) => g !== gsm))
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{gsm} GSM</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onApplyFilters}
            className="w-full bg-black text-white py-3 px-4 rounded font-medium hover:bg-gray-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>

        <style jsx>{`
          .slider-blue::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .slider-blue::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        `}</style>
      </div>
    </div>
  )
}

export default MobileFilterModal
