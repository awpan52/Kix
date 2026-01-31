import { mockProducts } from '../data/mockProducts';
import { ProductGrid } from '../components/common';

const Sale = () => {
  // Filter products that are on sale
  const saleProducts = mockProducts.filter((product) => product.onSale === true);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-page mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-cabinet font-bold text-3xl text-text-dark">
              Sale
            </h1>
            <span className="bg-discount-red text-white font-cabinet font-bold text-sm px-3 py-1 rounded-full">
              {saleProducts.length} items
            </span>
          </div>
          <p className="font-cabinet text-gray-500 text-lg">
            Limited time offers - save big on your favorite styles!
          </p>
        </div>

        {/* Sale Banner */}
        <div className="bg-gradient-to-r from-discount-red to-red-600 rounded-xl p-6 lg:p-8 mb-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="font-cabinet font-bold text-2xl lg:text-3xl mb-2">
                Up to 35% OFF
              </h2>
              <p className="font-cabinet text-white/90">
                Don't miss out on these amazing deals. Limited stock available!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-cabinet text-white/80 text-sm">Use code:</span>
              <span className="bg-white text-discount-red font-cabinet font-bold px-4 py-2 rounded-lg">
                YR24
              </span>
              <span className="font-cabinet text-white/80 text-sm">for extra 20% off</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {saleProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h2 className="font-cabinet font-bold text-xl text-text-dark mb-2">
              No Sale Items
            </h2>
            <p className="font-cabinet text-gray-500 mb-6">
              Check back soon for new deals and discounts!
            </p>
          </div>
        ) : (
          <ProductGrid products={saleProducts} />
        )}
      </div>
    </div>
  );
};

export default Sale;
