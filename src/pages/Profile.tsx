import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Toast } from '../components/common';

const Profile = () => {
  const { user, userProfile, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setToast({ message: 'Successfully logged out', type: 'success' });
      setTimeout(() => navigate('/'), 1500);
    } catch {
      setToast({ message: 'Failed to log out', type: 'error' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg
            className="animate-spin w-6 h-6 text-text-dark"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="font-cabinet text-text-dark">Loading...</span>
        </div>
      </div>
    );
  }

  // Not logged in - show login prompt
  if (!user) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-page mx-auto px-6 lg:px-12 py-16">
          <div className="max-w-md mx-auto text-center">
            {/* Icon */}
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <h1 className="font-cabinet font-bold text-2xl text-text-dark mb-2">
              Welcome to KIX
            </h1>
            <p className="font-cabinet text-gray-500 mb-8">
              Sign in to access your account, track orders, and save your favorites.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-block bg-card-bg text-white font-cabinet font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-block border-2 border-text-dark text-text-dark font-cabinet font-bold px-8 py-3 rounded-lg hover:bg-text-dark hover:text-white transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - show profile
  const displayName = userProfile?.displayName || user.displayName || 'User';
  const email = userProfile?.email || user.email || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-page mx-auto px-6 lg:px-12 py-12">
        <h1 className="font-cabinet font-bold text-2xl text-text-dark mb-8">
          My Account
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-8">
              {/* Avatar */}
              <div className="w-20 h-20 bg-text-dark rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-cabinet font-bold text-2xl text-white">
                  {initials}
                </span>
              </div>

              {/* Name & Email */}
              <div className="text-center mb-6">
                <h2 className="font-cabinet font-bold text-xl text-text-dark">
                  {displayName}
                </h2>
                <p className="font-cabinet text-gray-500 text-sm">{email}</p>
              </div>

              {/* Member Since */}
              {userProfile?.createdAt && (
                <p className="font-cabinet text-sm text-gray-400 text-center mb-6">
                  Member since{' '}
                  {new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`w-full py-3 rounded-lg font-cabinet font-medium border-2 border-gray-200 transition-all ${
                  isLoggingOut
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'text-text-dark hover:border-discount-red hover:text-discount-red'
                }`}
              >
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Orders */}
              <Link
                to="/orders"
                className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-text-dark transition-colors">
                    <svg
                      className="w-6 h-6 text-text-dark group-hover:text-white transition-colors"
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
                  </div>
                  <div>
                    <h3 className="font-cabinet font-bold text-text-dark">My Orders</h3>
                    <p className="font-cabinet text-sm text-gray-500">
                      Track your orders
                    </p>
                  </div>
                </div>
              </Link>

              {/* Favorites */}
              <Link
                to="/favorites"
                className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-text-dark transition-colors">
                    <svg
                      className="w-6 h-6 text-text-dark group-hover:text-white transition-colors"
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
                  <div>
                    <h3 className="font-cabinet font-bold text-text-dark">Favorites</h3>
                    <p className="font-cabinet text-sm text-gray-500">
                      Your liked items
                    </p>
                  </div>
                </div>
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-text-dark transition-colors">
                    <svg
                      className="w-6 h-6 text-text-dark group-hover:text-white transition-colors"
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
                  </div>
                  <div>
                    <h3 className="font-cabinet font-bold text-text-dark">Shopping Cart</h3>
                    <p className="font-cabinet text-sm text-gray-500">
                      View your cart
                    </p>
                  </div>
                </div>
              </Link>

              {/* Account Settings */}
              <div className="bg-white rounded-xl p-6 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-text-dark"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-cabinet font-bold text-text-dark">Settings</h3>
                    <p className="font-cabinet text-sm text-gray-500">
                      Coming soon
                    </p>
                  </div>
                </div>
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

export default Profile;
