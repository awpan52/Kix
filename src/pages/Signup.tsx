import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup, user, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from state or default to home
  const from = (location.state as { from?: string })?.from || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Clear auth error on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) {
      errors.name = 'Please enter your name.';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter a password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await signup(email, password, name.trim());
      navigate(from, { replace: true });
    } catch {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFieldError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-400' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-400' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-green-400' };
    return { strength, label: 'Strong', color: 'bg-green-600' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-cabinet font-bold text-3xl text-text-dark mb-2">
            Create Account
          </h1>
          <p className="font-cabinet text-gray-500">
            Join KIX to start shopping
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Auth Error Message */}
            {error && (
              <div className="bg-red-50 text-discount-red font-cabinet text-sm p-4 rounded-lg flex items-start gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block font-cabinet font-medium text-text-dark mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError('name');
                }}
                placeholder="John Doe"
                autoComplete="name"
                className={`w-full px-4 py-3 rounded-lg border font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark focus:border-transparent transition-all ${
                  formErrors.name ? 'border-discount-red' : 'border-gray-200'
                }`}
              />
              {formErrors.name && (
                <p className="font-cabinet text-sm text-discount-red mt-1">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block font-cabinet font-medium text-text-dark mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                placeholder="you@example.com"
                autoComplete="email"
                className={`w-full px-4 py-3 rounded-lg border font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark focus:border-transparent transition-all ${
                  formErrors.email ? 'border-discount-red' : 'border-gray-200'
                }`}
              />
              {formErrors.email && (
                <p className="font-cabinet text-sm text-discount-red mt-1">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block font-cabinet font-medium text-text-dark mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full px-4 py-3 rounded-lg border font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark focus:border-transparent transition-all ${
                  formErrors.password ? 'border-discount-red' : 'border-gray-200'
                }`}
              />
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-cabinet text-xs text-gray-500">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              {formErrors.password && (
                <p className="font-cabinet text-sm text-discount-red mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block font-cabinet font-medium text-text-dark mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError('confirmPassword');
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full px-4 py-3 rounded-lg border font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark focus:border-transparent transition-all ${
                  formErrors.confirmPassword ? 'border-discount-red' : 'border-gray-200'
                }`}
              />
              {formErrors.confirmPassword && (
                <p className="font-cabinet text-sm text-discount-red mt-1">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms */}
            <p className="font-cabinet text-sm text-gray-500">
              By creating an account, you agree to our{' '}
              <button type="button" className="text-text-dark underline">
                Terms of Service
              </button>{' '}
              and{' '}
              <button type="button" className="text-text-dark underline">
                Privacy Policy
              </button>
              .
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-lg font-cabinet font-bold text-base transition-all ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-card-bg text-white hover:bg-gray-800'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-5 h-5"
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="font-cabinet text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Login Link */}
          <p className="text-center font-cabinet text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              state={{ from }}
              className="text-text-dark font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link
            to="/"
            className="font-cabinet text-gray-500 hover:text-text-dark transition-colors"
          >
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
