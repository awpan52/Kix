import { Product, Review } from '../types/product';

// Import local images
import airMax90 from '../assets/images/shoes/air-max-90-flyease.png';
import airZoomPegasus from '../assets/images/shoes/air-zoom-pegasus-37.png';
import cosmicUnity from '../assets/images/shoes/cosmic-unity.png';
import maroon from '../assets/images/shoes/maroon.png';

// Standard shoe sizes
const standardSizes = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12];
const kidsSizes = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7];

// Mock reviews generator
const generateReviews = (count: number, baseRating: number): Review[] => {
  const reviewTemplates = [
    { userName: 'Alex M.', comment: 'Super comfortable right out of the box. The cushioning is amazing and they look even better in person!' },
    { userName: 'Sarah K.', comment: 'Great quality shoes. True to size and very stylish. I get compliments every time I wear them.' },
    { userName: 'Jordan T.', comment: 'Perfect for daily wear. The support is excellent and they hold up well after months of use.' },
    { userName: 'Casey R.', comment: 'Love the design and color. They fit perfectly and are incredibly lightweight.' },
    { userName: 'Morgan L.', comment: 'Best purchase I\'ve made this year. Worth every penny for the comfort and style.' },
    { userName: 'Taylor W.', comment: 'These exceeded my expectations. Great for both casual wear and light workouts.' },
    { userName: 'Jamie P.', comment: 'Fantastic shoes! The materials feel premium and the fit is spot on.' },
  ];

  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    const template = reviewTemplates[i % reviewTemplates.length];
    const rating = Math.max(3, Math.min(5, baseRating + (Math.random() > 0.5 ? 0 : -1)));
    reviews.push({
      id: `review-${i + 1}`,
      userName: template.userName,
      rating: Math.round(rating),
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      comment: template.comment,
    });
  }
  return reviews;
};

