import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context';
import { Order } from '../types/order';

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order not found');
        setIsLoading(false);
        return;
      }

      if (authLoading) return;

      if (!user) {
        navigate('/login', { state: { from: `/order-confirmation/${orderId}` } });
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
        console.error('[OrderConfirmation] Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user, authLoading, navigate]);

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
              to="/"
              className="inline-block bg-card-bg text-white font-cabinet font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const displayName = userProfile?.displayName || user?.displayName || 'there';
  const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-once">
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-cabinet font-bold text-3xl text-text-dark mb-2">
            Order Placed Successfully!
          </h1>
          <p className="font-cabinet text-gray-500 text-lg">
            Thank you for your order, {displayName}!
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-xl p-6 lg:p-8 mb-8">
          <h2 className="font-cabinet font-bold text-xl text-text-dark mb-6">
            Order Details
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="font-cabinet text-gray-500 text-sm">Order Number</p>
              <p className="font-cabinet font-medium text-text-dark">
                #{order.orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div>
              <p className="font-cabinet text-gray-500 text-sm">Order Date</p>
              <p className="font-cabinet font-medium text-text-dark">{orderDate}</p>
            </div>
            <div>
              <p className="font-cabinet text-gray-500 text-sm">Total Amount</p>
              <p className="font-cabinet font-bold text-text-dark text-lg">
                ${order.total.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="font-cabinet text-gray-500 text-sm">Estimated Delivery</p>
              <p className="font-cabinet font-medium text-text-dark">
                {order.estimatedDelivery || '5-7 business days'}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-cabinet font-bold text-text-dark mb-4">
              Items Ordered ({order.items.length})
            </h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-16 h-16 bg-[#E8E8E8] rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-cabinet font-medium text-text-dark">{item.name}</p>
                    <p className="font-cabinet text-gray-500 text-sm">
                      Size: {item.size} · Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-cabinet font-medium text-text-dark">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-t border-gray-100 pt-6 mt-6">
            <h3 className="font-cabinet font-bold text-text-dark mb-4">
              Shipping Address
            </h3>
            <div className="font-cabinet text-gray-600">
              <p>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
              <p>{order.shippingAddress.country === 'US' ? 'United States' : order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="space-y-2">
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
              <div className="flex justify-between font-cabinet font-bold text-lg text-text-dark pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Confirmation Note */}
        <div className="bg-blue-50 rounded-lg p-4 mb-8 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="font-cabinet text-blue-800 text-sm">
            A confirmation email has been sent to <strong>{order.shippingAddress.email}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="flex-1 bg-card-bg text-white font-cabinet font-bold py-4 rounded-lg hover:bg-gray-800 transition-colors text-center"
          >
            Continue Shopping
          </Link>
          <Link
            to={`/orders/${order.orderId}`}
            className="flex-1 border-2 border-text-dark text-text-dark font-cabinet font-bold py-4 rounded-lg hover:bg-text-dark hover:text-white transition-colors text-center"
          >
            View Order Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
