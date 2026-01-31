import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';
import { useFavorites, useReviews } from '../../context';
import { StarRating } from '../common';
import heartIcon from '../../assets/icons/heart.svg';
import heartedIcon from '../../assets/icons/hearted.svg';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getAverageRating, getReviewCount } = useReviews();
  const navigate = useNavigate();
  
  const favorite = isFavorite(product.id);
  const averageRating = getAverageRating(product.id);
  const reviewCount = getReviewCount(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to product page for size selection
    navigate(`/product/${product.id}`);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <div
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container - Clickable to product detail */}
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative bg-[#E8E8E8] rounded-lg overflow-hidden aspect-square">
          {/* Product Image */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-6"
          />

          {/* Sale/Discount Badge */}
          {product.onSale ? (
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <span className="bg-discount-red text-white text-xs font-cabinet font-bold px-2.5 py-1 rounded">
                SALE
              </span>
              {product.discountPercent && (
                <span className="bg-text-dark text-white text-xs font-cabinet font-bold px-2.5 py-1 rounded">
                  -{product.discountPercent}%
                </span>
              )}
            </div>
          ) : product.discountPercent ? (
            <span className="absolute top-3 left-3 bg-discount-red text-white text-xs font-medium px-3 py-1.5 rounded">
              -{product.discountPercent}%
            </span>
          ) : null}

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 transition-transform duration-200 hover:scale-110"
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <img
              src={favorite ? heartedIcon : heartIcon}
              alt={favorite ? 'Favorited' : 'Add to favorites'}
              className="w-6 h-6"
            />
          </button>

          {/* Add To Cart Button - Shows on hover */}
          <div
            className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <button
              onClick={handleAddToCart}
              className="w-full bg-card-bg text-white font-cabinet font-medium text-base py-3 hover:bg-gray-800 transition-colors duration-200"
            >
              Add To Cart
            </button>
          </div>
        </div>
      </Link>

      {/* Product Info - Clickable to product detail */}
      <Link to={`/product/${product.id}`} className="block mt-4">
        {/* Name */}
        <h3 className="font-space font-medium text-base text-black leading-6 hover:text-gray-700 transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-3 mt-2">
          <span className={`font-space font-medium text-base ${product.originalPrice ? 'text-discount-red' : 'text-black'}`}>
            ${product.price}
          </span>
          {product.originalPrice && (
            <span className="font-space font-medium text-base text-gray-400 line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={averageRating} size="sm" />
          <span className="font-space text-sm text-gray-500">
            ({reviewCount})
          </span>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
