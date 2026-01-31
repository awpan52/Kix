import { getProductsByCategory } from '../data/mockProducts';
import { ProductGrid } from '../components/common';

const WomensShoes = () => {
  const products = getProductsByCategory('womens');

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-page mx-auto px-6 lg:px-12 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-cabinet font-bold text-3xl md:text-4xl text-text-dark mb-2">
            Women's Shoes
          </h1>
          <p className="font-cabinet font-normal text-base text-gray-500">
            {products.length} products available
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
              <span className="text-text-dark font-medium">Women's Shoes</span>
            </li>
          </ol>
        </nav>

        {/* Product Grid */}
        <ProductGrid products={products} />
      </div>
    </div>
  );
};

export default WomensShoes;
