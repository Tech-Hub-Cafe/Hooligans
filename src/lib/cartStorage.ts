// Cart storage utilities
// Uses sessionStorage for guests, localStorage for logged-in users

const CART_KEY = "cafeCart";

export function getCartStorage(isAuthenticated: boolean): Storage {
  if (typeof window === "undefined") {
    // Return a mock storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    };
  }
  
  // Use localStorage for authenticated users (persists across sessions)
  // Use sessionStorage for guests (clears when browser closes)
  return isAuthenticated ? localStorage : sessionStorage;
}

export function getCart(isAuthenticated: boolean): CartItem[] {
  const storage = getCartStorage(isAuthenticated);
  const cart = storage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

export function setCart(items: CartItem[], isAuthenticated: boolean): void {
  const storage = getCartStorage(isAuthenticated);
  storage.setItem(CART_KEY, JSON.stringify(items));
  
  // Dispatch event for components to react
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartUpdated"));
  }
}

export function clearCart(isAuthenticated: boolean): void {
  const storage = getCartStorage(isAuthenticated);
  storage.removeItem(CART_KEY);
  
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartUpdated"));
  }
}

// Migrate cart from sessionStorage to localStorage on login
export function migrateCartOnLogin(): void {
  if (typeof window === "undefined") return;
  
  const sessionCart = sessionStorage.getItem(CART_KEY);
  if (sessionCart) {
    const existingLocalCart = localStorage.getItem(CART_KEY);
    
    if (existingLocalCart) {
      // Merge carts - combine items, update quantities for duplicates
      const sessionItems: CartItem[] = JSON.parse(sessionCart);
      const localItems: CartItem[] = JSON.parse(existingLocalCart);
      
      const mergedCart = [...localItems];
      
      sessionItems.forEach((sessionItem) => {
        const existingIndex = mergedCart.findIndex((item) => item.id === sessionItem.id);
        if (existingIndex >= 0) {
          mergedCart[existingIndex].quantity += sessionItem.quantity;
        } else {
          mergedCart.push(sessionItem);
        }
      });
      
      localStorage.setItem(CART_KEY, JSON.stringify(mergedCart));
    } else {
      // Just move session cart to local storage
      localStorage.setItem(CART_KEY, sessionCart);
    }
    
    // Clear session cart after migration
    sessionStorage.removeItem(CART_KEY);
    
    window.dispatchEvent(new Event("cartUpdated"));
  }
}

// Get cart count for display (checks both storages)
export function getCartCount(isAuthenticated: boolean): number {
  const cart = getCart(isAuthenticated);
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

