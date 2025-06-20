"use client"

import { useState, useEffect } from "react"
import { Search, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { CategoryService } from "@/lib/service/microdataService"
import { useCart } from "@/hooks/useCart"
import { UserService } from "@/lib/service/userService"
import { useAuth } from "@/hooks/useAuth"
import CouponCard from "@/components/ui/CouponCard"

export default function ExtraNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [isCouponsOpen, setIsCouponsOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userCoupons, setUserCoupons] = useState([])
  const { openCart, cartCount } = useCart()
  const { user, loading: authLoading } = useAuth()

  // Check login status on mount and when localStorage changes
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true"
      setIsLoggedIn(loggedIn)
    }

    // Initial check
    checkLoginStatus()

    // Listen for storage changes
    window.addEventListener("storage", checkLoginStatus)

    // Cleanup
    return () => window.removeEventListener("storage", checkLoginStatus)
  }, [])

  // Fetch categories using CategoryService
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        // console.log("Fetching categories from CategoryService...")
        const result = await CategoryService.getCategories()
        // console.log("CategoryService result:", result)

        if (result.success && Array.isArray(result.data)) {
          const transformedCategories = result.data.map((cat) => {
            // Special handling for Kits & Combos
            if (cat.name.toLowerCase().includes("kits") && cat.name.toLowerCase().includes("combos")) {
              return {
                name: cat.name,
                href: "/shop/kits-combos",
                image: cat.image || `/images/categories/${cat.id}.jpg`,
                is_microfiber: cat.is_microfiber || false,
              };
            }
            // For other categories
            return {
              name: cat.name,
              href: `/shop/${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              image: cat.image || `/images/categories/${cat.id}.jpg`,
              is_microfiber: cat.is_microfiber || false,
            };
          });
          // console.log("Setting categories:", transformedCategories)
          setCategories(transformedCategories)
        } else {
          console.error("Failed to fetch categories:", result.error || "No data")
          setCategories([])
        }
      } catch (error) {
        console.error("Error in fetchCategories:", error)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch user's coupons
  useEffect(() => {
    const fetchUserCoupons = async () => {
      if (user?.id) {
        const result = await UserService.getUserCoupons(user.id);
        if (result.success) {
          setUserCoupons(result.data);
        }
      }
    };

    if (!authLoading) {
      fetchUserCoupons();
    }
  }, [user?.id, authLoading]);

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <header className="w-full z-40 bg-transparent transition-all duration-300">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Logo and SHOP */}
        <div className="flex items-center space-x-6 relative">
          <Link href="/">
            <div className="text-2xl font-black flex items-center space-x-1">
              <img src="/assets/RabbitLogo.png" alt="Rabbit" className="w-[197px] h-[60px]" />
            </div>
          </Link>

          <div
            className="text-sm font-semibold cursor-pointer relative"
            onMouseEnter={() => setIsShopOpen(true)}
            onMouseLeave={() => setIsShopOpen(false)}
          >
            <button className="flex items-center gap-1 font-medium text-sm cursor-pointer">
              SHOP
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ease-in-out ml-1 ${isShopOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right side: Search, Coupons, Wishlist, User Icon/Login, Cart */}
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Coupons icon with hover */}
          <div className="relative">
            <button
              className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
              onMouseEnter={() => setIsCouponsOpen(true)}
              onMouseLeave={() => setIsCouponsOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2.08301 9.87498C2.91181 9.87498 3.70667 10.2042 4.29272 10.7903C4.87877 11.3763 5.20801 12.1712 5.20801 13C5.20801 13.8288 4.87877 14.6236 4.29272 15.2097C3.70667 15.7957 2.91181 16.125 2.08301 16.125V18.2083C2.08301 18.7608 2.3025 19.2908 2.6932 19.6815C3.0839 20.0722 3.61381 20.2916 4.16634 20.2916H20.833C21.3855 20.2916 21.9154 20.0722 22.3061 19.6815C22.6968 19.2908 22.9163 18.7608 22.9163 18.2083V16.125C22.0875 16.125 21.2927 15.7957 20.7066 15.2097C20.1206 14.6236 19.7913 13.8288 19.7913 13C19.7913 12.1712 20.1206 11.3763 20.7066 10.7903C21.2927 10.2042 22.0875 9.87498 22.9163 9.87498V7.79165C22.9163 7.23911 22.6968 6.70921 22.3061 6.31851C21.9154 5.92781 21.3855 5.70831 20.833 5.70831H4.16634C3.61381 5.70831 3.0839 5.92781 2.6932 6.31851C2.3025 6.70921 2.08301 7.23911 2.08301 7.79165V9.87498Z"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.375 9.875H9.38542"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.625 9.875L9.375 16.125"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.625 16.125H15.6354"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">Coupons</span>
            </button>
          </div>

          {/* Wishlist icon */}
          <button className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors">
            <svg width="20" height="20" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10.3511 16.6461C10.2581 16.2856 10.0702 15.9566 9.80693 15.6934C9.54368 15.4301 9.2147 15.2422 8.85421 15.1492L2.46358 13.5013C2.35455 13.4704 2.25859 13.4047 2.19026 13.3143C2.12193 13.2239 2.08496 13.1136 2.08496 13.0003C2.08496 12.8869 2.12193 12.7767 2.19026 12.6863C2.25859 12.5958 2.35455 12.5302 2.46358 12.4992L8.85421 10.8503C9.21457 10.7574 9.54347 10.5696 9.80671 10.3066C10.0699 10.0435 10.2579 9.71474 10.3511 9.35444L11.999 2.96381C12.0296 2.85435 12.0952 2.75792 12.1858 2.68922C12.2763 2.62053 12.3869 2.58334 12.5006 2.58334C12.6142 2.58334 12.7248 2.62053 12.8153 2.68922C12.9059 2.75792 12.9715 2.85435 13.0021 2.96381L14.649 9.35444C14.742 9.71493 14.9299 10.0439 15.1931 10.3072C15.4564 10.5704 15.7854 10.7583 16.1459 10.8513L22.5365 12.4982C22.6464 12.5285 22.7433 12.594 22.8124 12.6847C22.8814 12.7754 22.9188 12.8863 22.9188 13.0003C22.9188 13.1143 22.8814 13.2251 22.8124 13.3158C22.7433 13.4065 22.6464 13.472 22.5365 13.5024L16.1459 15.1492C15.7854 15.2422 15.4564 15.4301 15.1931 15.6934C14.9299 15.9566 14.742 16.2856 14.649 16.6461L13.0011 23.0367C12.9704 23.1462 12.9048 23.2426 12.8143 23.3113C12.7237 23.38 12.6132 23.4172 12.4995 23.4172C12.3859 23.4172 12.2753 23.38 12.1847 23.3113C12.0942 23.2426 12.0286 23.1462 11.998 23.0367L10.3511 16.6461Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.833 3.625V7.79167"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22.9167 5.70834H18.75"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.16699 18.2083V20.2916"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.20833 19.25H3.125"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="sr-only">Wishlist</span>
          </button>

          {/* User Icon and Cart */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <Link href="/profile">
                <button className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors">
                  <User className="w-5 h-5" />
                  <span className="sr-only">User Profile</span>
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors">
                  <User className="w-5 h-5" />
                  <span className="sr-only">User account</span>
                </button>
              </Link>
            )}

            {/* Cart Icon - Always visible */}
            <button
              onClick={openCart}
              className="relative h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* SHOP Dropdown with lower z-index */}
      <div
        className={`absolute left-0 right-0 bg-white shadow-lg border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
          isShopOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ zIndex: 50 }} // Much lower than cart
        onMouseEnter={() => setIsShopOpen(true)}
        onMouseLeave={() => setIsShopOpen(false)}
      >
        <div className="container mx-auto py-8 px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[3/2] rounded-lg"></div>
                  <div className="h-8 bg-gray-200 mt-2 rounded"></div>
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Link key={index} href={category.href} className="block group" onClick={() => setIsShopOpen(false)}>
                  <div className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="relative aspect-[3/2] bg-gray-100">
                      <img
                        src={category.image || "/placeholder.svg"}
                        alt={category.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="bg-black text-white py-3 px-4 text-center">
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No categories available</p>
            </div>
          )}
        </div>
      </div>

      {/* Coupons dropdown - FIXED STYLING */}
      <div
        className={`absolute right-6 top-full bg-white shadow-lg z-30 border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ease-in-out w-80 ${
          isCouponsOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
        onMouseEnter={() => setIsCouponsOpen(true)}
        onMouseLeave={() => setIsCouponsOpen(false)}
      >
        <div className="p-2">
          {/* <h3 className="font-semibold text-lg mb-4 text-gray-800">Your Available Coupons</h3> */}
          <div className="coupon-scroll-area">
            {authLoading ? (
              <div className="text-center ">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : user ? (
              userCoupons.length > 0 ? (
                <div className="space-y-3 mb-3">
                  {userCoupons.map((coupon) => (
                    <CouponCard
                      key={coupon.id}
                      code={coupon.code}
                      discount={coupon.discount}
                      validUpto={coupon.expiry}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No coupons available</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-gray-500 mb-3">Please log in to view your coupons</p>
                <Link href="/login" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
