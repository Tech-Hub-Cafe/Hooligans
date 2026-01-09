"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  User,
  CreditCard,
  Edit,
  LogIn,
} from "lucide-react";
import { CartItem, MenuItem } from "@/types";
import Link from "next/link";
import SquarePaymentForm from "@/components/checkout/SquarePaymentForm";
import { getCart, setCart, clearCart } from "@/lib/cartStorage";
import EditCartItemDialog from "@/components/cart/EditCartItemDialog";

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [cartItems, setCartItemsState] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    instructions: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [formValid, setFormValid] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [continueAsGuest, setContinueAsGuest] = useState<boolean | null>(null); // null = not chosen, true = guest, false = login

  // Pre-fill form with session data
  useEffect(() => {
    if (session?.user) {
      setCustomerInfo((prev) => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
      }));
    }
  }, [session]);

  // Load cart from appropriate storage
  useEffect(() => {
    const cart = getCart(isAuthenticated);
    setCartItemsState(cart);
  }, [isAuthenticated]);

  // Validate form
  useEffect(() => {
    const isValid = customerInfo.name.trim() !== "" && customerInfo.email.trim() !== "";
    setFormValid(isValid);
  }, [customerInfo]);

  const updateQuantity = (itemId: number, change: number) => {
    const updatedCart = cartItems
      .map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      )
      .filter((item) => item.quantity > 0);

    setCart(updatedCart, isAuthenticated);
    setCartItemsState(updatedCart);
  };

  const removeItem = (itemId: number) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId);
    setCart(updatedCart, isAuthenticated);
    setCartItemsState(updatedCart);
  };

  const handleEditItem = async (item: CartItem) => {
    setEditingItem(item);
    
    // Fetch menu items if not already loaded
    if (menuItems.length === 0) {
      setIsLoadingMenu(true);
      try {
        const response = await fetch("/api/menu");
        if (response.ok) {
          const data = await response.json();
          setMenuItems(data.items || []);
        }
      } catch (error) {
        console.error("Error fetching menu items:", error);
      } finally {
        setIsLoadingMenu(false);
      }
    }
  };

  const handleSaveEditedItem = (updatedItem: CartItem) => {
    const updatedCart = cartItems.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
    setCart(updatedCart, isAuthenticated);
    setCartItemsState(updatedCart);
    setEditingItem(null);
  };

  const getMenuItemForCartItem = (cartItem: CartItem): MenuItem | null => {
    // Extract base item ID from cart item ID
    // Cart item IDs can be composite: "itemId-modifier1-modifier2" or just "itemId"
    const cartItemIdStr = String(cartItem.id);
    
    // Check if it's a composite key (has dashes)
    // Extract the base ID (everything before the first dash)
    const dashIndex = cartItemIdStr.indexOf('-');
    const baseItemId = dashIndex > 0 ? cartItemIdStr.substring(0, dashIndex) : cartItemIdStr;
    
    console.log("[Cart Edit] Matching cart item:", {
      cartItemId: cartItem.id,
      cartItemIdStr,
      baseItemId,
      menuItemsCount: menuItems.length,
      cartItemName: cartItem.name,
    });
    
    // Try to find by square_id first, then by id (handle both string and number)
    // Try exact match first, then base ID match
    const menuItem = menuItems.find(
      (mi) => {
        const miSquareId = mi.square_id ? String(mi.square_id) : null;
        const miId = String(mi.id);
        
        // Exact matches
        if (miSquareId === cartItemIdStr || miId === cartItemIdStr) {
          console.log("[Cart Edit] Found exact match:", { miSquareId, miId, cartItemIdStr });
          return true;
        }
        
        // Base ID matches (for composite keys)
        if (baseItemId !== cartItemIdStr) {
          if (miSquareId === baseItemId || miId === baseItemId) {
            console.log("[Cart Edit] Found base ID match:", { miSquareId, miId, baseItemId });
            return true;
          }
        }
        
        // Also try matching by square_id and id as numbers/strings
        if (mi.square_id === cartItem.id || mi.id === cartItem.id) {
          console.log("[Cart Edit] Found direct match:", { miSquareId: mi.square_id, miId: mi.id, cartItemId: cartItem.id });
          return true;
        }
        
        return false;
      }
    );
    
    // If no match found by ID, try matching by name as a fallback
    if (!menuItem) {
      console.warn("[Cart Edit] No menu item found by ID, trying name match:", {
        cartItemId: cartItem.id,
        baseItemId,
        cartItemName: cartItem.name,
        availableMenuIds: menuItems.map(mi => ({ id: mi.id, square_id: mi.square_id, name: mi.name })).slice(0, 5),
      });
      
      // Fallback: match by name (less reliable but might work)
      const nameMatch = menuItems.find(
        (mi) => mi.name.toLowerCase().trim() === cartItem.name.toLowerCase().trim()
      );
      
      if (nameMatch) {
        console.log("[Cart Edit] Found match by name:", nameMatch.name);
        return nameMatch;
      }
    }
    
    return menuItem || null;
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handlePaymentSuccess = async (paymentToken: string) => {
    setError("");

    try {
      // Create order first
      const orderData = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone || null,
        items: cartItems,
        total: calculateTotal(),
        special_instructions: customerInfo.instructions || null,
        user_id: session?.user?.id || null,
      };

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const order = await orderResponse.json();

      // Process payment with Square
      const paymentResponse = await fetch("/api/square/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: paymentToken,
          orderId: order.id,
          amount: calculateTotal(),
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
        }),
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Payment failed");
      }

      // Clear cart from appropriate storage
      clearCart(isAuthenticated);

      setOrderNumber(`#${order.id}`);
      setOrderPlaced(true);
    } catch (err) {
      console.error("Error processing order:", err);
      setError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full shadow-xl border-0">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Order Placed!</h2>
            <p className="text-gray-600 mb-2">Thank you for your order</p>
            <p className="text-2xl font-bold text-teal mb-6">{orderNumber}</p>
            <p className="text-gray-600 mb-8">
              We&apos;ll have your order ready soon!
              {customerInfo.email && (
                <span className="block mt-2 text-sm">
                  Confirmation sent to {customerInfo.email}
                </span>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push("/menu")}
                className="bg-teal hover:bg-teal-dark text-white"
              >
                Order More
              </Button>
              {session && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/orders")}
                >
                  View Orders
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => router.push("/menu")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Button>

        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        {cartItems.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="py-16 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-2xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some delicious items to get started!</p>
              <Button
                onClick={() => router.push("/menu")}
                className="bg-teal hover:bg-teal-dark text-white"
              >
                Browse Menu
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              {/* Edit Order Header */}
              <div className="flex items-center justify-between pb-2">
                <h2 className="text-lg font-semibold text-gray-700">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your order
                </h2>
                <Link href="/menu">
                  <Button variant="outline" size="sm" className="text-teal border-teal hover:bg-teal hover:text-white">
                    <Plus className="w-4 h-4 mr-1" />
                    Add More Items
                  </Button>
                </Link>
              </div>

              {cartItems.map((item) => (
                <Card key={item.id} className="shadow-md border-0 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Item Details */}
                      <div className="flex-1 p-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-teal hover:bg-teal/10"
                            disabled={isProcessing}
                            title="Edit item"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.modifiers.map((modifier, idx) => (
                              <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="text-gray-400">+</span>
                                <span>{modifier.modifierName}</span>
                                {modifier.modifierPrice > 0 && (
                                  <span className="text-gray-500">
                                    (+${modifier.modifierPrice.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {item.comment && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium mb-1">Special Instructions:</p>
                            <p className="text-sm text-gray-700">{item.comment}</p>
                          </div>
                        )}
                        <p className="text-teal font-bold text-lg mt-2">${item.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Subtotal: ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-center justify-center px-4 bg-gray-50 border-l">
                        <span className="text-xs text-gray-500 mb-2">Qty</span>
                        <div className="flex items-center gap-1 bg-white rounded-full border shadow-sm">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 rounded-full hover:bg-gray-100"
                            disabled={isProcessing}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-bold text-lg">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 rounded-full hover:bg-gray-100"
                            disabled={isProcessing}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        className="h-auto px-4 rounded-none text-red-500 hover:text-red-700 hover:bg-red-50 border-l"
                        disabled={isProcessing}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Subtotal for mobile */}
              <div className="lg:hidden p-4 bg-white rounded-xl shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Subtotal</span>
                  <span className="text-xl font-bold text-teal">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div>
              <Card className="shadow-lg border-0 sticky top-24">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal" />
                    Checkout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Auth Status */}
                  {session ? (
                    <div className="mb-6 p-4 bg-teal/10 rounded-xl border border-teal/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-medium block">User Checkout</span>
                          <span className="text-sm text-gray-600">{session.user?.email}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Guest/Login Choice Toggle */}
                      {continueAsGuest === null ? (
                        <div className="mb-6 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
                          <div className="text-center mb-6">
                            <p className="font-bold text-xl text-gray-900 mb-2">
                              Continue as guest?
                            </p>
                            <p className="text-sm text-gray-500">
                              Choose how you&apos;d like to checkout
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              onClick={() => setContinueAsGuest(true)}
                              className="w-full bg-teal hover:bg-teal/90 text-white h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                            >
                              <User className="w-5 h-5 mr-2" />
                              Yes, Continue as Guest
                            </Button>
                            <div className="flex items-center justify-center py-1">
                              <span className="text-sm text-gray-500 font-medium">or</span>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full h-12 text-base font-semibold border-2 hover:bg-gray-50 transition-all flex items-center justify-center"
                              onClick={() => {
                                setContinueAsGuest(false);
                                router.push("/auth/login?callbackUrl=/cart");
                              }}
                            >
                              <LogIn className="w-5 h-5 mr-2" />
                              Sign In
                            </Button>
                          </div>
                        </div>
                      ) : continueAsGuest ? (
                        <div className="mb-6 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900 block">Guest Checkout</span>
                                <span className="text-xs text-gray-500">No account required</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setContinueAsGuest(null)}
                              className="text-xs text-gray-600 hover:text-gray-900"
                            >
                              Change
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 ml-14">
                            Please fill in your details below to complete your order
                          </p>
                        </div>
                      ) : (
                        <div className="mb-6 p-5 bg-teal/5 rounded-xl border border-teal/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center">
                                <LogIn className="w-5 h-5 text-teal" />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900 block">Sign In Required</span>
                                <span className="text-xs text-gray-500">Track orders and earn rewards</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setContinueAsGuest(null)}
                              className="text-xs text-gray-600 hover:text-gray-900"
                            >
                              Change
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 mb-4 ml-14">
                            Please sign in to continue with your order
                          </p>
                          <Link href="/auth/login?callbackUrl=/cart" className="ml-14 block">
                            <Button className="w-full bg-teal hover:bg-teal/90 text-white font-semibold shadow-md hover:shadow-lg transition-all">
                              <LogIn className="w-4 h-4 mr-2" />
                              Sign In
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-4">
                    {error && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    {/* Show form only if logged in OR if guest checkout is selected */}
                    {(session || continueAsGuest === true) && (
                      <>
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        required
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, name: e.target.value })
                        }
                        placeholder="John Doe"
                        className="mt-1"
                        disabled={isProcessing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, email: e.target.value })
                        }
                        placeholder="john@example.com"
                        className="mt-1"
                        disabled={isProcessing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, phone: e.target.value })
                        }
                        placeholder="(555) 123-4567"
                        className="mt-1"
                        disabled={isProcessing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="instructions">Special Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={customerInfo.instructions}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, instructions: e.target.value })
                        }
                        placeholder="Any special requests..."
                        rows={2}
                        className="mt-1"
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="pt-4 border-t space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax</span>
                        <span>$0.00</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">Total</span>
                        <span className="text-2xl font-bold text-teal">
                          ${calculateTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>

                        {/* Square Payment Form */}
                        <div className="pt-4">
                          {formValid ? (
                            <SquarePaymentForm
                              amount={calculateTotal()}
                              onPaymentSuccess={handlePaymentSuccess}
                              onPaymentError={handlePaymentError}
                              isProcessing={isProcessing}
                              setIsProcessing={setIsProcessing}
                            />
                          ) : (
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-500">
                                Please fill in your name and email to proceed with payment
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Show message if not logged in and haven't chosen guest/login */}
                    {!session && continueAsGuest === null && (
                      <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">
                          Please choose to continue as guest or sign in to proceed
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Edit Cart Item Dialog */}
        {editingItem && (
          <EditCartItemDialog
            cartItem={editingItem}
            menuItem={getMenuItemForCartItem(editingItem)}
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSave={handleSaveEditedItem}
          />
        )}
      </div>
    </div>
  );
}
