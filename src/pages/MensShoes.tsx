import { useProducts } from '../context';
import { ProductGrid } from '../components/common';

const MensShoes = () => {
  const { getProductsByCategory, isLoading } = useProducts();
  const products = getProductsByCategory('mens');

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-page mx-auto px-6 lg:px-12 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-cabinet font-bold text-3xl md:text-4xl text-text-dark mb-2">
            Men's Shoes
          </h1>
          <p className="font-cabinet font-normal text-base text-gray-500">
            {isLoading ? 'Loading...' : `${products.length} products available`}
          </p>
        </div>

        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-2 text-sm font-cabinet">
            <li>
              <a href="/" className="text-gray-500 hover:text-text-dark transition-colors">
                Home
              </a>
            </li>
            <li>
              <span className="text-gray-400 mx-2">/</span>
            </li>
            <li>
              <span className="text-text-dark font-medium">Men's Shoes</span>
            </li>
          </ol>
        </nav>

        {/* Product Grid */}
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
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
};

export default MensShoes;
