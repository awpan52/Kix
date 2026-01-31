import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../data/mockProducts';
import { useCart, useFavorites, useReviews, useAuth } from '../context';
import { Toast, StarRating, ReviewForm } from '../components/common';
import heartIcon from '../assets/icons/heart.svg';
import heartedIcon from '../assets/icons/hearted.svg';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const product = id ? getProductById(id) : undefined;
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const reviewsRef = useRef<HTMLDivElement>(null);
  
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getReviewsForProduct, addReview, getAverageRating, getReviewCount } = useReviews();
  const { user, userProfile } = useAuth();
  
  const favorite = product ? isFavorite(product.id) : false;
  const reviews = product ? getReviewsForProduct(product.id) : [];
  const averageRating = product ? getAverageRating(product.id) : 0;
  const reviewCount = product ? getReviewCount(product.id) : 0;

  // Get user's display name for reviews
  const userName = userProfile?.displayName || user?.displayName || '';

  if (!product) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-page mx-auto px-6 lg:px-12 py-12">
          <div className="text-center py-20">
            <h1 className="font-cabinet font-bold text-2xl text-text-dark mb-4">
              Product Not Found
            </h1>
            <p className="font-cabinet text-gray-500 mb-8">
              The product you're looking for doesn't exist.
            </p>
            <Link
              to="/"
              className="inline-block bg-card-bg text-white font-cabinet font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (selectedSize) {
      addToCart(product, selectedSize);
      setToast({ message: `${product.name} (Size ${selectedSize}) added to cart!`, type: 'success' });
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product.id);
    setToast({
      message: favorite ? `${product.name} removed from favorites` : `${product.name} added to favorites!`,
      type: favorite ? 'info' : 'success',
    });
  };

  const handleSubmitReview = async (reviewData: { userName: string; rating: number; comment: string }) => {
    await addReview(
      product.id,
      {
        userName: reviewData.userName,
        rating: reviewData.rating,
        comment: reviewData.comment,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      },
      user?.uid
    );
    
    setShowReviewForm(false);
    setToast({ message: 'Thank you! Your review has been submitted.', type: 'success' });
    
    // Scroll to reviews section
    setTimeout(() => {
      reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-page mx-auto px-6 lg:px-12 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-2 text-sm font-cabinet">
            <li>
              <Link to="/" className="text-gray-500 hover:text-text-dark transition-colors">
                Home
              </Link>
            </li>
            <li>
              <span className="text-gray-400 mx-2">/</span>
            </li>
            <li>
              <Link 
                to={`/${product.category}`} 
                className="text-gray-500 hover:text-text-dark transition-colors capitalize"
              >
                {product.category === 'mens' ? "Men's" : product.category === 'womens' ? "Women's" : "Kids"} Shoes
              </Link>
            </li>
            <li>
              <span className="text-gray-400 mx-2">/</span>
            </li>
            <li>
              <span className="text-text-dark font-medium">{product.name}</span>
            </li>
          </ol>
        </nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left Side - Image Gallery */}
          <div className="flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex lg:flex-col gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden bg-[#E8E8E8] border-2 transition-all ${
                    selectedImage === index ? 'border-text-dark' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-contain p-2"
                  />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 bg-[#E8E8E8] rounded-xl overflow-hidden aspect-square flex items-center justify-center">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain p-8"
              />
            </div>
          </div>

          {/* Right Side - Product Info */}
          <div className="flex flex-col">
            {/* Brand */}
            <p className="font-cabinet text-gray-500 text-sm uppercase tracking-wider mb-2">
              {product.brand}
            </p>

            {/* Name */}
            <h1 className="font-space font-bold text-3xl lg:text-4xl text-text-dark mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <StarRating rating={averageRating} size="md" />
              <span className="font-cabinet text-gray-500">
                {averageRating.toFixed(1)} ({reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <span className={`font-space font-bold text-3xl ${product.originalPrice ? 'text-discount-red' : 'text-text-dark'}`}>
                ${product.price}
              </span>
              {product.originalPrice && (
                <>
                  <span className="font-space text-xl text-gray-400 line-through">
                    ${product.originalPrice}
                  </span>
                  <span className="bg-discount-red text-white text-sm font-cabinet font-bold px-2 py-1 rounded">
                    -{product.discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="font-cabinet text-gray-600 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cabinet font-bold text-text-dark">Select Size</h3>
                <button className="font-cabinet text-sm text-gray-500 hover:text-text-dark underline">
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 rounded-lg font-cabinet font-medium text-sm border-2 transition-all ${
                      selectedSize === size
                        ? 'border-text-dark bg-text-dark text-white'
                        : 'border-gray-200 bg-white text-text-dark hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="font-cabinet text-sm text-gray-500 mt-2">
                  Please select a size
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize}
                className={`flex-1 py-4 rounded-lg font-cabinet font-bold text-base transition-all ${
                  selectedSize
                    ? 'bg-card-bg text-white hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add to Cart
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center transition-all ${
                  favorite
                    ? 'border-discount-red bg-discount-red'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                <img
                  src={favorite ? heartedIcon : heartIcon}
                  alt={favorite ? 'Remove from favorites' : 'Add to favorites'}
                  className="w-6 h-6"
                  style={favorite ? { filter: 'brightness(0) invert(1)' } : undefined}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Features */}
          <div className="bg-white rounded-xl p-8">
            <h2 className="font-cabinet font-bold text-xl text-text-dark mb-6">
              Product Features
            </h2>
            <ul className="space-y-3">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-cabinet text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-xl p-8">
            <h2 className="font-cabinet font-bold text-xl text-text-dark mb-6">
              Shipping & Returns
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-text-dark mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <div>
                  <p className="font-cabinet font-medium text-text-dark">Free Shipping</p>
                  <p className="font-cabinet text-sm text-gray-500">On orders over $140</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-text-dark mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div>
                  <p className="font-cabinet font-medium text-text-dark">30-Day Returns</p>
                  <p className="font-cabinet text-sm text-gray-500">Hassle-free return policy</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-text-dark mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="font-cabinet font-medium text-text-dark">Secure Checkout</p>
                  <p className="font-cabinet text-sm text-gray-500">100% secure payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div ref={reviewsRef} className="bg-white rounded-xl p-8">
          {/* Reviews Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-cabinet font-bold text-xl text-text-dark mb-2">
                Customer Reviews
              </h2>
              <div className="flex items-center gap-3">
                <StarRating rating={averageRating} size="md" />
                <span className="font-cabinet text-text-dark">
                  {averageRating.toFixed(1)} out of 5
                </span>
                <span className="font-cabinet text-gray-500">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
            {!showReviewForm && (
              user ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-card-bg text-white font-cabinet font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Write a Review
                </button>
              ) : (
                <Link
                  to="/login"
                  state={{ from: `/product/${product.id}` }}
                  className="bg-card-bg text-white font-cabinet font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors text-center"
                >
                  Login to Review
                </Link>
              )
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && user && (
            <ReviewForm
              onSubmit={handleSubmitReview}
              onCancel={() => setShowReviewForm(false)}
              defaultUserName={userName}
              hideNameInput={!!userName}
            />
          )}

          {/* Login Prompt for Reviews */}
          {!user && !showReviewForm && reviews.length === 0 && (
            <div className="text-center py-12 border-b border-gray-100 mb-8">
              <p className="font-cabinet text-gray-500 mb-4">
                Sign in to be the first to review this product!
              </p>
              <Link
                to="/login"
                state={{ from: `/product/${product.id}` }}
                className="inline-block font-cabinet text-text-dark underline hover:no-underline"
              >
                Login to write a review
              </Link>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 && user ? (
            <div className="text-center py-12">
              <p className="font-cabinet text-gray-500 mb-4">
                No reviews yet. Be the first to review this product!
              </p>
              {!showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="font-cabinet text-text-dark underline hover:no-underline"
                >
                  Write a Review
                </button>
              )}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="font-cabinet font-bold text-gray-600">
                          {review.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-cabinet font-medium text-text-dark">
                          {review.userName}
                        </p>
                        <p className="font-cabinet text-sm text-gray-500">{review.date}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <p className="font-cabinet text-gray-600 leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ProductDetail;
