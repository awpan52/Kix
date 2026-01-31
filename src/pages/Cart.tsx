import { Link } from 'react-router-dom';
import { useCart } from '../context';

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-page mx-auto px-6 lg:px-12 py-12">
          <h1 className="font-cabinet font-bold text-3xl text-text-dark mb-8">
            Shopping Cart
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="font-cabinet font-bold text-xl text-text-dark mb-2">
              Your cart is empty
            </h2>
            <p className="font-cabinet text-gray-500 mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link
              to="/"
              className="inline-block bg-card-bg text-white font-cabinet font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </Link>
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
            Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h1>
          <button
            onClick={clearCart}
            className="font-cabinet text-gray-500 hover:text-discount-red transition-colors text-sm"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${item.size}`}
                className="bg-white rounded-xl p-4 sm:p-6 flex gap-4 sm:gap-6"
              >
                {/* Product Image */}
                <Link
                  to={`/product/${item.product.id}`}
                  className="w-24 h-24 sm:w-32 sm:h-32 bg-[#E8E8E8] rounded-lg flex-shrink-0 overflow-hidden"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-full h-full object-contain p-2"
                  />
                </Link>

                {/* Product Details */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link
                        to={`/product/${item.product.id}`}
                        className="font-space font-medium text-lg text-text-dark hover:text-gray-700 transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      <p className="font-cabinet text-sm text-gray-500 mt-1">
                        Size: {item.size}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id, item.size)}
                      className="text-gray-400 hover:text-discount-red transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-auto pt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.size, item.quantity - 1)
                        }
                        className="w-10 h-10 flex items-center justify-center text-text-dark hover:bg-gray-100 transition-colors rounded-l-lg"
                        aria-label="Decrease quantity"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-12 text-center font-cabinet font-medium text-text-dark">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.size, item.quantity + 1)
                        }
                        className="w-10 h-10 flex items-center justify-center text-text-dark hover:bg-gray-100 transition-colors rounded-r-lg"
                        aria-label="Increase quantity"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-space font-bold text-lg text-text-dark">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="font-cabinet text-sm text-gray-500">
                          ${item.product.price} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-24">
              <h2 className="font-cabinet font-bold text-xl text-text-dark mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between font-cabinet">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-text-dark">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-cabinet">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-text-dark">
                    {getCartTotal() >= 140 ? 'Free' : '$10.00'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between font-cabinet font-bold">
                    <span className="text-text-dark">Total</span>
                    <span className="text-text-dark text-xl">
                      ${(getCartTotal() + (getCartTotal() >= 140 ? 0 : 10)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {getCartTotal() < 140 && (
                <p className="font-cabinet text-sm text-gray-500 mb-6">
                  Add ${(140 - getCartTotal()).toFixed(2)} more for free shipping!
                </p>
              )}

              <Link
                to="/checkout"
                className="block w-full bg-card-bg text-white font-cabinet font-bold py-4 rounded-lg hover:bg-gray-800 transition-colors mb-4 text-center"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/"
                className="block text-center font-cabinet text-gray-500 hover:text-text-dark transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
