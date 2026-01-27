"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Coffee, Menu, ShoppingBag, Home, Info, Phone, User, LogIn, Shield, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCart, migrateCartOnLogin } from "@/lib/cartStorage";
import { MenuItem } from "@/types";

// Menu fetch function (same as in menu page)
async function fetchMenuItems(): Promise<{ items: MenuItem[]; categories: string[] }> {
  const response = await fetch("/api/menu");
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch menu items");
  }
  const data = await response.json();

  if (data.items) {
    return {
      items: data.items,
      categories: data.categories || [],
    };
  }

  return {
    items: Array.isArray(data) ? data : [],
    categories: [],
  };
}

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  // Prefetch menu items when component mounts (runs on every page)
  useEffect(() => {
    // Prefetch menu in the background - doesn't block page load
    // Use shorter staleTime to ensure fresh data
    queryClient.prefetchQuery({
      queryKey: ["menuItems"],
      queryFn: fetchMenuItems,
      staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    });
  }, [queryClient]);

  // Migrate cart from sessionStorage to localStorage when user logs in
  useEffect(() => {
    if (status === "authenticated") {
      migrateCartOnLogin();
    }
  }, [status]);

  useEffect(() => {
    const updateCartCount = () => {
      const isAuthenticated = status === "authenticated";
      const cart = getCart(isAuthenticated);
      const count = cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
      setCartCount(count);
    };

    updateCartCount();
    window.addEventListener("cartUpdated", updateCartCount);
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, [status]);

  return (
    <nav className="bg-black text-white sticky top-0 z-50 shadow-lg border-b border-white/10">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
            <div className="relative">
              <div className="w-15 h-15 rounded-full bg-white flex items-center justify-center p-1">
                <img
                  src="/logo/Hooligans-Hero-Logo-2.png"
                  alt="Hooligans Logo"
                  className="w-full h-full object-contain transition-transform group-hover:rotate-6 duration-300"
                />
              </div>
            </div>
            <img
              src="/logo/Hooligans LS Logo 1.png"
              alt="Hooligans"
              className="h-5 object-contain brightness-0 invert"
            />
          </Link>

          {/* Navigation Links - Center */}
          <div className="hidden md:flex items-center space-x-6 flex-1 justify-center mx-8">
            <Link
              href="/"
              className={`flex items-center space-x-1.5 transition-colors duration-200 text-sm ${pathname === "/" ? "text-teal" : "text-white hover:text-teal"
                }`}
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Home</span>
            </Link>
            <Link
              href="/menu"
              className={`flex items-center space-x-1.5 transition-colors duration-200 text-sm ${pathname === "/menu" ? "text-teal" : "text-white hover:text-teal"
                }`}
            >
              <Menu className="w-4 h-4" />
              <span className="font-medium">Menu</span>
            </Link>
            <Link
              href="/about"
              className={`flex items-center space-x-1.5 transition-colors duration-200 text-sm ${pathname === "/about" ? "text-teal" : "text-white hover:text-teal"
                }`}
            >
              <Info className="w-4 h-4" />
              <span className="font-medium">About</span>
            </Link>
            <Link
              href="/contact"
              className={`flex items-center space-x-1.5 transition-colors duration-200 text-sm ${pathname === "/contact" ? "text-teal" : "text-white hover:text-teal"
                }`}
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">Contact</span>
            </Link>
          </div>

          {/* Action Buttons - Right */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {/* Admin Link - Only for admins */}
            {session?.user?.isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center space-x-1.5 transition-colors duration-200 text-sm ${pathname.startsWith("/admin") ? "text-teal" : "text-white hover:text-teal"
                  }`}
              >
                <Shield className="w-4 h-4" />
                <span className="font-medium">Admin</span>
              </Link>
            )}

            {/* Auth */}
            {status === "loading" ? (
              <div className="w-20 h-9 bg-gray-800 rounded animate-pulse" />
            ) : session ? (
              <Link href="/profile">
                <Button
                  variant="outline"
                  className="border-teal text-teal hover:bg-teal hover:text-white text-sm"
                >
                  <User className="w-4 h-4 mr-1.5" />
                  Profile
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="border-teal text-teal hover:bg-teal hover:text-white text-sm"
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative group">
              <Button className="bg-teal hover:bg-teal-dark text-white font-medium px-4 text-sm">
                <ShoppingBag className="w-4 h-4 mr-1.5" />
                Cart
                {cartCount > 0 && (
                  <span className="ml-1.5 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          {/* Mobile Header Actions */}
          <div className="md:hidden flex items-center space-x-3 ml-auto">
            {/* Cart */}
            <Link href="/cart" className="relative">
              <ShoppingBag className="w-6 h-6 text-teal" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:text-teal transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu - Slide Down */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 animate-in slide-in-from-top duration-200">
            <div className="py-4 space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors ${pathname === "/"
                    ? "text-teal bg-white/5 border-l-4 border-teal"
                    : "text-white hover:text-teal hover:bg-white/5"
                  }`}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>

              <Link
                href="/menu"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors ${pathname === "/menu"
                    ? "text-teal bg-white/5 border-l-4 border-teal"
                    : "text-white hover:text-teal hover:bg-white/5"
                  }`}
              >
                <Menu className="w-5 h-5" />
                <span>Menu</span>
              </Link>

              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors ${pathname === "/about"
                    ? "text-teal bg-white/5 border-l-4 border-teal"
                    : "text-white hover:text-teal hover:bg-white/5"
                  }`}
              >
                <Info className="w-5 h-5" />
                <span>About</span>
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors ${pathname === "/contact"
                    ? "text-teal bg-white/5 border-l-4 border-teal"
                    : "text-white hover:text-teal hover:bg-white/5"
                  }`}
              >
                <Phone className="w-5 h-5" />
                <span>Contact</span>
              </Link>

              {session?.user?.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors ${pathname.startsWith("/admin")
                      ? "text-teal bg-white/5 border-l-4 border-teal"
                      : "text-white hover:text-teal hover:bg-white/5"
                    }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Auth Section */}
              <div className="border-t border-white/10 mt-2 pt-2">
                {status === "loading" ? (
                  <div className="px-4 py-3">
                    <div className="h-10 bg-gray-800 rounded animate-pulse" />
                  </div>
                ) : session ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors ${pathname === "/profile"
                          ? "text-teal bg-white/5 border-l-4 border-teal"
                          : "text-white hover:text-teal hover:bg-white/5"
                        }`}
                    >
                      <User className="w-5 h-5" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-white hover:text-teal hover:bg-white/5 transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
