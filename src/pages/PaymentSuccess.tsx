import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth, useCart } from '../context';
import { Order } from '../types/order';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { clearCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo mode shows test card input, production mode verifies Stripe session
  const isDemo = searchParams.get('demo') === 'true';
  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');

  // Card input state for demo mode
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login', { state: { from: '/payment-success' } });
      return;
    }

    if (!orderId) {
      setError('No order found');
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
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

        const fullOrder = { ...orderData, orderId };
        setOrder(fullOrder);

        // If not demo mode and we have a session ID, verify and complete
        if (!isDemo && sessionId) {
          // In production, you would verify the session with your backend
          // For now, we'll auto-complete if coming from Stripe
          await completePayment(orderId, sessionId);
        }

        // If order is already paid, show success
        if (orderData.paymentStatus === 'paid') {
          setPaymentComplete(true);
        }
      } catch (err) {
        console.error('[PaymentSuccess] Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, sessionId, isDemo, user, authLoading, navigate]);

  const completePayment = async (orderIdToUpdate: string, stripeSessionId?: string) => {
    console.log('[PaymentSuccess] Starting completePayment...', {
      orderIdToUpdate,
      stripeSessionId,
      currentUserId: user?.uid,
    });

    try {
      // First, verify we can read the order and it belongs to this user
      const orderRef = doc(db, 'orders', orderIdToUpdate);
      console.log('[PaymentSuccess] Order document path:', orderRef.path);

      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        console.error('[PaymentSuccess] Order does not exist:', orderIdToUpdate);
        throw new Error('Order not found');
      }

      const existingOrder = orderSnap.data();
      console.log('[PaymentSuccess] Existing order data:', {
        orderId: orderIdToUpdate,
        orderUserId: existingOrder.userId,
        currentUserId: user?.uid,
        userMatch: existingOrder.userId === user?.uid,
        currentPaymentStatus: existingOrder.paymentStatus,
      });

      // Verify user owns this order
      if (existingOrder.userId !== user?.uid) {
        console.error('[PaymentSuccess] User mismatch! Order belongs to different user');
        throw new Error('Permission denied: Order belongs to different user');
      }

      // Now update the order
      const updateData: {
        paymentStatus: 'paid';
        stripeSessionId: string;
        paymentMethod: string;
        paymentDate: string;
      } = {
        paymentStatus: 'paid' as const,
        stripeSessionId: stripeSessionId || `demo_${Date.now()}`,
        paymentMethod: 'card',
        paymentDate: new Date().toISOString(),
      };
      
      console.log('[PaymentSuccess] Updating order with:', updateData);
      
      await updateDoc(orderRef, updateData);
      
      console.log('[PaymentSuccess] Order updated successfully!');

      // Clear the cart
      clearCart();

      // Clear session storage
      sessionStorage.removeItem('pendingOrderId');
      sessionStorage.removeItem('pendingOrderData');

      // Update local state with the new payment status
      setOrder(prev => prev ? { ...prev, ...updateData } : null);
      setPaymentComplete(true);
      console.log('[PaymentSuccess] Payment completed successfully');
    } catch (err) {
      console.error('[PaymentSuccess] Error completing payment:', err);
      console.error('[PaymentSuccess] Error details:', {
        errorName: err instanceof Error ? err.name : 'Unknown',
        errorMessage: err instanceof Error ? err.message : String(err),
        orderIdToUpdate,
        currentUserId: user?.uid,
      });
      throw err;
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateCard = (): boolean => {
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanCardNumber.length !== 16) {
      setCardError('Please enter a valid 16-digit card number');
      return false;
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setCardError('Please enter a valid expiry date (MM/YY)');
      return false;
    }

    if (cvc.length < 3) {
      setCardError('Please enter a valid CVC');
      return false;
    }

    // Check for test decline card
    if (cleanCardNumber === '4000000000000002') {
      setCardError('Your card was declined. Please try a different card.');
      return false;
    }

    setCardError(null);
    return true;
  };

  const handlePayment = async () => {
    if (!validateCard() || !orderId) return;

    setIsProcessing(true);
    setCardError(null);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check for test authentication card
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      if (cleanCardNumber === '4000002500003155') {
        // Simulate 3D Secure - for demo, we'll just add a slight delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await completePayment(orderId);
    } catch (err) {
      console.error('[PaymentSuccess] Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Check for Firestore permission error
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        setCardError('Unable to update order. Please contact support if this persists.');
        setError('Permission error while processing payment. The payment was not completed.');
      } else {
        setCardError(`Payment failed: ${errorMessage}. Please try again.`);
      }
    } finally {
      setIsProcessing(false);
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
          <span className="font-cabinet text-text-dark">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-discount-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-cabinet font-bold text-xl text-text-dark mb-2">
              {error}
            </h1>
            <p className="font-cabinet text-gray-500 mb-6">
              We couldn't process your request. Please try again.
            </p>
            <Link
              to="/checkout"
              className="inline-block bg-card-bg text-white font-cabinet font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment Complete - Success State
  if (paymentComplete && order) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="bg-white rounded-xl p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="font-cabinet font-bold text-2xl lg:text-3xl text-text-dark mb-2">
              Payment Successful!
            </h1>
            <p className="font-cabinet text-gray-500 mb-8">
              Thank you for your purchase. Your order has been confirmed.
            </p>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <div className="flex justify-between items-center mb-4">
                <span className="font-cabinet font-medium text-text-dark">Order Number</span>
                <span className="font-cabinet text-gray-600">#{order.orderId.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-cabinet font-medium text-text-dark">Payment Status</span>
                <span className="px-3 py-1 rounded-full text-xs font-cabinet font-medium bg-green-100 text-green-800">
                  Paid
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-cabinet font-medium text-text-dark">Items</span>
                <span className="font-cabinet text-gray-600">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-cabinet font-bold text-text-dark">Total Paid</span>
                  <span className="font-cabinet font-bold text-lg text-text-dark">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Estimated Delivery */}
            {order.estimatedDelivery && (
              <p className="font-cabinet text-gray-600 mb-8">
                Estimated delivery: <strong>{order.estimatedDelivery}</strong>
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={`/orders/${order.orderId}`}
                className="bg-card-bg text-white font-cabinet font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                View Order Details
              </Link>
              <Link
                to="/"
                className="border-2 border-gray-200 text-text-dark font-cabinet font-bold px-8 py-3 rounded-lg hover:border-gray-400 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>

            {/* Confirmation Email Note */}
            <p className="font-cabinet text-sm text-gray-400 mt-8">
              A confirmation email will be sent to {order.userEmail}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Demo Payment Form
  if (isDemo && order) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="bg-white rounded-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-cabinet font-bold text-2xl text-text-dark mb-2">
                Complete Payment
              </h1>
              <p className="font-cabinet text-gray-500">
                Enter your card details to complete the purchase
              </p>
            </div>

            {/* Order Amount */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-cabinet text-gray-600">Order Total</span>
                <span className="font-cabinet font-bold text-xl text-text-dark">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Test Card Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-cabinet text-sm text-blue-800 font-medium mb-2">
                Test Mode - Use these card numbers:
              </p>
              <ul className="font-cabinet text-sm text-blue-700 space-y-1">
                <li>Success: <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code></li>
                <li>Decline: <code className="bg-blue-100 px-1 rounded">4000 0000 0000 0002</code></li>
                <li>Any expiry (future) &amp; any 3-digit CVC</li>
              </ul>
            </div>

            {/* Card Form */}
            <div className="space-y-4">
              <div>
                <label className="block font-cabinet font-medium text-text-dark mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-cabinet font-medium text-text-dark mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block font-cabinet font-medium text-text-dark mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark focus:border-transparent"
                  />
                </div>
              </div>

              {cardError && (
                <p className="font-cabinet text-sm text-discount-red">{cardError}</p>
              )}

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full py-4 rounded-lg font-cabinet font-bold text-base transition-all ${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-card-bg text-white hover:bg-gray-800'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing Payment...
                  </span>
                ) : (
                  `Pay $${order.total.toFixed(2)}`
                )}
              </button>
            </div>

            {/* Cancel Link */}
            <Link
              to="/checkout?canceled=true"
              className="block text-center font-cabinet text-gray-500 hover:text-text-dark transition-colors mt-4"
            >
              Cancel and return to checkout
            </Link>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-cabinet text-xs">Secured by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccess;
