export type Category = 'mens' | 'womens' | 'kids';

export interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  onSale?: boolean;
  category: Category;
  imageUrl: string;
  images: string[]; // Multiple images for gallery
  rating: number;
  reviewCount: number;
  reviews: Review[];
  isNewArrival: boolean;
  isTrending: boolean;
  description: string;
  features: string[];
  sizes: number[];
}
