"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Minus,
  X,
  Search,
  RefreshCw,
} from "lucide-react";
import { MenuItem, CartItem, SelectedModifier } from "@/types";
import { Input } from "@/components/ui/input";
import { getCart, setCart } from "@/lib/cartStorage";
import ModifierSelector from "@/components/menu/ModifierSelector";

// Category emoji mapping
const categoryEmojis: { [key: string]: string } = {
  "Coffee": "☕",
  "Tea": "🍵",
  "Pastries": "🥐",
  "Sandwiches": "🥪",
  "Breakfast": "🍳",
  "Desserts": "🍰",
  "Drinks": "🥤",
  "Food": "🍽️",
  "Snacks": "🍿",
  "Salads": "🥗",
  "Soups": "🍲",
  "Sides": "🍟",
  "Beverages": "🧃",
  "Hot Drinks": "☕",
  "Cold Drinks": "🧊",
  "Bakery": "🥖",
  "Uncategorized": "📦",
};

async function fetchMenuItems(): Promise<{ items: MenuItem[]; categories: string[] }> {
  const response = await fetch("/api/menu");
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch menu items");
  }
  const data = await response.json();
  
  // Handle new response format with metadata
  if (data.items) {
    // Log warnings/errors for debugging
    if (data.warning) {
      console.warn("[Menu] Warning:", data.warning);
    }
    if (data.error) {
      console.error("[Menu] Error:", data.message || data.error);
    }
    if (data.source) {
      console.log(`[Menu] Items fetched from: ${data.source} (${data.count || 0} items)`);
    }
    
    return {
      items: data.items,
      categories: data.categories || [],
    };
  }
  
  // Fallback for old format (array directly)
  return {
    items: Array.isArray(data) ? data : [],
    categories: [],
  };
}

