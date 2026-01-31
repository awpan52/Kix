import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context';
import { Order, OrderStatus, PaymentStatus } from '../types/order';

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

const Orders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }

    const fetchOrders = async () => {
      console.log(`[Orders] Fetching orders for user: ${user.uid}`);
      setError(null);
      
      try {
        const ordersRef = collection(db, 'orders');
        
        // Try with orderBy first (requires composite index)
        let userOrders: Order[] = [];
        
        try {
          const q = query(
            ordersRef,
            where('userId', '==', user.uid),
            orderBy('orderDate', 'desc')
          );
          const snapshot = await getDocs(q);
          
          userOrders = snapshot.docs.map((doc) => ({
            orderId: doc.id,
            ...doc.data(),
          })) as Order[];
          
          console.log(`[Orders] Loaded ${userOrders.length} orders with orderBy`);
        } catch (indexError) {
          // If composite index doesn't exist, fall back to simple query + client-side sort
          console.warn('[Orders] Composite index may be missing, falling back to simple query:', indexError);
          
          const simpleQuery = query(
            ordersRef,
            where('userId', '==', user.uid)
          );
          const snapshot = await getDocs(simpleQuery);
          
          userOrders = snapshot.docs.map((doc) => ({
            orderId: doc.id,
            ...doc.data(),
          })) as Order[];
          
          // Sort client-side (newest first)
          userOrders.sort((a, b) => {
            const dateA = new Date(a.orderDate).getTime();
            const dateB = new Date(b.orderDate).getTime();
            return dateB - dateA;
          });
          
          console.log(`[Orders] Loaded ${userOrders.length} orders with fallback query`);
        }

        setOrders(userOrders);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Orders] Error fetching orders:', err);
        setError(`Failed to load orders: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, authLoading, navigate]);

  if (isLoading || authLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin w-6 h-6 text-text-dark" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-cabinet text-text-dark">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-page mx-auto px-6 lg:px-12 py-8">
          <div className="bg-red-50 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-discount-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="font-cabinet font-bold text-xl text-text-dark mb-2">
              Unable to Load Orders
            </h2>
            <p className="font-cabinet text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-card-bg text-white font-cabinet font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-page mx-auto px-6 lg:px-12 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-cabinet font-bold text-2xl lg:text-3xl text-text-dark">
            My Orders
          </h1>
          <p className="font-cabinet text-gray-500 mt-1">
            View and track your order history
          </p>
        </div>

        {orders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="font-cabinet font-bold text-xl text-text-dark mb-2">
              No Orders Yet
            </h2>
            <p className="font-cabinet text-gray-500 mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link
              to="/"
              className="inline-block bg-card-bg text-white font-cabinet font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-4">
            {orders.map((order) => {
              const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <Link
                  key={order.orderId}
                  to={`/orders/${order.orderId}`}
                  className="block bg-white rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left - Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <p className="font-cabinet font-bold text-text-dark">
                          Order #{order.orderId.slice(0, 8).toUpperCase()}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs font-cabinet font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-cabinet font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </span>
                      </div>
                      <p className="font-cabinet text-gray-500 text-sm">
                        {orderDate} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>

                    {/* Right - Total & Action */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-cabinet text-gray-500 text-sm">Total</p>
                        <p className="font-cabinet font-bold text-text-dark text-lg">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-gray-400">
                        <span className="font-cabinet text-sm">View Details</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    {order.items.slice(0, 4).map((item, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 bg-[#E8E8E8] rounded-lg overflow-hidden flex-shrink-0"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="font-cabinet text-gray-500 text-xs">
                          +{order.items.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
