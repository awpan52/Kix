import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { Product } from '../types/product';
import { useProducts } from './ProductsContext';

interface FavoritesContextType {
  favorites: Product[];
  favoriteIds: string[];
  addToFavorites: (productId: string) => void;
  removeFromFavorites: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  getFavoritesCount: () => number;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'kix-favorites-guest';

// Helper function to load favorites from Firebase
const loadFavoritesFromFirebase = async (userId: string): Promise<string[]> => {
  console.log(`[Favorites] 📥 Fetching favorites from Firestore for user: ${userId}`);
  console.log(`[Favorites] 📥 Firestore path: /favorites/${userId}`);
  
  try {
    const favoritesRef = doc(db, 'favorites', userId);
    const favoritesSnap = await getDoc(favoritesRef);
    
    console.log(`[Favorites] 📥 Firestore response - exists: ${favoritesSnap.exists()}`);
    
    if (favoritesSnap.exists()) {
      const data = favoritesSnap.data();
      console.log(`[Favorites] 📥 Firestore data:`, data);
      const productIds = data?.productIds;
      if (Array.isArray(productIds)) {
        console.log(`[Favorites] ✅ Loaded ${productIds.length} favorites from Firebase:`, productIds);
        return productIds;
      } else {
        console.warn(`[Favorites] ⚠️ productIds is not an array:`, productIds);
      }
    } else {
      console.log(`[Favorites] 📭 No favorites document exists in Firebase for user: ${userId}`);
    }
    return [];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Favorites] ❌ Error fetching favorites from Firebase:`, error);
    console.error(`[Favorites] ❌ Error message: ${errorMessage}`);
    // Check if it's a permissions error
    if (errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
      console.error(`[Favorites] ❌ PERMISSION ERROR - Check Firestore rules for /favorites/${userId}`);
    }
    return [];
  }
};

// Helper function to load guest favorites from localStorage
const loadGuestFavorites = (): string[] => {
  const guestFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
  if (guestFavorites) {
    try {
      const parsed = JSON.parse(guestFavorites);
      if (Array.isArray(parsed)) {
        console.log('[Favorites] Loaded guest favorites from localStorage:', parsed.length);
        return parsed;
      }
    } catch {
      console.error('[Favorites] Failed to parse guest favorites');
    }
  }
  return [];
};

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { products } = useProducts();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialLoadRef = useRef(true);
  const previousUserIdRef = useRef<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      const newUserId = firebaseUser?.uid || null;
      const previousUserId = previousUserIdRef.current;
      const isInitialLoad = isInitialLoadRef.current;

      console.log('[Favorites] Auth state changed:', { 
        previousUserId, 
        newUserId,
        isInitialLoad,
        userEmail: firebaseUser?.email 
      });

      // User logged out
      if (previousUserId && !newUserId) {
        console.log('[Favorites] User logged out, clearing favorites state');
        setFavoriteIds([]);
        setCurrentUserId(null);
        // Load guest favorites from localStorage
        const guestIds = loadGuestFavorites();
        if (guestIds.length > 0) {
          setFavoriteIds(guestIds);
        }
        setIsLoading(false);
      }
      // User logged in (new login or returning user)
      else if (newUserId) {
        const isReturningUser = previousUserId === null && !isInitialLoad;
        console.log(`[Favorites] User logged in - isReturningUser: ${isReturningUser}, userId: ${newUserId}`);
        
        setCurrentUserId(newUserId);
        setIsLoading(true);

        try {
          // Always fetch user's favorites from Firebase when logging in
          const userIds = await loadFavoritesFromFirebase(newUserId);
          console.log(`[Favorites] Fetched ${userIds.length} favorites from Firebase`);

          // Get guest favorites for potential merge (only on initial signup, not returning login)
          const guestIds = loadGuestFavorites();
          
          // Only merge guest favorites on initial load (first time user signs up)
          // Don't merge when user is logging back in after logging out
          if (guestIds.length > 0 && isInitialLoad) {
            console.log(`[Favorites] Initial load with guest favorites - merging ${guestIds.length} guest + ${userIds.length} user favorites`);
            const mergedIds = [...new Set([...userIds, ...guestIds])];

            // Save merged favorites to Firebase
            const favoritesRef = doc(db, 'favorites', newUserId);
            await setDoc(favoritesRef, { 
              productIds: mergedIds, 
              updatedAt: new Date().toISOString() 
            });
            // Clear guest favorites after merge
            localStorage.removeItem(FAVORITES_STORAGE_KEY);
            setFavoriteIds(mergedIds);
            console.log(`[Favorites] Merged and saved ${mergedIds.length} favorites`);
          } else {
            // Just use the user's Firebase favorites (returning user or no guest favorites)
            console.log(`[Favorites] Setting ${userIds.length} favorites from Firebase (no merge needed)`);
            setFavoriteIds(userIds);
          }
        } catch (error) {
          console.error('[Favorites] Error loading favorites:', error);
          setFavoriteIds([]);
        }

        setIsLoading(false);
      }
      // No user (guest mode on initial load)
      else {
        console.log('[Favorites] No user, loading guest favorites');
        setCurrentUserId(null);
        const guestIds = loadGuestFavorites();
        setFavoriteIds(guestIds);
        setIsLoading(false);
      }

      // Update refs for next auth state change
      previousUserIdRef.current = newUserId;
      isInitialLoadRef.current = false;
    });

    return () => unsubscribe();
  }, []);

  // Save favorites to Firebase or localStorage
  const saveFavorites = useCallback(async (newIds: string[]) => {
    if (currentUserId) {
      console.log(`[Favorites] 📤 SAVING to Firebase - User: ${currentUserId}, Products: [${newIds.join(', ')}]`);
      console.log(`[Favorites] 📤 Firestore path: /favorites/${currentUserId}`);
      try {
        const favoritesRef = doc(db, 'favorites', currentUserId);
        const dataToSave = { 
          productIds: newIds, 
          updatedAt: new Date().toISOString() 
        };
        console.log(`[Favorites] 📤 Data being saved:`, dataToSave);
        await setDoc(favoritesRef, dataToSave);
        console.log(`[Favorites] ✅ SUCCESS - Favorites saved to Firebase for user: ${currentUserId}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[Favorites] ❌ FAILED to save favorites to Firebase:', error);
        console.error(`[Favorites] ❌ Error message: ${errorMessage}`);
        // Check if it's a permissions error
        if (errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
          console.error(`[Favorites] ❌ PERMISSION ERROR - Check Firestore rules for /favorites/${currentUserId}`);
          console.error(`[Favorites] ❌ Make sure firestore.rules has: match /favorites/{userId} { allow read, write: if request.auth != null && request.auth.uid == userId; }`);
        }
      }
    } else {
      console.log('[Favorites] 📤 No user logged in - saving guest favorites to localStorage');
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newIds));
      console.log(`[Favorites] ✅ Guest favorites saved to localStorage: [${newIds.join(', ')}]`);
    }
  }, [currentUserId]);

  // Derive favorites products from IDs using products from ProductsContext
  const favorites = favoriteIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  const addToFavorites = useCallback((productId: string) => {
    setFavoriteIds((prev) => {
      if (prev.includes(productId)) return prev;
      const newIds = [...prev, productId];
      saveFavorites(newIds);
      return newIds;
    });
  }, [saveFavorites]);

  const removeFromFavorites = useCallback((productId: string) => {
    setFavoriteIds((prev) => {
      const newIds = prev.filter((id) => id !== productId);
      saveFavorites(newIds);
      return newIds;
    });
  }, [saveFavorites]);

  const toggleFavorite = useCallback((productId: string) => {
    console.log(`[Favorites] 💜 toggleFavorite called for product: ${productId}`);
    console.log(`[Favorites] 💜 Current user ID: ${currentUserId || 'NONE (guest)'}`);
    
    setFavoriteIds((prev) => {
      const isCurrentlyFavorite = prev.includes(productId);
      const newIds = isCurrentlyFavorite
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      
      console.log(`[Favorites] 💜 Action: ${isCurrentlyFavorite ? 'REMOVING' : 'ADDING'} product ${productId}`);
      console.log(`[Favorites] 💜 Previous favorites: [${prev.join(', ')}]`);
      console.log(`[Favorites] 💜 New favorites: [${newIds.join(', ')}]`);
      
      saveFavorites(newIds);
      return newIds;
    });
  }, [saveFavorites, currentUserId]);

  const isFavorite = useCallback((productId: string) => {
    return favoriteIds.includes(productId);
  }, [favoriteIds]);

  const getFavoritesCount = useCallback(() => {
    return favoriteIds.length;
  }, [favoriteIds]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        isFavorite,
        getFavoritesCount,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
