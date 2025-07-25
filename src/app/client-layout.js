"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import Footer from "@/components/navigation/Footer"
import MainNavbar from "@/components/navigation/MainNavbar"
import { CartProvider } from "@/contexts/CartContext"
import ExtraNavbar from "@/components/navigation/extranavbar"
import { createPortal } from "react-dom"
import MobileNavbar from "@/components/navigation/MobileNavbar"
import { ToastProvider } from '@/components/ui/CustomToast.jsx';
import { useAuth } from '@/contexts/AuthContext'

const supabase = createSupabaseBrowserClient();

export default function ClientLayout({ children, initialCartItems = [] }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth() // Now safely accessing useAuth
  const [loading, setLoading] = useState(false)
  const [showExtraNavbar, setShowExtraNavbar] = useState(true)
  const [showMainNavbar, setShowMainNavbar] = useState(false)
  const [showMobileNavbar, setShowMobileNavbar] = useState(false)
  const [portalContainer, setPortalContainer] = useState(null)
  const [mobilePortalContainer, setMobilePortalContainer] = useState(null)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrollDirection, setScrollDirection] = useState("up")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize scroll state with a delay to prevent blocking
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 50);

    return () => {
      clearTimeout(timer);
      setIsInitialized(false);
    };
  }, []);

  // Reset states on route change
  useEffect(() => {
    setShowExtraNavbar(true)
    setShowMainNavbar(false)
    setShowMobileNavbar(false)
    setLastScrollY(0)
    setScrollDirection("up")
    setIsMobileMenuOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  // Handle mobile menu state
  const handleMobileMenuToggle = (newState) => {
    if (!isInitialized) return;
    setIsMobileMenuOpen(newState);
  };

  // Scroll effect
  useEffect(() => {
    if (!isInitialized) return;

    const isHomePage = pathname === "/" || pathname === "/home"

    const handleScroll = () => {
      if (isMobileMenuOpen) return;

      let scrollY = 0

      const smoothContent = document.getElementById("smooth-content")
      if (smoothContent && isHomePage) {
        const transform = window.getComputedStyle(smoothContent).transform
        if (transform && transform !== "none") {
          try {
            const matrix = new DOMMatrix(transform)
            scrollY = Math.abs(matrix.m42)
          } catch (e) {
            scrollY = window.pageYOffset || document.documentElement.scrollTop
          }
        }
      } else {
        scrollY = window.pageYOffset || document.documentElement.scrollTop
      }

      const scrollDifference = Math.abs(scrollY - lastScrollY)
      const isActuallyScrolling = scrollDifference > 1

      let currentScrollDirection = scrollDirection
      if (isActuallyScrolling) {
        currentScrollDirection = scrollY > lastScrollY ? "down" : "up"
        setScrollDirection(currentScrollDirection)
        setLastScrollY(scrollY)
      }

      // ExtraNavbar logic
      if (scrollY <= 10) {
        setShowExtraNavbar(true)
      } else if (scrollY > 100) {
        setShowExtraNavbar(false)
      }

      // MainNavbar logic (desktop only)
      if (scrollY > 50 && isActuallyScrolling) {
        if (currentScrollDirection === "up") {
          setShowMainNavbar(true)
        } else if (currentScrollDirection === "down") {
          setShowMainNavbar(false)
        }
      } else if (scrollY <= 50) {
        setShowMainNavbar(false)
      }

      // MobileNavbar logic (mobile only)
      if (!isMobileMenuOpen) {  // Only update mobile navbar visibility if menu is closed
        if (scrollY > 50 && isActuallyScrolling) {
          if (currentScrollDirection === "up") {
            setShowMobileNavbar(true)
          } else if (currentScrollDirection === "down") {
            setShowMobileNavbar(false)
          }
        } else if (scrollY <= 50) {
          setShowMobileNavbar(false)
        }
      }
    }

    const scrollHandler = () => {
      if (!isMobileMenuOpen && isInitialized) {
        requestAnimationFrame(handleScroll)
      }
    }

    // Add event listeners only after initialization
    if (isInitialized) {
      window.addEventListener("scroll", scrollHandler, { passive: true })

      const smoothWrapper = document.getElementById("smooth-wrapper")
      if (smoothWrapper && isHomePage) {
        smoothWrapper.addEventListener("scroll", scrollHandler, { passive: true })
      }

      const smoothContent = document.getElementById("smooth-content")
      let observer = null
      if (smoothContent && isHomePage) {
        observer = new MutationObserver(() => {
          if (!isMobileMenuOpen && isInitialized) {
            handleScroll()
          }
        })
        observer.observe(smoothContent, {
          attributes: true,
          attributeFilter: ["style"],
        })
      }

      // Initial scroll check after a short delay
      const timer = setTimeout(() => {
        if (!isMobileMenuOpen && isInitialized) {
          handleScroll()
        }
      }, 100)

      return () => {
        window.removeEventListener("scroll", scrollHandler)
        if (smoothWrapper && isHomePage) {
          smoothWrapper.removeEventListener("scroll", scrollHandler)
        }
        if (observer) {
          observer.disconnect()
        }
        clearTimeout(timer)
      }
    }
  }, [pathname, lastScrollY, scrollDirection, showMainNavbar, isMobileMenuOpen, isInitialized])

  // Create portal container for MainNavbar (desktop)
  useEffect(() => {
    if (typeof window !== "undefined") {
      let navbarContainer = document.getElementById("navbar-portal")
      if (!navbarContainer) {
        navbarContainer = document.createElement("div")
        navbarContainer.id = "navbar-portal"
        // Set initial hidden styles immediately
        navbarContainer.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 99999 !important;
          pointer-events: none !important;
          opacity: 0 !important;
          transform: translateY(-100%) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        `
        document.body.appendChild(navbarContainer)
      }
      setPortalContainer(navbarContainer)
    }

    return () => {
      const navbarContainer = document.getElementById("navbar-portal")
      if (navbarContainer && document.body.contains(navbarContainer)) {
        document.body.removeChild(navbarContainer)
      }
    }
  }, [])

  // Create portal container for MobileNavbar
  useEffect(() => {
    if (typeof window !== "undefined") {
      let mobileNavbarContainer = document.getElementById("mobile-navbar-portal")
      if (!mobileNavbarContainer) {
        mobileNavbarContainer = document.createElement("div")
        mobileNavbarContainer.id = "mobile-navbar-portal"
        // Set initial hidden styles immediately
        mobileNavbarContainer.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 99998 !important;
          pointer-events: none !important;
          opacity: 0 !important;
          transform: translateY(-100%) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        `
        document.body.appendChild(mobileNavbarContainer)
      }
      setMobilePortalContainer(mobileNavbarContainer)
    }

    return () => {
      const mobileNavbarContainer = document.getElementById("mobile-navbar-portal")
      if (mobileNavbarContainer && document.body.contains(mobileNavbarContainer)) {
        document.body.removeChild(mobileNavbarContainer)
      }
    }
  }, [])

  // Handle mobile menu body scroll lock
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Save current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [isMobileMenuOpen])

  // Update portal container styles
  useEffect(() => {
    if (portalContainer) {
      portalContainer.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 99999 !important;
        pointer-events: ${showMainNavbar ? "auto" : "none"} !important;
        opacity: ${showMainNavbar ? "1" : "0"} !important;
        transform: translateY(${showMainNavbar ? "0" : "-100%"}) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      `
    }
  }, [showMainNavbar, portalContainer])

  useEffect(() => {
    if (mobilePortalContainer) {
      mobilePortalContainer.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 99998 !important;
        pointer-events: ${showMobileNavbar ? "auto" : "none"} !important;
        opacity: ${showMobileNavbar ? "1" : "0"} !important;
        transform: translateY(${showMobileNavbar ? "0" : "-100%"}) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      `
    }
  }, [showMobileNavbar, mobilePortalContainer])

  return (
    <CartProvider initialCartItems={initialCartItems}>
      {/* MobileNavbar Portal - Mobile only */}
      {mobilePortalContainer &&
        createPortal(
          <div className="md:hidden">
            <MobileNavbar
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={handleMobileMenuToggle}
            />
          </div>,
          mobilePortalContainer,
        )}

      <div style={{ position: "relative" }} id="smooth-content">
        {/* ExtraNavbar */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            showExtraNavbar ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
          }`}
          style={{ position: "relative", zIndex: 50 }}
        >
          <ExtraNavbar />
        </div>
        <ToastProvider>
          {/* Content */}
          <div style={{ paddingTop: '80px' }}>{children}</div>
          <Footer />
        </ToastProvider>
      </div>

      {/* MainNavbar Portal - Desktop only */}
      {portalContainer &&
        createPortal(
          <div className="hidden md:block">
            <MainNavbar />
          </div>,
          portalContainer,
        )}
    </CartProvider>
  )
}
