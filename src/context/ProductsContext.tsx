import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, Category } from '../types/product';
import { mockProducts } from '../data/mockProducts';

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (category: Category) => Product[];
  getNewArrivals: () => Product[];
  getTrending: () => Product[];
  getTrendingWithRank: () => (Product & { trendingRank: number })[];
  getSaleProducts: () => Product[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to products collection with real-time updates
  useEffect(() => {
    console.log('[ProductsContext] Setting up Firestore listener...');
    
    const productsRef = collection(db, 'products');
    
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        if (snapshot.empty) {
          console.log('[ProductsContext] No products in Firestore, using mock data');
          setProducts(mockProducts);
        } else {
          const firestoreProducts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
          console.log('[ProductsContext] Loaded', firestoreProducts.length, 'products from Firestore');
          // Debug: Log products without imageUrl
          const productsWithoutImage = firestoreProducts.filter(p => !p.imageUrl);
          if (productsWithoutImage.length > 0) {
            console.warn('[ProductsContext] Products missing imageUrl:', productsWithoutImage.map(p => ({ id: p.id, name: p.name, keys: Object.keys(p) })));
          }
          setProducts(firestoreProducts);
        }
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[ProductsContext] Error fetching products:', err);
        setError('Failed to load products');
        // Fallback to mock data on error
        setProducts(mockProducts);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('[ProductsContext] Cleaning up Firestore listener');
      unsubscribe();
    };
  }, []);

  // Get a single product by ID
  const getProductById = (id: string): Product | undefined => {
    return products.find((p) => p.id === id);
  };

  // Get products by category
  const getProductsByCategory = (category: Category): Product[] => {
    return products.filter((p) => p.category === category);
  };

  // Get new arrivals (products marked as isNewArrival, max 8)
  const getNewArrivals = (): Product[] => {
    return products.filter((p) => p.isNewArrival).slice(0, 8);
  };

  // Get trending products (top 3 by review count)
  const getTrending = (): Product[] => {
    const sorted = [...products].sort((a, b) => {
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return b.rating - a.rating;
    });
    return sorted.slice(0, 3);
  };

  // Get trending products with rank
  const getTrendingWithRank = (): (Product & { trendingRank: number })[] => {
    const trending = getTrending();
    return trending.map((product, index) => ({
      ...product,
      trendingRank: index + 1,
    }));
  };

  // Get sale products
  const getSaleProducts = (): Product[] => {
    return products.filter((p) => p.onSale);
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        isLoading,
        error,
        getProductById,
        getProductsByCategory,
        getNewArrivals,
        getTrending,
        getTrendingWithRank,
        getSaleProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
