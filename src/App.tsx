import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar, Footer } from './components/layout';
import { ErrorBoundary } from './components/common';
import { 
  Home, 
  MensShoes, 
  WomensShoes, 
  KidsShoes, 
  Profile, 
  ProductDetail, 
  Cart, 
  Favorites, 
  Login, 
  Signup,
  Checkout,
  OrderConfirmation,
  Orders,
  OrderDetail,
  PaymentSuccess,
  Sale,
  Admin
} from './pages';

function App() {
  const location = useLocation();
  
  // Hide navbar and footer on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-background">
        {!isAuthPage && <Navbar />}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mens" element={<MensShoes />} />
            <Route path="/womens" element={<WomensShoes />} />
            <Route path="/kids" element={<KidsShoes />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/sale" element={<Sale />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        {!isAuthPage && <Footer />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
