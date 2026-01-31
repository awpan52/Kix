import { Link } from 'react-router-dom';
import { useFavorites } from '../context';
import { ProductCard } from '../components/product';

const Favorites = () => {
  const { favorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-page mx-auto px-6 lg:px-12 py-12">
          <h1 className="font-cabinet font-bold text-3xl text-text-dark mb-8">
            My Favorites
          </h1>
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h2 className="font-cabinet font-bold text-xl text-text-dark mb-2">
              You haven't liked any products yet
            </h2>
            <p className="font-cabinet text-gray-500 mb-8">
              Browse our collection and tap the heart icon to save your favorites.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/mens"
                className="inline-block bg-card-bg text-white font-cabinet font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Shop Men's
              </Link>
              <Link
                to="/womens"
                className="inline-block bg-white text-text-dark font-cabinet font-bold px-8 py-3 rounded-lg border-2 border-card-bg hover:bg-gray-50 transition-colors"
              >
                Shop Women's
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-page mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-cabinet font-bold text-3xl text-text-dark">
            My Favorites ({favorites.length} {favorites.length === 1 ? 'item' : 'items'})
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Favorites;
