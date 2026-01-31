import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useFavorites } from '../../context';
import { useAuth } from '../../context/AuthContext';
import logoIcon from '../../assets/icons/logo.svg';
import heartIcon from '../../assets/icons/heart.svg';
import cartIcon from '../../assets/icons/shopping-cart.svg';
import profileIcon from '../../assets/icons/profile.svg';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { getItemCount } = useCart();
  const { getFavoritesCount } = useFavorites();
  const { user, userProfile, logout, loading } = useAuth();

  const cartCount = getItemCount();
  const favoritesCount = getFavoritesCount();

  const navLinkClass = "font-cabinet font-bold text-base text-text-dark capitalize transition-all duration-200 hover:underline";

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  const displayName = userProfile?.displayName || user?.displayName || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className="sticky top-0 z-50 bg-background">
      <div className="max-w-page mx-auto px-6 lg:px-12">
        <div className="flex items-center h-20">
          {/* Left Side: Logo + Navigation */}
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src={logoIcon} alt="KIX" className="w-[30px] h-[30px]" />
            </Link>

            {/* Desktop Navigation - Close to Logo */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/womens" className={navLinkClass}>
                Women
              </Link>
              <Link to="/mens" className={navLinkClass}>
                Men
              </Link>
              <Link to="/kids" className={navLinkClass}>
                Kids
              </Link>
              <Link to="/" className={navLinkClass}>
                Collection
              </Link>
              <Link to="/" className={navLinkClass}>
                Trending
              </Link>
              <Link to="/sale" className="font-cabinet font-bold text-base text-discount-red capitalize transition-all duration-200 hover:underline">
                Sale
              </Link>
            </div>
          </div>

          {/* Right Side: Icons */}
          <div className="flex items-center space-x-6 ml-auto">
            {/* Favorites */}
            <Link
              to="/favorites"
              className="relative transition-opacity duration-200 hover:opacity-70"
              aria-label="Favorites"
            >
              <img src={heartIcon} alt="Favorites" className="w-6 h-6" />
              {favoritesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-discount-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative transition-opacity duration-200 hover:opacity-70"
              aria-label="Shopping Cart"
            >
              <img src={cartIcon} alt="Cart" className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-discount-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Profile / Auth */}
            {loading ? (
              // Loading state
              <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              // Logged in - show user menu
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-70"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-text-dark rounded-full flex items-center justify-center">
                    <span className="font-cabinet font-bold text-xs text-white">
                      {initials}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-text-dark transition-transform ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-cabinet font-medium text-text-dark truncate">
                        {displayName}
                      </p>
                      <p className="font-cabinet text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 font-cabinet text-text-dark hover:bg-gray-50 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        My Account
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 font-cabinet text-text-dark hover:bg-gray-50 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                        My Orders
                      </Link>
                      <Link
                        to="/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 font-cabinet text-text-dark hover:bg-gray-50 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
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
                        Favorites
                      </Link>
                      <Link
                        to="/cart"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 font-cabinet text-text-dark hover:bg-gray-50 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Cart
                        {cartCount > 0 && (
                          <span className="ml-auto bg-gray-100 text-text-dark text-xs font-bold px-2 py-0.5 rounded-full">
                            {cartCount}
                          </span>
                        )}
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 w-full font-cabinet text-discount-red hover:bg-red-50 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Not logged in - show login button
              <Link
                to="/login"
                className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-70"
                aria-label="Login"
              >
                <img src={profileIcon} alt="Login" className="w-6 h-6" />
                <span className="hidden sm:inline font-cabinet font-medium text-sm text-text-dark">
                  Login
                </span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-text-dark hover:opacity-70 transition-opacity duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 bg-background">
            <div className="flex flex-col space-y-4">
              <Link
                to="/womens"
                className={navLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Women
              </Link>
              <Link
                to="/mens"
                className={navLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Men
              </Link>
              <Link
                to="/kids"
                className={navLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Kids
              </Link>
              <Link
                to="/"
                className={navLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Collection
              </Link>
              <Link
                to="/"
                className={navLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trending
              </Link>
              <Link
                to="/sale"
                className="font-cabinet font-bold text-base text-discount-red capitalize transition-all duration-200 hover:underline"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sale
              </Link>

              {/* Mobile Auth Links */}
              {!loading && (
                <div className="pt-4 border-t border-gray-200">
                  {user ? (
                    <>
                      <Link
                        to="/profile"
                        className={navLinkClass}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        My Account
                      </Link>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="font-cabinet font-bold text-base text-discount-red mt-4"
                      >
                        Log Out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className={navLinkClass}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login / Sign Up
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
