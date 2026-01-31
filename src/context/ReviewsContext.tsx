import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Review } from '../types/product';
import { mockProducts } from '../data/mockProducts';

interface FirebaseReview extends Omit<Review, 'id'> {
  productId: string;
  userId?: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

interface ReviewsState {
  [productId: string]: Review[];
}

interface ReviewsContextType {
  getReviewsForProduct: (productId: string) => Review[];
  addReview: (productId: string, review: Omit<Review, 'id'>, userId?: string) => Promise<void>;
  getAverageRating: (productId: string) => number;
  getReviewCount: (productId: string) => number;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider = ({ children }: { children: ReactNode }) => {
  const [reviews, setReviews] = useState<ReviewsState>(() => {
    // Initialize with mock product reviews
    const initialReviews: ReviewsState = {};
    mockProducts.forEach((product) => {
      initialReviews[product.id] = product.reviews || [];
    });
    return initialReviews;
  });
  const [firebaseReviews, setFirebaseReviews] = useState<ReviewsState>({});

  // Listen to Firebase reviews
  useEffect(() => {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsByProduct: ReviewsState = {};
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as FirebaseReview;
        const review: Review = {
          id: doc.id,
          userName: data.userName,
          rating: data.rating,
          comment: data.comment,
          date: data.date,
        };
        
        if (!reviewsByProduct[data.productId]) {
          reviewsByProduct[data.productId] = [];
        }
        reviewsByProduct[data.productId].push(review);
      });
      
      setFirebaseReviews(reviewsByProduct);
    }, (error) => {
      console.error('Error fetching reviews from Firebase:', error);
    });

    return () => unsubscribe();
  }, []);

  // Combine mock reviews with Firebase reviews
  const getAllReviews = useCallback((productId: string): Review[] => {
    const mockReviews = reviews[productId] || [];
    const fbReviews = firebaseReviews[productId] || [];
    
    // Get IDs of firebase reviews to avoid duplicates
    const fbReviewIds = new Set(fbReviews.map(r => r.id));
    
    // Combine: Firebase reviews first (they're newer), then mock reviews
    const combined = [
      ...fbReviews,
      ...mockReviews.filter(r => !fbReviewIds.has(r.id)),
    ];
    
    // Sort by date, newest first
    return combined.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [reviews, firebaseReviews]);

  const getReviewsForProduct = useCallback(
    (productId: string): Review[] => {
      return getAllReviews(productId);
    },
    [getAllReviews]
  );

  const addReview = useCallback(async (
    productId: string, 
    reviewData: Omit<Review, 'id'>,
    userId?: string
  ) => {
    try {
      // Add to Firebase
      const reviewDoc: FirebaseReview = {
        productId,
        userName: reviewData.userName,
        rating: reviewData.rating,
        comment: reviewData.comment,
        date: reviewData.date,
        userId,
        createdAt: serverTimestamp() as unknown as { seconds: number; nanoseconds: number },
      };
      
      await addDoc(collection(db, 'reviews'), reviewDoc);
    } catch (error) {
      console.error('Error adding review to Firebase:', error);
      
      // Fallback: add to local state if Firebase fails
      const newReview: Review = {
        ...reviewData,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      setReviews((prev) => {
        const existingReviews = prev[productId] || [];
        return {
          ...prev,
          [productId]: [newReview, ...existingReviews],
        };
      });
    }
  }, []);

  const getAverageRating = useCallback(
    (productId: string): number => {
      const productReviews = getAllReviews(productId);
      if (productReviews.length === 0) return 0;

      const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
      return Math.round((sum / productReviews.length) * 10) / 10;
    },
    [getAllReviews]
  );

  const getReviewCount = useCallback(
    (productId: string): number => {
      return getAllReviews(productId).length;
    },
    [getAllReviews]
  );

  return (
    <ReviewsContext.Provider
      value={{
        getReviewsForProduct,
        addReview,
        getAverageRating,
        getReviewCount,
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewsProvider');
  }
  return context;
};
