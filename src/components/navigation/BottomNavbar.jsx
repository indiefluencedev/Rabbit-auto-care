"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/hooks/useCart"
import { useAuth } from '@/contexts/AuthContext';
import CouponCard from "@/components/ui/CouponCard"
// import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { ClientUserService } from "@/lib/service/client-userService"
import { SEARCH_MAP } from "@/utils/searchKeywords";

// Category image mapping from ExtraNavbar


// Use static categories for shop dropdown
const STATIC_CATEGORIES = [
  { name: "Car Interior", href: "/shop/car-interior", image: "/assets/images/interiorCat.webp" },
  { name: "Car Exterior", href: "/shop/car-exterior", image: "/assets/images/EXTERIORcat.webp" },
  { name: "Microfiber Cloth", href: "/shop/microfiber-cloth", image: "/assets/images/microfiber.png" },
  { name: "Kits & Combos", href: "/shop/kits-combos", image: "/assets/images/kitCat.webp" },
];

export default function BottomNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [isCouponsOpen, setIsCouponsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userCoupons, setUserCoupons] = useState([])
  const [availableCoupons, setAvailableCoupons] = useState([])
  const { openCart, cartCount } = useCart()
  const { user, loading: authLoading } = useAuth()

  // Refs for click outside detection
  const shopDropdownRef = useRef(null)
  const shopButtonRef = useRef(null)
  const couponsDropdownRef = useRef(null)
  const couponsButtonRef = useRef(null)

  // State to track if we're on mobile
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    // Initial check
    checkIsMobile()

    // Listen for resize
    window.addEventListener("resize", checkIsMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

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

  // Handle click outside for shop dropdown (mobile only)
  useEffect(() => {
    if (!isMobile) return // Only apply on mobile

    const handleClickOutside = (event) => {
      if (
        isShopOpen &&
        shopDropdownRef.current &&
        shopButtonRef.current &&
        !shopDropdownRef.current.contains(event.target) &&
        !shopButtonRef.current.contains(event.target)
      ) {
        setIsShopOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isShopOpen, isMobile])

  // Handle shop button click (mobile only)
  const handleShopClick = () => {
    if (isMobile) {
      setIsShopOpen(!isShopOpen)
    }
  }

  // Handle shop hover (desktop only)
  const handleShopHover = (isHovering) => {
    if (!isMobile) {
      setIsShopOpen(isHovering)
    }
  }

  // Fetch user's coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      console.log('BottomNavbar - Fetching coupons for user:', user?.id);
      if (user?.id) {
        const { success, data, error } = await ClientUserService.getUserCoupons(user.id);
        console.log('BottomNavbar - Fetch result:', { success, data, error });
        if (success) {
          setUserCoupons(data.userCoupons || []);
          setAvailableCoupons(data.availableCoupons || []);
          console.log('BottomNavbar - Updated state:', {
            userCoupons: data.userCoupons,
            availableCoupons: data.availableCoupons
          });
        } else {
          console.error('BottomNavbar - Failed to fetch coupons:', error);
        }
      }
    };
    if (!authLoading) {
      fetchCoupons();
    }
  }, [user?.id, authLoading]);

  // Add a debug log when state changes
  // useEffect(() => {
  //   console.log('BottomNavbar - Current coupon state:', {
  //     userCoupons,
  //     availableCoupons,
  //     isCouponsOpen,
  //     authLoading,
  //     user: !!user
  //   });
  // }, [userCoupons, availableCoupons, isCouponsOpen, authLoading, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    const match = SEARCH_MAP.find(item =>
      item.keywords.some(keyword => query.includes(keyword))
    );
    if (match) {
      window.location.href = match.route;
    } else {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <div style={{ position: "relative", zIndex: 10 }}>
      <div className="border-b border-gray-200 py-3 bg-white relative">
        <div className="container mx-auto flex justify-between items-center px-6">
          {/* Desktop Shop Button and Dropdown - Updated with ExtraNavbar logic */}
          <div
            ref={shopButtonRef}
            className="relative"
            onMouseEnter={() => handleShopHover(true)}
            onMouseLeave={() => handleShopHover(false)}
          >
            <button
              className="flex items-center gap-1 font-medium text-sm hover:bg-transparent p-0 h-auto bg-transparent border-none cursor-pointer transition-colors"
              onClick={handleShopClick}
            >
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

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="search"
                placeholder="Search for microfiber clothes or any other product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 text-sm border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="sr-only">Search</span>
              </button>
            </form>
          </div>

          <div className="flex items-center space-x-6">
            {/* Coupons icon with hover */}
            <div className="relative">
              <button
                ref={couponsButtonRef}
                className="h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
                onMouseEnter={() => setIsCouponsOpen(true)}
                onMouseLeave={() => setIsCouponsOpen(false)}
              >
                <svg viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[20px] h-[20px] md:w-[20px] md:h-[20px]">
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

            {/* Shine icon (wish list) */}
            <Link href="/wishlist" aria-label="Go to Shine List">
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
                <span className="sr-only">Shine List</span>
              </button>
            </Link>

            {/* Cart icon */}
            <button
              onClick={openCart}
              className="relative h-auto w-auto p-0 hover:bg-transparent bg-transparent border-none cursor-pointer transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-[18px] h-[18px] md:w-5 md:h-5"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-[10px] md:text-xs">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* SHOP Dropdown with lower z-index - Exact same as ExtraNavbar */}
      <div
        ref={shopDropdownRef}
        className={`absolute left-0 right-0 bg-white shadow-lg border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
          isShopOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ zIndex: 50 }}
        onMouseEnter={() => handleShopHover(true)}
        onMouseLeave={() => handleShopHover(false)}
      >
        <div className="container mx-auto py-4 md:py-8 px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {STATIC_CATEGORIES.map((category, index) => (
              <Link key={index} href={category.href} className="block group" onClick={() => setIsShopOpen(false)}>
                <div className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="relative aspect-[3/2] bg-gray-100">
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="bg-black text-white py-2 md:py-3 px-2 md:px-4 text-center">
                    <span className="font-medium text-xs md:text-sm">{category.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Coupons dropdown with hover - Responsive positioning - Exact same as ExtraNavbar */}
      <div
        ref={couponsDropdownRef}
        className={`absolute right-2 md:right-6 top-full bg-white shadow-lg z-30 border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 ease-in-out w-72 md:w-80 ${
          isCouponsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        onMouseEnter={() => setIsCouponsOpen(true)}
        onMouseLeave={() => setIsCouponsOpen(false)}
      >
        <div className="p-2">
          <div className="coupon-scroll-area max-h-80 overflow-y-auto" style={{ overscrollBehavior: 'contain', touchAction: 'auto' }}>
            {authLoading ? (
              <div className="text-center p-4">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : user ? (
              availableCoupons.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-600 px-2 pt-2">Available Coupons</h4>
                  {availableCoupons.map((coupon) => (
                    <CouponCard
                      key={`avail-${coupon.id}`}
                      code={coupon.code}
                      discount={coupon.discount}
                      validUpto={coupon.validUpto}
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
    </div>
  )
}
