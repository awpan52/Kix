import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth, useCart } from '../context';
import { Order, OrderStatus, PaymentStatus } from '../types/order';
import { Toast } from '../components/common';
import { getProductById } from '../data/mockProducts';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: OrderStatus) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getPaymentStatusColor = (status?: PaymentStatus) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getPaymentStatusLabel = (status?: PaymentStatus) => {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addToCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order not found');
        setIsLoading(false);
        return;
      }

      if (authLoading) return;

      if (!user) {
        navigate('/login', { state: { from: `/orders/${orderId}` } });
        return;
      }

      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          setError('Order not found');
          setIsLoading(false);
          return;
        }

        const orderData = orderSnap.data() as Omit<Order, 'orderId'>;

        // Verify this order belongs to the current user
        if (orderData.userId !== user.uid) {
          setError('You do not have permission to view this order');
          setIsLoading(false);
          return;
        }

        setOrder({ ...orderData, orderId });
      } catch (err) {
        console.error('[OrderDetail] Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user, authLoading, navigate]);

  const handleReorder = () => {
    if (!order) return;

    let addedCount = 0;
    order.items.forEach((item) => {
      const product = getProductById(item.productId);
      if (product) {
        for (let i = 0; i < item.quantity; i++) {
          addToCart(product, item.size);
        }
        addedCount += item.quantity;
      }
    });

    if (addedCount > 0) {
      setToast({ message: `${addedCount} item${addedCount > 1 ? 's' : ''} added to cart!`, type: 'success' });
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin w-6 h-6 text-text-dark" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-cabinet text-text-dark">Loading order...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-page mx-auto px-6 lg:px-12 py-16">
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-discount-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-cabinet font-bold text-2xl text-text-dark mb-4">{error}</h1>
            <Link
              to="/orders"
              className="inline-block bg-card-bg text-white font-cabinet font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const currentStatusIndex = ORDER_STATUSES.indexOf(order.status);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-page mx-auto px-6 lg:px-12 py-8">
        {/* Back Link */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 font-cabinet text-gray-500 hover:text-text-dark transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-cabinet font-bold text-2xl lg:text-3xl text-text-dark">
              Order Details
            </h1>
            <p className="font-cabinet text-gray-500 mt-1">
              Order #{order.orderId.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-cabinet font-medium ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-cabinet font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
              {getPaymentStatusLabel(order.paymentStatus)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Progress */}
            {order.status !== 'cancelled' && (
              <div className="bg-white rounded-xl p-6 lg:p-8">
                <h2 className="font-cabinet font-bold text-lg text-text-dark mb-6">
                  Order Status
                </h2>
                <div className="relative">
                  {/* Progress Bar */}
                  <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${(currentStatusIndex / (ORDER_STATUSES.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Status Steps */}
                  <div className="relative flex justify-between">
                    {ORDER_STATUSES.map((status, index) => {
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;

                      return (
                        <div key={status} className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}
                          >
                            {isCompleted ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-xs font-bold">{index + 1}</span>
                            )}
                          </div>
                          <span className={`font-cabinet text-xs mt-2 ${isCompleted ? 'text-text-dark font-medium' : 'text-gray-400'}`}>
                            {getStatusLabel(status)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {order.estimatedDelivery && (
                  <p className="font-cabinet text-gray-500 text-sm mt-6 text-center">
                    Estimated delivery: <strong>{order.estimatedDelivery}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-xl p-6 lg:p-8">
              <h2 className="font-cabinet font-bold text-lg text-text-dark mb-6">
                Items Ordered
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <Link
                      to={`/product/${item.productId}`}
                      className="w-20 h-20 bg-[#E8E8E8] rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </Link>
                    <div className="flex-1">
                      <Link
                        to={`/product/${item.productId}`}
                        className="font-cabinet font-medium text-text-dark hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="font-cabinet text-gray-500 text-sm">{item.brand}</p>
                      <p className="font-cabinet text-gray-500 text-sm">
                        Size: {item.size} · Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-cabinet font-medium text-text-dark">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="font-cabinet text-gray-400 text-sm">
                          ${item.price.toFixed(2)} each
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl p-6 lg:p-8">
              <h2 className="font-cabinet font-bold text-lg text-text-dark mb-4">
                Shipping Address
              </h2>
              <div className="font-cabinet text-gray-600">
                <p className="font-medium text-text-dark">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.street}</p>
                {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country === 'US' ? 'United States' : order.shippingAddress.country}</p>
                <p className="mt-2">{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.email}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 lg:p-8 sticky top-24">
              <h2 className="font-cabinet font-bold text-lg text-text-dark mb-6">
                Order Summary
              </h2>

              {/* Order Info */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between font-cabinet text-gray-600">
                  <span>Order Date</span>
                  <span className="text-right text-sm">{orderDate}</span>
                </div>
                <div className="flex justify-between font-cabinet text-gray-600">
                  <span>Payment Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {getPaymentStatusLabel(order.paymentStatus)}
                  </span>
                </div>
                {order.paymentMethod && (
                  <div className="flex justify-between font-cabinet text-gray-600">
                    <span>Payment Method</span>
                    <span className="text-right text-sm capitalize">{order.paymentMethod}</span>
                  </div>
                )}
                {order.paymentDate && (
                  <div className="flex justify-between font-cabinet text-gray-600">
                    <span>Payment Date</span>
                    <span className="text-right text-sm">
                      {new Date(order.paymentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 my-6" />

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between font-cabinet text-gray-600">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-cabinet text-gray-600">
                  <span>Shipping</span>
                  <span className={order.shipping === 0 ? 'text-green-600' : ''}>
                    {order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between font-cabinet text-gray-600">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between font-cabinet font-bold text-lg text-text-dark">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleReorder}
                  className="w-full py-3 rounded-lg font-cabinet font-bold bg-card-bg text-white hover:bg-gray-800 transition-colors"
                >
                  Reorder Items
                </button>
                <Link
                  to="/cart"
                  className="block w-full py-3 rounded-lg font-cabinet font-bold border-2 border-gray-200 text-text-dark hover:border-gray-400 transition-colors text-center"
                >
                  View Cart
                </Link>
              </div>

              {/* Help */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="font-cabinet text-gray-500 text-sm text-center">
                  Need help with your order?{' '}
                  <button className="text-text-dark underline">Contact Support</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
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

export default OrderDetail;
