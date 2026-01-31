import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { Product } from '../types/product';
import { mockProducts } from '../data/mockProducts';

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

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      const newUserId = firebaseUser?.uid || null;
      const previousUserId = previousUserIdRef.current;

      console.log('[Favorites] Auth state changed:', { 
        previousUserId, 
        newUserId,
        userEmail: firebaseUser?.email 
      });

      // User logged out
      if (previousUserId && !newUserId) {
        console.log('[Favorites] User logged out, clearing favorites state');
        setFavoriteIds([]);
        setCurrentUserId(null);
        // Load guest favorites from localStorage
        const guestFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (guestFavorites) {
          try {
            setFavoriteIds(JSON.parse(guestFavorites));
            console.log('[Favorites] Loaded guest favorites from localStorage');
          } catch {
            console.error('[Favorites] Failed to parse guest favorites');
          }
        }
        setIsLoading(false);
      }
      // User logged in (or initial load with user)
      else if (newUserId) {
        console.log(`[Favorites] Loading favorites for user: ${newUserId}`);
        setCurrentUserId(newUserId);
        setIsLoading(true);

        try {
          // Get guest favorites for potential merge
          const guestFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
          const guestIds: string[] = guestFavorites ? JSON.parse(guestFavorites) : [];

          // Fetch user's favorites from Firebase
          const favoritesRef = doc(db, 'favorites', newUserId);
          const favoritesSnap = await getDoc(favoritesRef);
          let userIds: string[] = [];

          if (favoritesSnap.exists()) {
            userIds = favoritesSnap.data().productIds || [];
            console.log(`[Favorites] Loaded ${userIds.length} favorites from Firebase for user: ${newUserId}`);
          } else {
            console.log(`[Favorites] No existing favorites in Firebase for user: ${newUserId}`);
          }

          // Merge guest favorites with user favorites if guest has items
          if (guestIds.length > 0 && !previousUserId) {
            console.log(`[Favorites] Merging ${guestIds.length} guest favorites with user favorites`);
            const mergedIds = [...new Set([...userIds, ...guestIds])];

            // Save merged favorites to Firebase
            await setDoc(favoritesRef, { 
              productIds: mergedIds, 
              updatedAt: new Date().toISOString() 
            });
            // Clear guest favorites
            localStorage.removeItem(FAVORITES_STORAGE_KEY);
            setFavoriteIds(mergedIds);
            console.log(`[Favorites] Merged favorites saved for user: ${newUserId}`);
          } else {
            setFavoriteIds(userIds);
          }
        } catch (error) {
          console.error('[Favorites] Error loading favorites from Firebase:', error);
          setFavoriteIds([]);
        }

        setIsLoading(false);
      }
      // No user (guest mode on initial load)
      else {
        console.log('[Favorites] No user, loading guest favorites');
        setCurrentUserId(null);
        const guestFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (guestFavorites) {
          try {
            setFavoriteIds(JSON.parse(guestFavorites));
            console.log('[Favorites] Loaded guest favorites from localStorage');
          } catch {
            console.error('[Favorites] Failed to parse guest favorites');
          }
        }
        setIsLoading(false);
      }

      previousUserIdRef.current = newUserId;
    });

    return () => unsubscribe();
  }, []);

  // Save favorites to Firebase or localStorage
  const saveFavorites = useCallback(async (newIds: string[]) => {
    if (currentUserId) {
      console.log(`[Favorites] Saving favorites for user: ${currentUserId}`);
      try {
        const favoritesRef = doc(db, 'favorites', currentUserId);
        await setDoc(favoritesRef, { 
          productIds: newIds, 
          updatedAt: new Date().toISOString() 
        });
        console.log(`[Favorites] Favorites saved to Firebase for user: ${currentUserId}`);
      } catch (error) {
        console.error('[Favorites] Error saving favorites to Firebase:', error);
      }
    } else {
      console.log('[Favorites] Saving guest favorites to localStorage');
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newIds));
    }
  }, [currentUserId]);

  // Derive favorites products from IDs
  const favorites = favoriteIds
    .map((id) => mockProducts.find((p) => p.id === id))
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
    setFavoriteIds((prev) => {
      const newIds = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      saveFavorites(newIds);
      return newIds;
    });
  }, [saveFavorites]);

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