export const mockProducts: Product[] = [
  // New Arrivals - Row 1
  {
    id: '1',
    name: 'Air Max 90 FlyEase',
    brand: 'Nike',
    price: 160,
    category: 'mens',
    imageUrl: airMax90,
    images: [airMax90, airMax90, airMax90],
    rating: 5,
    reviewCount: 67,
    reviews: generateReviews(5, 5),
    isNewArrival: true,
    isTrending: false,
    description: 'The Nike Air Max 90 FlyEase makes a icons easy entry system that allows on-and-off convenience. Its padded collar and Max Air cushioning deliver comfort all day.',
    features: [
      'FlyEase entry system for easy on/off',
      'Max Air unit in heel for cushioning',
      'Padded collar for comfort',
      'Rubber outsole for durability',
      'Leather and synthetic upper'
    ],
    sizes: standardSizes,
  },
  {
    id: '2',
    name: 'Cosmic Unity',
    brand: 'Nike',
    price: 80,
    originalPrice: 100,
    discountPercent: 20,
    onSale: true,
    category: 'mens',
    imageUrl: cosmicUnity,
    images: [cosmicUnity, cosmicUnity, cosmicUnity],
    rating: 5,
    reviewCount: 94,
    reviews: generateReviews(5, 5),
    isNewArrival: true,
    isTrending: false,
    description: 'The Nike Cosmic Unity is designed with sustainability in mind, using at least 25% recycled materials by weight. It delivers responsive cushioning for all-day comfort.',
    features: [
      'Made with at least 25% recycled materials',
      'React foam midsole for responsiveness',
      'Flyknit upper for breathability',
      'Rubber outsole with traction pattern',
      'Sustainable design philosophy'
    ],
    sizes: standardSizes,
  },
  {
    id: '3',
    name: 'Air Zoom Maroon',
    brand: 'Nike',
    price: 125,
    originalPrice: 165,
    discountPercent: 24,
    onSale: true,
    category: 'womens',
    imageUrl: maroon,
    images: [maroon, maroon, maroon],
    rating: 4,
    reviewCount: 43,
    reviews: generateReviews(4, 4),
    isNewArrival: true,
    isTrending: false,
    description: 'Premium running shoe with responsive Zoom Air cushioning. The breathable mesh upper keeps you cool while the sleek maroon colorway turns heads.',
    features: [
      'Zoom Air unit for responsive cushioning',
      'Breathable mesh upper',
      'Padded tongue and collar',
      'Durable rubber outsole',
      'Reflective details for visibility'
    ],
    sizes: standardSizes,
  },
  {
    id: '4',
    name: 'Air Zoom Pegasus 37',
    brand: 'Nike',
    price: 960,
    originalPrice: 1160,
    discountPercent: 35,
    onSale: true,
    category: 'mens',
    imageUrl: airZoomPegasus,
    images: [airZoomPegasus, airZoomPegasus, airZoomPegasus],
    rating: 4,
    reviewCount: 56,
    reviews: generateReviews(5, 4),
    isNewArrival: true,
    isTrending: true,
    description: 'The Nike Air Zoom Pegasus 37 continues to put a spring in your step with the same responsive foam as its predecessor. An all-new forefoot cushioning system creates a more responsive ride.',
    features: [
      'React foam midsole',
      'Zoom Air unit in forefoot',
      'Translucent mesh upper',
      'Midfoot webbing for support',
      'Waffle-inspired outsole pattern'
    ],
    sizes: standardSizes,
  },
  // New Arrivals - Row 2
  {
    id: '5',
    name: 'Air Max 90 Essential',
    brand: 'Nike',
    price: 165,
    category: 'womens',
    imageUrl: airMax90,
    images: [airMax90, airMax90, airMax90],
    rating: 4,
    reviewCount: 78,
    reviews: generateReviews(5, 4),
    isNewArrival: true,
    isTrending: false,
    description: 'Nothing beats the iconic look and feel of the Air Max 90. This essential version brings back the OG design with premium materials and classic Air cushioning.',
    features: [
      'Classic Air Max 90 design',
      'Visible Max Air unit',
      'Leather and mesh upper',
      'Rubber Waffle outsole',
      'Foam midsole'
    ],
    sizes: standardSizes,
  },
  {
    id: '6',
    name: 'Cosmic Unity 2',
    brand: 'Nike',
    price: 960,
    originalPrice: 1160,
    discountPercent: 35,
    onSale: true,
    category: 'mens',
    imageUrl: cosmicUnity,
    images: [cosmicUnity, cosmicUnity, cosmicUnity],
    rating: 5,
    reviewCount: 51,
    reviews: generateReviews(5, 5),
    isNewArrival: true,
    isTrending: true,
    description: 'The second generation of the Cosmic Unity takes sustainable performance to the next level with improved cushioning and an updated recycled materials composition.',
    features: [
      'Upgraded recycled materials',
      'Enhanced React foam cushioning',
      'Improved Flyknit construction',
      'Better traction pattern',
      'Lighter weight design'
    ],
    sizes: standardSizes,
  },
  {
    id: '7',
    name: 'Junior Air Max',
    brand: 'Nike',
    price: 165,
    category: 'kids',
    imageUrl: maroon,
    images: [maroon, maroon, maroon],
    rating: 4,
    reviewCount: 29,
    reviews: generateReviews(4, 4),
    isNewArrival: true,
    isTrending: false,
    description: 'Built for young athletes, the Junior Air Max delivers the same iconic style and comfort in kid-friendly sizes. Durable construction stands up to active play.',
    features: [
      'Kid-sized Air Max cushioning',
      'Durable synthetic upper',
      'Easy hook-and-loop closure',
      'Flexible rubber outsole',
      'Lightweight design'
    ],
    sizes: kidsSizes,
  },
  {
    id: '8',
    name: 'Pegasus Trail',
    brand: 'Nike',
    price: 960,
    originalPrice: 1160,
    discountPercent: 35,
    onSale: true,
    category: 'womens',
    imageUrl: airZoomPegasus,
    images: [airZoomPegasus, airZoomPegasus, airZoomPegasus],
    rating: 4,
    reviewCount: 38,
    reviews: generateReviews(5, 4),
    isNewArrival: true,
    isTrending: true,
    description: 'Trail-ready version of the beloved Pegasus. Features aggressive traction and protective elements while maintaining the responsive ride you love.',
    features: [
      'Trail-specific outsole pattern',
      'React foam with Zoom Air',
      'Rock plate protection',
      'Reinforced toe cap',
      'Water-resistant upper'
    ],
    sizes: standardSizes,
  },
  // What's Trending - Row 1
  {
    id: '9',
    name: 'Air Max 90 Retro',
    brand: 'Nike',
    price: 160,
    category: 'mens',
    imageUrl: airMax90,
    images: [airMax90, airMax90, airMax90],
    rating: 5,
    reviewCount: 127,
    reviews: generateReviews(5, 5),
    isNewArrival: false,
    isTrending: true,
    description: 'The retro edition brings back the original 1990 colorway with modern comfort updates. A must-have for sneaker collectors and style enthusiasts.',
    features: [
      'Original 1990 colorway',
      'Premium leather upper',
      'Visible Air unit',
      'Classic rubber outsole',
      'OG box packaging'
    ],
    sizes: standardSizes,
  },
  {
    id: '10',
    name: 'Cosmic Unity Pro',
    brand: 'Nike',
    price: 75,
    originalPrice: 100,
    discountPercent: 25,
    onSale: true,
    category: 'mens',
    imageUrl: cosmicUnity,
    images: [cosmicUnity, cosmicUnity, cosmicUnity],
    rating: 5,
    reviewCount: 89,
    reviews: generateReviews(5, 5),
    isNewArrival: false,
    isTrending: true,
    description: 'Professional-grade performance meets sustainable design. The Cosmic Unity Pro features enhanced cushioning for athletes who demand the best.',
    features: [
      'Pro-level React cushioning',
      'Competition-ready design',
      'Maximum recycled content',
      'Enhanced lockdown fit',
      'Premium Flyknit upper'
    ],
    sizes: standardSizes,
  },
  {
    id: '11',
    name: 'Air Zoom Elite',
    brand: 'Nike',
    price: 165,
    category: 'womens',
    imageUrl: maroon,
    images: [maroon, maroon, maroon],
    rating: 4,
    reviewCount: 34,
    reviews: generateReviews(4, 4),
    isNewArrival: false,
    isTrending: true,
    description: 'Elite performance for serious runners. The Air Zoom Elite combines lightweight construction with maximum responsiveness for your best runs.',
    features: [
      'Full-length Zoom Air',
      'Lightweight mesh upper',
      'Speed-focused design',
      'Racing flat outsole',
      'Minimal weight construction'
    ],
    sizes: standardSizes,
  },
  {
    id: '12',
    name: 'Pegasus Shield',
    brand: 'Nike',
    price: 960,
    originalPrice: 1160,
    discountPercent: 35,
    onSale: true,
    category: 'mens',
    imageUrl: airZoomPegasus,
    images: [airZoomPegasus, airZoomPegasus, airZoomPegasus],
    rating: 4,
    reviewCount: 47,
    reviews: generateReviews(5, 4),
    isNewArrival: false,
    isTrending: true,
    description: 'Weather-ready running shoe with water-repellent upper and enhanced traction. Run through any conditions with confidence.',
    features: [
      'Water-repellent upper',
      'Reflective details',
      'All-weather traction',
      'React foam midsole',
      'Sealed seams'
    ],
    sizes: standardSizes,
  },
  // What's Trending - Row 2
  {
    id: '13',
    name: 'Air Max 90 Premium',
    brand: 'Nike',
    price: 165,
    category: 'womens',
    imageUrl: airMax90,
    images: [airMax90, airMax90, airMax90],
    rating: 4,
    reviewCount: 63,
    reviews: generateReviews(5, 4),
    isNewArrival: false,
    isTrending: true,
    description: 'Premium materials elevate the classic Air Max 90. Featuring full-grain leather and suede accents for a luxurious take on the icon.',
    features: [
      'Full-grain leather upper',
      'Suede overlay accents',
      'Premium Air cushioning',
      'Gold-tone hardware',
      'Luxury packaging'
    ],
    sizes: standardSizes,
  },
  {
    id: '14',
    name: 'Cosmic Unity Kids',
    brand: 'Nike',
    price: 960,
    originalPrice: 1160,
    discountPercent: 35,
    onSale: true,
    category: 'kids',
    imageUrl: cosmicUnity,
    images: [cosmicUnity, cosmicUnity, cosmicUnity],
    rating: 5,
    reviewCount: 22,
    reviews: generateReviews(5, 5),
    isNewArrival: false,
    isTrending: true,
    description: 'Sustainable performance for the next generation. The kids version features the same eco-friendly design in sizes perfect for young feet.',
    features: [
      'Kid-friendly recycled materials',
      'Easy on/off design',
      'Durable construction',
      'Comfortable cushioning',
      'Fun colorway options'
    ],
    sizes: kidsSizes,
  },
  {
    id: '15',
    name: 'Air Zoom Junior',
    brand: 'Nike',
    price: 165,
    category: 'kids',
    imageUrl: maroon,
    images: [maroon, maroon, maroon],
    rating: 4,
    reviewCount: 31,
    reviews: generateReviews(4, 4),
    isNewArrival: false,
    isTrending: true,
    description: 'Responsive Zoom Air cushioning sized for young athletes. Built to keep up with active kids during sports and play.',
    features: [
      'Kid-sized Zoom Air unit',
      'Breathable mesh upper',
      'Secure fit strap',
      'Durable rubber outsole',
      'Easy to clean materials'
    ],
    sizes: kidsSizes,
  },
  {
    id: '16',
    name: 'Pegasus Junior',
    brand: 'Nike',
    price: 960,
    originalPrice: 1160,
    discountPercent: 35,
    onSale: true,
    category: 'kids',
    imageUrl: airZoomPegasus,
    images: [airZoomPegasus, airZoomPegasus, airZoomPegasus],
    rating: 4,
    reviewCount: 18,
    reviews: generateReviews(5, 4),
    isNewArrival: false,
    isTrending: true,
    description: 'The legendary Pegasus comfort in kids sizes. Perfect for young runners developing their love for the sport.',
    features: [
      'Junior React foam midsole',
      'Breathable upper',
      'Secure lacing system',
      'Flexible outsole',
      'Lightweight design'
    ],
    sizes: kidsSizes,
  },
  // Additional products for category pages
  {
    id: '17',
    name: 'Air Max Plus',
    brand: 'Nike',
    price: 145,
    category: 'mens',
    imageUrl: airMax90,
    images: [airMax90, airMax90, airMax90],
    rating: 4,
    reviewCount: 52,
    reviews: generateReviews(4, 4),
    isNewArrival: false,
    isTrending: false,
    description: 'Bold design meets superior cushioning. The Air Max Plus features Tuned Air technology for a smooth, comfortable ride.',
    features: [
      'Tuned Air technology',
      'Gradient mesh upper',
      'TPU overlays',
      'Full-length Air unit',
      'Durable rubber outsole'
    ],
    sizes: standardSizes,
  },
  {
    id: '18',
    name: 'Cosmic Unity Women',
    brand: 'Nike',
    price: 185,
    category: 'womens',
    imageUrl: cosmicUnity,
    images: [cosmicUnity, cosmicUnity, cosmicUnity],
    rating: 5,
    reviewCount: 156,
    reviews: generateReviews(5, 5),
    isNewArrival: false,
    isTrending: false,
    description: 'Sustainable style designed for women. Features a narrower fit and feminine colorways while maintaining eco-friendly construction.',
    features: [
      'Womens-specific fit',
      'Sustainable materials',
      'React foam cushioning',
      'Breathable Flyknit',
      'Stylish colorway'
    ],
    sizes: standardSizes,
  },
  {
    id: '19',
    name: 'Air Max Kids',
    brand: 'Nike',
    price: 75,
    category: 'kids',
    imageUrl: maroon,
    images: [maroon, maroon, maroon],
    rating: 4,
    reviewCount: 24,
    reviews: generateReviews(4, 4),
    isNewArrival: false,
    isTrending: false,
    description: 'Classic Air Max style for the little ones. Easy to put on and built to last through all their adventures.',
    features: [
      'Hook-and-loop closure',
      'Air Max cushioning',
      'Durable synthetic upper',
      'Flexible sole',
      'Easy to clean'
    ],
    sizes: kidsSizes,
  },
  {
    id: '20',
    name: 'Pegasus Turbo',
    brand: 'Nike',
    price: 200,
    category: 'mens',
    imageUrl: airZoomPegasus,
    images: [airZoomPegasus, airZoomPegasus, airZoomPegasus],
    rating: 5,
    reviewCount: 203,
    reviews: generateReviews(5, 5),
    isNewArrival: false,
    isTrending: false,
    description: 'The fastest Pegasus ever made. ZoomX foam delivers incredible energy return for runners chasing PRs.',
    features: [
      'ZoomX foam midsole',
      'Ultra-lightweight design',
      'Speed-focused geometry',
      'Breathable Vaporweave upper',
      'Competition-ready'
    ],
    sizes: standardSizes,
  },
];

export const getNewArrivals = (): Product[] => {
  return mockProducts.filter(product => product.isNewArrival).slice(0, 8);
};

/**
 * Get trending products sorted by reviewCount (highest first)
 * Uses rating as tiebreaker when reviewCount is equal
 * Returns top 3 most-reviewed products
 */
export const getTrending = (): Product[] => {
  // Sort all products by reviewCount (descending), then by rating (descending) as tiebreaker
  const sorted = [...mockProducts].sort((a, b) => {
    // Primary sort: reviewCount (highest first)
    if (b.reviewCount !== a.reviewCount) {
      return b.reviewCount - a.reviewCount;
    }
    // Tiebreaker: rating (highest first)
    return b.rating - a.rating;
  });
  
  // Return top 3 most-reviewed products
  return sorted.slice(0, 3);
};

/**
 * Get trending products with their ranking position
 * Returns array of products with additional 'trendingRank' property
 */
export const getTrendingWithRank = (): (Product & { trendingRank: number })[] => {
  const trending = getTrending();
  return trending.map((product, index) => ({
    ...product,
    trendingRank: index + 1,
  }));
};

export const getProductsByCategory = (category: string): Product[] => {
  return mockProducts.filter(product => product.category === category);
};

export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find(product => product.id === id);
};
