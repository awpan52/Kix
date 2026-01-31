import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { Product } from '../types/product';

export interface CartItem {
  product: Product;
  size: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: number) => void;
  removeFromCart: (productId: string, size: number) => void;
  updateQuantity: (productId: string, size: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
  isInCart: (productId: string, size: number) => boolean;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'kix-cart-guest';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      const newUserId = firebaseUser?.uid || null;
      const previousUserId = previousUserIdRef.current;

      console.log('[Cart] Auth state changed:', { 
        previousUserId, 
        newUserId,
        userEmail: firebaseUser?.email 
      });

      // User logged out
      if (previousUserId && !newUserId) {
        console.log('[Cart] User logged out, clearing cart state');
        setItems([]);
        setCurrentUserId(null);
        // Load guest cart from localStorage
        const guestCart = localStorage.getItem(CART_STORAGE_KEY);
        if (guestCart) {
          try {
            setItems(JSON.parse(guestCart));
            console.log('[Cart] Loaded guest cart from localStorage');
          } catch {
            console.error('[Cart] Failed to parse guest cart');
          }
        }
        setIsLoading(false);
      }
      // User logged in (or initial load with user)
      else if (newUserId) {
        console.log(`[Cart] Loading cart for user: ${newUserId}`);
        setCurrentUserId(newUserId);
        setIsLoading(true);

        try {
          // Get guest cart for potential merge
          const guestCart = localStorage.getItem(CART_STORAGE_KEY);
          const guestItems: CartItem[] = guestCart ? JSON.parse(guestCart) : [];

          // Fetch user's cart from Firebase
          const cartRef = doc(db, 'carts', newUserId);
          const cartSnap = await getDoc(cartRef);
          let userItems: CartItem[] = [];

          if (cartSnap.exists()) {
            userItems = cartSnap.data().items || [];
            console.log(`[Cart] Loaded ${userItems.length} items from Firebase for user: ${newUserId}`);
          } else {
            console.log(`[Cart] No existing cart in Firebase for user: ${newUserId}`);
          }

          // Merge guest cart with user cart if guest has items
          if (guestItems.length > 0 && !previousUserId) {
            console.log(`[Cart] Merging ${guestItems.length} guest items with user cart`);
            const mergedItems = [...userItems];
            
            guestItems.forEach((guestItem) => {
              const existingIndex = mergedItems.findIndex(
                (item) => item.product.id === guestItem.product.id && item.size === guestItem.size
              );
              if (existingIndex >= 0) {
                mergedItems[existingIndex].quantity += guestItem.quantity;
              } else {
                mergedItems.push(guestItem);
              }
            });

            // Save merged cart to Firebase
            await setDoc(cartRef, { items: mergedItems, updatedAt: new Date().toISOString() });
            // Clear guest cart
            localStorage.removeItem(CART_STORAGE_KEY);
            setItems(mergedItems);
            console.log(`[Cart] Merged cart saved for user: ${newUserId}`);
          } else {
            setItems(userItems);
          }
        } catch (error) {
          console.error('[Cart] Error loading cart from Firebase:', error);
          setItems([]);
        }

        setIsLoading(false);
      }
      // No user (guest mode on initial load)
      else {
        console.log('[Cart] No user, loading guest cart');
        setCurrentUserId(null);
        const guestCart = localStorage.getItem(CART_STORAGE_KEY);
        if (guestCart) {
          try {
            setItems(JSON.parse(guestCart));
            console.log('[Cart] Loaded guest cart from localStorage');
          } catch {
            console.error('[Cart] Failed to parse guest cart');
          }
        }
        setIsLoading(false);
      }

      previousUserIdRef.current = newUserId;
    });

    return () => unsubscribe();
  }, []);

  // Save cart to Firebase or localStorage
  const saveCart = useCallback(async (newItems: CartItem[]) => {
    if (currentUserId) {
      console.log(`[Cart] Saving cart for user: ${currentUserId}`);
      try {
        const cartRef = doc(db, 'carts', currentUserId);
        await setDoc(cartRef, { 
          items: newItems, 
          updatedAt: new Date().toISOString() 
        });
        console.log(`[Cart] Cart saved to Firebase for user: ${currentUserId}`);
      } catch (error) {
        console.error('[Cart] Error saving cart to Firebase:', error);
      }
    } else {
      console.log('[Cart] Saving guest cart to localStorage');
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    }
  }, [currentUserId]);

  const addToCart = useCallback((product: Product, size: number) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );

      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prev, { product, size, quantity: 1 }];
      }

      saveCart(newItems);
      return newItems;
    });
  }, [saveCart]);

  const removeFromCart = useCallback((productId: string, size: number) => {
    setItems((prev) => {
      const newItems = prev.filter(
        (item) => !(item.product.id === productId && item.size === size)
      );
      saveCart(newItems);
      return newItems;
    });
  }, [saveCart]);

  const updateQuantity = useCallback((productId: string, size: number, quantity: number) => {
    if (quantity < 1) return;

    setItems((prev) => {
      const newItems = prev.map((item) =>
        item.product.id === productId && item.size === size
          ? { ...item, quantity }
          : item
      );
      saveCart(newItems);
      return newItems;
    });
  }, [saveCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, [saveCart]);

  const getCartTotal = useCallback(() => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const isInCart = useCallback((productId: string, size: number) => {
    return items.some((item) => item.product.id === productId && item.size === size);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemCount,
        isInCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
