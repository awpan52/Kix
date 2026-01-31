import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, Category } from '../types/product';
import { mockProducts } from '../data/mockProducts';

const PRODUCTS_COLLECTION = 'products';

/**
 * Get all products from Firestore
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);
    
    if (snapshot.empty) {
      console.log('[ProductService] No products in Firestore, returning mock data');
      return mockProducts;
    }
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error('[ProductService] Error fetching products:', error);
    // Fallback to mock data if Firestore fails
    return mockProducts;
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    const productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() } as Product;
    }
    
    // Fallback to mock data
    const mockProduct = mockProducts.find((p) => p.id === id);
    return mockProduct || null;
  } catch (error) {
    console.error('[ProductService] Error fetching product:', error);
    // Fallback to mock data
    const mockProduct = mockProducts.find((p) => p.id === id);
    return mockProduct || null;
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (category: Category): Promise<Product[]> => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('category', '==', category));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Fallback to mock data
      return mockProducts.filter((p) => p.category === category);
    }
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error('[ProductService] Error fetching products by category:', error);
    return mockProducts.filter((p) => p.category === category);
  }
};

/**
 * Get new arrivals (top 8 newest products)
 */
export const getNewArrivals = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('isNewArrival', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return mockProducts.filter((p) => p.isNewArrival).slice(0, 8);
    }
    
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
    
    return products.slice(0, 8);
  } catch (error) {
    console.error('[ProductService] Error fetching new arrivals:', error);
    return mockProducts.filter((p) => p.isNewArrival).slice(0, 8);
  }
};

/**
 * Get trending products (top 3 by review count)
 */
export const getTrending = async (): Promise<Product[]> => {
  try {
    const products = await getAllProducts();
    
    // Sort by reviewCount (descending), then rating as tiebreaker
    const sorted = [...products].sort((a, b) => {
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return b.rating - a.rating;
    });
    
    return sorted.slice(0, 3);
  } catch (error) {
    console.error('[ProductService] Error fetching trending:', error);
    const sorted = [...mockProducts].sort((a, b) => {
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return b.rating - a.rating;
    });
    return sorted.slice(0, 3);
  }
};

/**
 * Get trending products with rank
 */
export const getTrendingWithRank = async (): Promise<(Product & { trendingRank: number })[]> => {
  const trending = await getTrending();
  return trending.map((product, index) => ({
    ...product,
    trendingRank: index + 1,
  }));
};

/**
 * Add a new product (Admin only)
 */
export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const docRef = await addDoc(productsRef, productData);
    console.log('[ProductService] Product added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[ProductService] Error adding product:', error);
    throw error;
  }
};

/**
 * Update a product (Admin only)
 */
export const updateProduct = async (id: string, productData: Partial<Product>): Promise<void> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    // Filter out null values - they'll be handled by removeProductFields
    const cleanData = Object.fromEntries(
      Object.entries(productData).filter(([, v]) => v !== null)
    );
    await updateDoc(productRef, cleanData);
    console.log('[ProductService] Product updated:', id);
  } catch (error) {
    console.error('[ProductService] Error updating product:', error);
    throw error;
  }
};

/**
 * Remove specific fields from a product (Admin only)
 */
export const removeProductFields = async (id: string, fields: string[]): Promise<void> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    const updates: Record<string, ReturnType<typeof deleteField>> = {};
    fields.forEach((field) => {
      updates[field] = deleteField();
    });
    await updateDoc(productRef, updates);
    console.log('[ProductService] Removed fields from product:', id, fields);
  } catch (error) {
    console.error('[ProductService] Error removing fields:', error);
    throw error;
  }
};

/**
 * Delete a product (Admin only)
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(productRef);
    console.log('[ProductService] Product deleted:', id);
  } catch (error) {
    console.error('[ProductService] Error deleting product:', error);
    throw error;
  }
};

/**
 * Import mock products to Firestore (Admin only, one-time operation)
 */
export const importMockProducts = async (): Promise<number> => {
  try {
    const batch = writeBatch(db);
    let count = 0;
    
    for (const product of mockProducts) {
      const { id, ...productData } = product;
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      batch.set(productRef, productData);
      count++;
    }
    
    await batch.commit();
    console.log('[ProductService] Imported', count, 'products to Firestore');
    return count;
  } catch (error) {
    console.error('[ProductService] Error importing products:', error);
    throw error;
  }
};

/**
 * Check if products exist in Firestore
 */
export const hasProductsInFirestore = async (): Promise<boolean> => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);
    return !snapshot.empty;
  } catch (error) {
    console.error('[ProductService] Error checking products:', error);
    return false;
  }
};
