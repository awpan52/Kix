import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../context';
import { ProductGrid } from '../components/common';
import { ProductCard } from '../components/product';

// Hero images
import bannerShoe from '../assets/images/hero/banner-shoe.png';

// Tab icons
import newArrivalsIcon from '../assets/icons/new-arrivals.svg';
import whatsTrendingIcon from '../assets/icons/whats-trending.svg';

// Service icons
import deliveryIcon from '../assets/icons/free-and-fast-delivery.svg';
import customerServiceIcon from '../assets/icons/customer-service.svg';
import moneyBackIcon from '../assets/icons/money-back-guarantee.svg';

type ActiveTab = 'new-arrivals' | 'trending';

const Home = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { getNewArrivals, getTrendingWithRank, isLoading } = useProducts();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    tabParam === 'trending' ? 'trending' : 'new-arrivals'
  );
  
  // Update tab when URL parameter changes
  useEffect(() => {
    if (tabParam === 'trending') {
      setActiveTab('trending');
    }
  }, [tabParam]);
  
  const newArrivals = getNewArrivals();
  const trendingProducts = getTrendingWithRank();

  return (
    <div className="bg-background">
      {/* Hero/Banner Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-page mx-auto px-8 lg:px-16 xl:px-24">
          {/* Increased height significantly */}
          <div className="relative h-[500px] sm:h-[550px] md:h-[600px] lg:h-[650px] xl:h-[700px] flex items-center justify-center">
            
            {/* Background Text - SHOP ALL - Reduced sizes for proper scale */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <h1 
                className="font-teko font-bold uppercase leading-none whitespace-nowrap text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] xl:text-[200px]"
                style={{
                  color: '#D9D9D9',
                }}
              >
                SHOP ALL
              </h1>
            </div>

            {/* ADJUSTABLE - Top Left - More padding from edges */}
            <div className="absolute top-12 sm:top-16 md:top-20 lg:top-24 left-4 sm:left-8 md:left-12 lg:left-16 z-20">
              <span className="font-teko font-normal text-sm sm:text-base md:text-lg lg:text-xl tracking-[0.15em] text-text-dark uppercase leading-none">
                ADJUSTABLE
              </span>
            </div>

            {/* Hero Shoe Image - Centered with reduced size */}
            <div className="relative z-10 w-full flex items-center justify-center">
              <img
                src={bannerShoe}
                alt="Featured Shoe"
                className="w-[280px] sm:w-[350px] md:w-[450px] lg:w-[550px] xl:w-[650px] h-auto object-contain drop-shadow-2xl"
                style={{
                  transform: 'rotate(-12deg)',
                }}
              />
            </div>

            {/* SOFT PAD - Bottom Right - More padding from edges */}
            <div className="absolute bottom-12 sm:bottom-16 md:bottom-20 lg:bottom-24 right-4 sm:right-8 md:right-12 lg:right-16 z-20">
              <span className="font-teko font-normal text-sm sm:text-base md:text-lg lg:text-xl tracking-[0.15em] text-text-dark uppercase leading-none">
                SOFT PAD
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Tab Buttons */}
      <section className="max-w-page mx-auto px-6 lg:px-12 pt-8">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('new-arrivals')}
            className={`transition-all duration-300 ${
              activeTab === 'new-arrivals' ? 'opacity-100' : 'opacity-60 hover:opacity-80'
            }`}
          >
            <img src={newArrivalsIcon} alt="New Arrivals" className="h-14 lg:h-16" />
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`transition-all duration-300 ${
              activeTab === 'trending' ? 'opacity-100' : 'opacity-60 hover:opacity-80'
            }`}
          >
            <img src={whatsTrendingIcon} alt="What's Trending" className="h-14 lg:h-16" />
          </button>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-page mx-auto px-6 lg:px-12 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <svg className="animate-spin w-6 h-6 text-text-dark" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="font-cabinet text-text-dark">Loading products...</span>
            </div>
          </div>
        ) : activeTab === 'new-arrivals' ? (
          <ProductGrid products={newArrivals} />
        ) : (
          /* Trending Products - 3 columns with ranking badges */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                trendingRank={product.trendingRank}
              />
            ))}
          </div>
        )}
      </section>

      {/* Services Section */}
      <section className="max-w-page mx-auto px-6 lg:px-12 py-16 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Free and Fast Delivery */}
          <div className="flex flex-col items-center text-center">
            <img src={deliveryIcon} alt="Free Delivery" className="w-20 h-20 mb-6" />
            <h3 className="font-cabinet font-bold text-lg text-text-dark uppercase tracking-wide mb-2">
              Free and Fast Delivery
            </h3>
            <p className="font-cabinet font-normal text-sm text-gray-500">
              Free delivery for all orders over $140
            </p>
          </div>

          {/* 24/7 Customer Service */}
          <div className="flex flex-col items-center text-center">
            <img src={customerServiceIcon} alt="Customer Service" className="w-20 h-20 mb-6" />
            <h3 className="font-cabinet font-bold text-lg text-text-dark uppercase tracking-wide mb-2">
              24/7 Customer Service
            </h3>
            <p className="font-cabinet font-normal text-sm text-gray-500">
              Friendly 24/7 customer support
            </p>
          </div>

          {/* Money Back Guarantee */}
          <div className="flex flex-col items-center text-center">
            <img src={moneyBackIcon} alt="Money Back" className="w-20 h-20 mb-6" />
            <h3 className="font-cabinet font-bold text-lg text-text-dark uppercase tracking-wide mb-2">
              Money Back Guarantee
            </h3>
            <p className="font-cabinet font-normal text-sm text-gray-500">
              We return money within 30 days
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