export default function MenuPage() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  
  // Update page title
  useEffect(() => {
    document.title = "Menu | Hooligans";
  }, []);

  const [visibleCategory, setVisibleCategory] = useState("all"); // For scroll tracking
  const [filterCategory, setFilterCategory] = useState("all"); // For filtering (optional future use)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isManualScroll, setIsManualScroll] = useState(false);
  const [itemModifiers, setItemModifiers] = useState<Map<string | number, SelectedModifier[]>>(new Map());
  const [itemComments, setItemComments] = useState<Map<string | number, string>>(new Map());
  const [openModifierItemId, setOpenModifierItemId] = useState<string | number | null>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const categoryPillsRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data: menuData, isLoading, error: queryError, refetch, isRefetching } = useQuery({
    queryKey: ["menuItems"],
    queryFn: fetchMenuItems,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds - data is considered fresh for 30 seconds
  });

  const handleRefresh = async () => {
    // Force refetch and invalidate cache
    await refetch();
  };

  const menuItems = menuData?.items || [];
  const apiCategories = menuData?.categories || [];

  // Debug: Log items with modifiers
  useEffect(() => {
    const itemsWithModifiers = menuItems.filter(item => item.modifierLists && item.modifierLists.length > 0);
    if (itemsWithModifiers.length > 0) {
      console.log("[Menu] Items with modifiers:", itemsWithModifiers.map(i => ({
        name: i.name,
        modifierLists: i.modifierLists?.map(ml => ml.name)
      })));
    } else {
      console.log("[Menu] No items with modifiers found");
    }
  }, [menuItems]);

  // Build categories array with "All" option
  const categories = [
    { id: "all", name: "All", emoji: "🍽️" },
    ...apiCategories.map((cat) => ({
      id: cat,
      name: cat,
      emoji: categoryEmojis[cat] || "📦",
    })),
  ];
  
  // Store API response metadata for debugging
  const [apiInfo, setApiInfo] = useState<{
    source?: string;
    warning?: string;
    error?: string;
    message?: string;
  } | null>(null);
  
  // Fetch API info separately to get metadata
  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.source || data.warning || data.error || data.message) {
          setApiInfo({
            source: data.source,
            warning: data.warning,
            error: data.error ? data.message : undefined,
            message: data.message,
          });
        }
      })
      .catch(() => {
        // Ignore errors, we already have queryError
      });
  }, []);

  // Load cart from appropriate storage based on auth status
  useEffect(() => {
    const savedCart = getCart(isAuthenticated);
    setCartItems(savedCart);
  }, [isAuthenticated]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      const savedCart = getCart(isAuthenticated);
      setCartItems(savedCart);
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [isAuthenticated]);

  const handleModifiersChange = (itemId: string | number, modifiers: SelectedModifier[], comment?: string) => {
    setItemModifiers((prev) => {
      const newMap = new Map(prev);
      newMap.set(itemId, modifiers);
      return newMap;
    });
    if (comment !== undefined) {
      setItemComments((prev) => {
        const newMap = new Map(prev);
        if (comment.trim()) {
          newMap.set(itemId, comment.trim());
        } else {
          newMap.delete(itemId);
        }
        return newMap;
      });
    }
  };

  const handleAddToCartClick = (item: MenuItem) => {
    // Get modifiers for this item if any
    const modifiers = itemModifiers.get(item.id) || [];
    
    // Validate required modifiers
    if (item.modifierLists && item.modifierLists.length > 0) {
      const hasRequiredModifiers = item.modifierLists.every((modifierList) => {
        if (modifierList.required) {
          return modifiers.some(m => m.modifierListId === modifierList.id);
        }
        return true;
      });
      
      if (!hasRequiredModifiers) {
        // Don't add if required modifiers are missing
        return;
      }
    }
    
    addToCart(item, modifiers);
  };

  const addToCart = (item: MenuItem, modifiers: SelectedModifier[] = []) => {
    const currentCart = getCart(isAuthenticated);
    
    // Calculate total price with modifiers
    const modifierPrice = modifiers.reduce((sum, m) => sum + m.modifierPrice, 0);
    const totalPrice = item.price + modifierPrice;
    
    // Get comment for this item
    const comment = itemComments.get(item.id);
    
    // Create a unique key for this item + modifier combination
    const itemKey = modifiers.length > 0
      ? `${item.id}-${modifiers.map(m => m.modifierId).sort().join('-')}`
      : item.id.toString();
    
    const existing = currentCart.find((i) => {
      if (modifiers.length > 0) {
        // For items with modifiers, check if exact same combination exists
        const existingKey = i.modifiers && i.modifiers.length > 0
          ? `${i.id}-${i.modifiers.map(m => m.modifierId).sort().join('-')}`
          : i.id.toString();
        return existingKey === itemKey;
      } else {
        // For items without modifiers, just check ID
        return i.id === item.id && (!i.modifiers || i.modifiers.length === 0);
      }
    });
    
    let newCart: CartItem[];
    if (existing) {
      newCart = currentCart.map((i) => {
        const iKey = i.modifiers && i.modifiers.length > 0
          ? `${i.id}-${i.modifiers.map(m => m.modifierId).sort().join('-')}`
          : i.id.toString();
        return iKey === itemKey
          ? { ...i, quantity: i.quantity + 1, comment: comment || i.comment }
          : i;
      });
    } else {
      newCart = [...currentCart, {
        id: itemKey,
        originalItemId: item.id, // Store base item ID for Square catalog matching
        name: item.name,
        price: totalPrice,
        basePrice: item.price,
        quantity: 1,
        modifiers: modifiers.length > 0 ? modifiers : undefined,
        comment: comment,
        square_id: item.square_id, // Store Square catalog ID for POS integration
      }];
    }
    
    setCart(newCart, isAuthenticated);
    setCartItems(newCart);
  };

  const removeFromCart = (itemId: number) => {
    const currentCart = getCart(isAuthenticated);
    const existing = currentCart.find((i) => i.id === itemId);
    
    let newCart: CartItem[];
    if (existing && existing.quantity > 1) {
      newCart = currentCart.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    } else {
      newCart = currentCart.filter((i) => i.id !== itemId);
    }
    
    setCart(newCart, isAuthenticated);
    setCartItems(newCart);
  };

  const getCartQuantity = (itemId: number | string) => {
    // For items with modifiers, we need to sum all variations
    // For items without modifiers, just find by ID
    return cartItems
      .filter((i) => {
        if (typeof itemId === 'string' && typeof i.id === 'string') {
          return i.id.startsWith(itemId + '-') || i.id === itemId;
        }
        return i.id === itemId;
      })
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Show all items, only filter by search query (UberEats style - show all categories)
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as { [key: string]: MenuItem[] });

  // Set up Intersection Observer to track visible categories
  useEffect(() => {
    // Wait for items to be loaded
    const categoryKeys = Object.keys(groupedItems);
    if (categoryKeys.length === 0) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const visibleCategories = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Don't update if user manually clicked a category
        if (isManualScroll) return;

        entries.forEach((entry) => {
          const category = entry.target.getAttribute("data-category");
          if (category) {
            if (entry.isIntersecting) {
              // Score based on how close to top of viewport (after nav + header ~200px)
              const rect = entry.boundingClientRect;
              const topOffset = Math.max(0, 220 - rect.top);
              visibleCategories.set(category, topOffset + entry.intersectionRatio * 100);
            } else {
              visibleCategories.delete(category);
            }
          }
        });

        // Find the category with highest visibility score
        if (visibleCategories.size > 0) {
          let maxScore = -1;
          let topCategory = "";

          visibleCategories.forEach((score, cat) => {
            if (score > maxScore) {
              maxScore = score;
              topCategory = cat;
            }
          });

          if (topCategory) {
            setVisibleCategory(topCategory);

            // Scroll the active pill into view
            if (categoryPillsRef.current) {
              const activeButton = categoryPillsRef.current.querySelector(
                `[data-category-pill="${topCategory}"]`
              );
              if (activeButton) {
                activeButton.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "center",
                });
              }
            }
          }
        } else {
          // No categories visible, default to "all"
          setVisibleCategory("all");
        }
      },
      {
        root: null,
        rootMargin: "-200px 0px -50% 0px", // Account for nav + sticky header
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
      }
    );

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      Object.entries(categoryRefs.current).forEach(([category, element]) => {
        if (element) {
          element.setAttribute("data-category", category);
          observerRef.current?.observe(element);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observerRef.current?.disconnect();
    };
  }, [groupedItems, isManualScroll]);

  const scrollToCategory = (categoryId: string) => {
    setVisibleCategory(categoryId);
    
    // Set manual scroll flag to prevent observer from overriding
    setIsManualScroll(true);
    
    if (categoryId === "all") {
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (categoryRefs.current[categoryId]) {
      categoryRefs.current[categoryId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    
    // Reset manual scroll flag after animation completes
    setTimeout(() => {
      setIsManualScroll(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          {/* Search Bar */}
          <div className="py-4">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-gray-100 border-0 rounded-full text-base"
                />
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefetching || isLoading}
                variant="outline"
                className="h-12 px-4 border-gray-300 hover:bg-gray-50"
                title="Refresh menu to see latest items"
              >
                <RefreshCw className={`w-5 h-5 ${isRefetching || isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* API Status Banner */}
          {(apiInfo?.warning || apiInfo?.error || apiInfo?.message) && (
            <div className={`mb-4 p-4 rounded-lg ${
              apiInfo.error 
                ? "bg-red-50 border border-red-200 text-red-800"
                : apiInfo.warning
                ? "bg-amber-50 border border-amber-200 text-amber-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
              <div className="flex items-start gap-2">
                <span className="font-semibold">
                  {apiInfo.error ? "⚠️ Error:" : apiInfo.warning ? "ℹ️ Info:" : "ℹ️"}
                </span>
                <div className="flex-1 text-sm">
                  {apiInfo.error && (
                    <div>
                      <p className="font-medium">{apiInfo.error}</p>
                      {apiInfo.message && <p className="mt-1 text-xs opacity-90">{apiInfo.message}</p>}
                    </div>
                  )}
                  {apiInfo.warning && <p>{apiInfo.warning}</p>}
                  {apiInfo.message && !apiInfo.error && <p>{apiInfo.message}</p>}
                  {apiInfo.source && (
                    <p className="mt-1 text-xs opacity-75">
                      Source: {apiInfo.source}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Authentication Error Banner with Troubleshooting */}
          {apiInfo && (apiInfo as any).authenticationError && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border-2 border-red-300 text-red-900">
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg mb-2">🔐 Square Authentication Failed</h3>
                  <p className="text-sm mb-2">{(apiInfo as any).errorMessage || "Your Square access token is invalid or expired."}</p>
                </div>
                
                {(apiInfo as any).troubleshooting && (
                  <div className="bg-white rounded p-3 border border-red-200">
                    <p className="font-semibold text-xs mb-2">How to fix:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      {(apiInfo as any).troubleshooting.map((step: string, idx: number) => (
                        <li key={idx} className="text-red-800">{step.replace(/^\d+\.\s*/, "")}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {(apiInfo as any).tokenInfo && (
                  <div className="bg-white rounded p-2 border border-red-200 text-xs">
                    <p className="font-semibold mb-1">Current Configuration:</p>
                    <ul className="space-y-1 text-red-700">
                      <li>Token: {(apiInfo as any).tokenInfo.tokenPreview || "Not set"}</li>
                      <li>Environment: {(apiInfo as any).tokenInfo.environment || "unknown"}</li>
                      <li>Has Token: {(apiInfo as any).tokenInfo.hasToken ? "Yes" : "No"}</li>
                    </ul>
                  </div>
                )}
                
                <div className="pt-2 border-t border-red-200">
                  <a 
                    href="https://developer.squareup.com/apps" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-red-700 hover:text-red-900 underline"
                  >
                    → Get a new token from Square Developer Dashboard
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Category Pills */}
          <div 
            ref={categoryPillsRef}
            className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                data-category-pill={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                  visibleCategory === cat.id
                    ? "bg-black text-white scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{cat.emoji}</span>
                <span className="font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Sort categories based on the order defined in categories array */}
            {Object.entries(groupedItems)
              .sort(([a], [b]) => {
                const orderA = categories.findIndex((c) => c.id === a);
                const orderB = categories.findIndex((c) => c.id === b);
                return orderA - orderB;
              })
              .map(([category, items]) => (
              <div
                key={category}
                ref={(el) => { categoryRefs.current[category] = el; }}
                className="scroll-mt-44"
              >
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span>{categories.find((c) => c.id === category)?.emoji}</span>
                  {category}
                </h2>
                <div className="grid gap-4">
                  {items.map((item) => {
                    const quantity = getCartQuantity(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
                      >
                        {/* Item Image */}
                        <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-gray-400 text-2xl">🍽️</span>
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            {item.modifierLists && item.modifierLists.length > 0 && (
                              <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full font-medium">
                                Customizable
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <p className="text-teal font-bold text-lg mt-2">
                            ${item.price.toFixed(2)}
                          </p>
                          
                          {/* Modifier Selector - Only show when opened */}
                          {openModifierItemId === item.id && (
                            <div className="mt-3">
                              {item.modifierLists && item.modifierLists.length > 0 ? (
                                <ModifierSelector
                                  item={item}
                                  onModifiersChange={(modifiers, comment) => handleModifiersChange(item.id, modifiers, comment)}
                                  onAddToCart={() => {
                                    handleAddToCartClick(item);
                                    setOpenModifierItemId(null); // Close after adding
                                  }}
                                />
                              ) : (
                                // For items without modifiers, show simple add button
                                <div className="mt-3 pt-3 border-t">
                                  <Button
                                    onClick={() => {
                                      handleAddToCartClick(item);
                                      setOpenModifierItemId(null);
                                    }}
                                    disabled={!item.available}
                                    className="w-full bg-teal hover:bg-teal-dark text-white"
                                  >
                                    Add to Cart
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Show quantity if item is in cart */}
                          {quantity > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-sm text-gray-600">In cart: {quantity}</span>
                              <Button
                                onClick={() => removeFromCart(typeof item.id === 'number' ? item.id : parseInt(String(item.id)))}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Customize/Add Button */}
                        <div className="flex items-end">
                          <Button
                            onClick={() => {
                              if (openModifierItemId === item.id) {
                                setOpenModifierItemId(null); // Close if already open
                              } else {
                                setOpenModifierItemId(item.id); // Open this item's modifiers
                              }
                            }}
                            disabled={!item.available}
                            className={`rounded-full w-10 h-10 p-0 transition-all ${
                              openModifierItemId === item.id
                                ? "bg-teal-dark text-white"
                                : "bg-teal hover:bg-teal-dark text-white"
                            } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                            title={!item.available ? "This item is unavailable" : "Customize & Add"}
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-2xl">
          <div className="max-w-6xl mx-auto">
            <Button
              onClick={() => router.push("/cart")}
              className="w-full bg-black hover:bg-gray-800 text-white h-14 rounded-xl font-semibold text-lg flex items-center justify-between px-6"
            >
              <div className="flex items-center gap-3">
                <div className="bg-teal rounded-lg px-2 py-1 text-sm">
                  {cartCount}
                </div>
                <span>View Cart</span>
              </div>
              <span>${cartTotal.toFixed(2)}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Cart Slide-out Panel (optional enhancement) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Cart</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCartOpen(false)}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              {/* Cart items would go here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
