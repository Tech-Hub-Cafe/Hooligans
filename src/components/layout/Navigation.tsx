"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Coffee, Menu, ShoppingBag, Home, Info, Phone, User, LogIn, Shield } from "lucide-react";
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
    <nav className="bg-black text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Coffee className="w-7 h-7 text-teal transition-transform group-hover:rotate-12 duration-300" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-teal">Hooligans</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`flex items-center space-x-1.5 transition-colors duration-200 text-sm ${
                pathname === "/" ? "text-teal" : "text-white hover:text-teal"
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Home</span>
            </Link>
            <Link
              href="/menu"
              className={`flex items-center space-x-1.5 transition-colors duration-200 text-sm ${
                pathname === "/menu" ? "text-teal" : "text-white hover:text-teal"
              }`}
            >
              <Menu className="w-4 h-4" />
              <span className="font-medium">Menu</span>
            </Link>
            <Link
              href="/about"
              className={`flex items-center space-x-1.5 transition-colors duration-200 text-sm ${
                pathname === "/about" ? "text-teal" : "text-white hover:text-teal"
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="font-medium">About</span>
            </Link>
            <Link
              href="/contact"
              className={`flex items-center space-x-1.5 transition-colors duration-200 text-sm ${
                pathname === "/contact" ? "text-teal" : "text-white hover:text-teal"
              }`}
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">Contact</span>
            </Link>

            {/* Admin Link - Only for admins */}
            {session?.user?.isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center space-x-1.5 transition-colors duration-200 text-sm ${
                  pathname.startsWith("/admin") ? "text-teal" : "text-white hover:text-teal"
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

          {/* Mobile */}
          <div className="md:hidden flex items-center space-x-3">
            {session ? (
              <Link href="/profile">
                <User className="w-5 h-5 text-teal" />
              </Link>
            ) : (
              <Link href="/auth/login">
                <LogIn className="w-5 h-5 text-white" />
              </Link>
            )}
            <Link href="/cart" className="relative">
              <ShoppingBag className="w-5 h-5 text-teal" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 space-x-4 flex flex-wrap">
          <Link
            href="/"
            className={`text-xs ${pathname === "/" ? "text-teal" : "text-white"}`}
          >
            Home
          </Link>
          <Link
            href="/menu"
            className={`text-xs ${pathname === "/menu" ? "text-teal" : "text-white"}`}
          >
            Menu
          </Link>
          <Link
            href="/about"
            className={`text-xs ${pathname === "/about" ? "text-teal" : "text-white"}`}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`text-xs ${pathname === "/contact" ? "text-teal" : "text-white"}`}
          >
            Contact
          </Link>
          {session?.user?.isAdmin && (
            <Link
              href="/admin"
              className={`text-xs ${pathname.startsWith("/admin") ? "text-teal" : "text-white"}`}
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
