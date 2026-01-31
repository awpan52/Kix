import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth, useCart } from '../context';
import { Toast } from '../components/common';
import { ShippingAddress, OrderItem, US_STATES, COUNTRIES } from '../types/order';
import { PromoCode, AppliedPromo } from '../types/promo';
import { getStripe } from '../config/stripe';

interface FormErrors {
  [key: string]: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile } = useAuth();
  const { items, getCartTotal, isLoading: cartLoading } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Check if user returned from canceled Stripe checkout
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setToast({ message: 'Payment was canceled. You can try again when ready.', type: 'info' });
      // Clear the URL parameter
      navigate('/checkout', { replace: true });
    }
  }, [searchParams, navigate]);

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Form state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: userProfile?.displayName || '',
    email: user?.email || '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!cartLoading && !user) {
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [user, cartLoading, navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      navigate('/cart');
    }
  }, [items, cartLoading, navigate]);

  // Update form when user profile loads
  useEffect(() => {
    if (userProfile?.displayName) {
      setShippingAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || userProfile.displayName || '',
      }));
    }
    if (user?.email) {
      setShippingAddress((prev) => ({
        ...prev,
        email: prev.email || user.email || '',
      }));
    }
  }, [userProfile, user]);

  // Calculate pricing
  const subtotal = getCartTotal();
  const discount = appliedPromo?.discountAmount || 0;
  const discountedSubtotal = subtotal - discount;
  const shipping = discountedSubtotal > 100 ? 0 : 10;
  const tax = Math.round(discountedSubtotal * 0.08 * 100) / 100;
  const total = discountedSubtotal + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    setPromoError(null);

    try {
      // Query Firebase for the promo code
      const promoRef = doc(db, 'promoCodes', code);
      const promoSnap = await getDoc(promoRef);

      if (!promoSnap.exists()) {
        setPromoError('Invalid promo code');
        setIsApplyingPromo(false);
        return;
      }

      const promoData = promoSnap.data() as PromoCode;

      // Check if active
      if (!promoData.active) {
        setPromoError('This promo code is no longer active');
        setIsApplyingPromo(false);
        return;
      }

      // Check if expired
      if (promoData.expirationDate) {
        const expDate = new Date(promoData.expirationDate);
        if (expDate < new Date()) {
          setPromoError('This promo code has expired');
          setIsApplyingPromo(false);
          return;
        }
      }

      // Check minimum purchase
      if (promoData.minimumPurchase && subtotal < promoData.minimumPurchase) {
        setPromoError(`Minimum purchase of $${promoData.minimumPurchase} required`);
        setIsApplyingPromo(false);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (promoData.type === 'percentage') {
        discountAmount = Math.round(subtotal * (promoData.value / 100) * 100) / 100;
      } else {
        discountAmount = promoData.value;
      }

      // Don't let discount exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);

      setAppliedPromo({
        code: promoData.code,
        type: promoData.type,
        value: promoData.value,
        description: promoData.description,
        discountAmount,
      });

      setPromoInput('');
      setToast({ message: `Promo code "${code}" applied!`, type: 'success' });
    } catch (error) {
      console.error('[Checkout] Error applying promo:', error);
      setPromoError('Failed to apply promo code. Try again.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
    setToast({ message: 'Promo code removed', type: 'info' });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!shippingAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!shippingAddress.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(shippingAddress.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!shippingAddress.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!shippingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!shippingAddress.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!shippingAddress.zip.trim()) {
      newErrors.zip = 'ZIP code is required';
    } else if (shippingAddress.country === 'US' && !/^\d{5}(-\d{4})?$/.test(shippingAddress.zip)) {
      newErrors.zip = 'Please enter a valid 5-digit ZIP code';
    }

    if (!shippingAddress.country) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        brand: item.product.brand,
        size: item.size,
        quantity: item.quantity,
        price: item.product.price,
        imageUrl: item.product.imageUrl,
      }));

      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 7);
      const estimatedDelivery = deliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderData: any = {
        userId: user.uid,
        userEmail: user.email,
        items: orderItems,
        shippingAddress,
        orderDate: new Date().toISOString(),
        status: 'pending',
        subtotal,
        shipping,
        tax,
        total,
        estimatedDelivery,
        // Payment fields - initially pending
        paymentStatus: 'pending',
      };

      // Add promo code info if applied
      if (appliedPromo) {
        orderData.promoCode = appliedPromo.code;
        orderData.discount = appliedPromo.discountAmount;
      }

      console.log('[Checkout] Creating pending order for Stripe payment:', {
        userId: orderData.userId,
        userEmail: orderData.userEmail,
        itemCount: orderItems.length,
        total: orderData.total,
      });

      // Create the order in Firebase with pending payment status
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, orderData);
      const orderId = docRef.id;

      console.log(`[Checkout] Order created with pending payment:`, {
        orderId,
        userId: user.uid,
        paymentStatus: 'pending',
      });

      // Save shipping address to user profile
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { savedAddress: shippingAddress },
          { merge: true }
        );
      } catch (error) {
        console.error('[Checkout] Error saving address to profile:', error);
      }

      // Store order data in sessionStorage for the payment page
      sessionStorage.setItem('pendingOrderId', orderId);
      sessionStorage.setItem('pendingOrderData', JSON.stringify({
        orderId,
        total,
        items: orderItems,
        customerEmail: user.email,
      }));

      // Get Stripe instance
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      console.log('[Checkout] Redirecting to Stripe Payment...');

      /**
       * NOTE: Stripe Checkout with dynamic prices requires a backend to create sessions.
       * For production, you would:
       * 1. Create a Firebase Cloud Function or backend endpoint
       * 2. Call it here to create a Stripe Checkout Session
       * 3. Use the session.url to redirect
       * 
       * For this demo, we'll use Stripe Payment Element with a simulated flow.
       * The payment-success page will handle updating the order status.
       */

      // Redirect to our payment page (which uses Stripe Elements for card input)
      // In production with Stripe Checkout, this would be: window.location.href = session.url
      navigate(`/payment-success?order_id=${orderId}&demo=true`);
    } catch (error) {
      console.error('[Checkout] Error processing payment:', error);
      setToast({ message: 'Failed to process payment. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartLoading) {
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

  const inputClass = (fieldName: string) =>
    `w-full px-4 py-3 rounded-lg border font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark focus:border-transparent transition-all ${
      errors[fieldName] ? 'border-discount-red' : 'border-gray-200'
    }`;

  const selectClass = (fieldName: string) =>
    `w-full px-4 py-3 rounded-lg border font-cabinet text-text-dark bg-white focus:outline-none focus:ring-2 focus:ring-text-dark focus:border-transparent transition-all appearance-none cursor-pointer ${
      errors[fieldName] ? 'border-discount-red' : 'border-gray-200'
    }`;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-page mx-auto px-6 lg:px-12 py-8">
        <div className="mb-8">
          <h1 className="font-cabinet font-bold text-2xl lg:text-3xl text-text-dark">
            Checkout
          </h1>
          <p className="font-cabinet text-gray-500 mt-1">
            Complete your order
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Shipping Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 lg:p-8">
              <h2 className="font-cabinet font-bold text-xl text-text-dark mb-6">
                Shipping Address
              </h2>

              <div className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block font-cabinet font-medium text-text-dark mb-2">
                    Full Name <span className="text-discount-red">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={shippingAddress.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={inputClass('fullName')}
                  />
                  {errors.fullName && (
                    <p className="font-cabinet text-sm text-discount-red mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block font-cabinet font-medium text-text-dark mb-2">
                      Email <span className="text-discount-red">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={shippingAddress.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className={inputClass('email')}
                    />
                    {errors.email && (
                      <p className="font-cabinet text-sm text-discount-red mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block font-cabinet font-medium text-text-dark mb-2">
                      Phone Number <span className="text-discount-red">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      className={inputClass('phone')}
                    />
                    {errors.phone && (
                      <p className="font-cabinet text-sm text-discount-red mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="street" className="block font-cabinet font-medium text-text-dark mb-2">
                    Street Address <span className="text-discount-red">*</span>
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    className={inputClass('street')}
                  />
                  {errors.street && (
                    <p className="font-cabinet text-sm text-discount-red mt-1">{errors.street}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="apartment" className="block font-cabinet font-medium text-text-dark mb-2">
                    Apartment, Suite, etc. <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="apartment"
                    name="apartment"
                    value={shippingAddress.apartment}
                    onChange={handleInputChange}
                    placeholder="Apt 4B"
                    className={inputClass('apartment')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block font-cabinet font-medium text-text-dark mb-2">
                      City <span className="text-discount-red">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                      className={inputClass('city')}
                    />
                    {errors.city && (
                      <p className="font-cabinet text-sm text-discount-red mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="state" className="block font-cabinet font-medium text-text-dark mb-2">
                      State <span className="text-discount-red">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="state"
                        name="state"
                        value={shippingAddress.state}
                        onChange={handleInputChange}
                        className={selectClass('state')}
                      >
                        <option value="">Select State</option>
                        {US_STATES.map((state) => (
                          <option key={state.value} value={state.value}>
                            {state.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.state && (
                      <p className="font-cabinet text-sm text-discount-red mt-1">{errors.state}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="zip" className="block font-cabinet font-medium text-text-dark mb-2">
                      ZIP Code <span className="text-discount-red">*</span>
                    </label>
                    <input
                      type="text"
                      id="zip"
                      name="zip"
                      value={shippingAddress.zip}
                      onChange={handleInputChange}
                      placeholder="10001"
                      className={inputClass('zip')}
                    />
                    {errors.zip && (
                      <p className="font-cabinet text-sm text-discount-red mt-1">{errors.zip}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block font-cabinet font-medium text-text-dark mb-2">
                    Country <span className="text-discount-red">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="country"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleInputChange}
                      className={selectClass('country')}
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.country && (
                    <p className="font-cabinet text-sm text-discount-red mt-1">{errors.country}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 lg:p-8 sticky top-24">
              <h2 className="font-cabinet font-bold text-xl text-text-dark mb-6">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-4">
                    <div className="w-16 h-16 bg-[#E8E8E8] rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-cabinet font-medium text-text-dark text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="font-cabinet text-gray-500 text-sm">
                        Size: {item.size} · Qty: {item.quantity}
                      </p>
                      <p className="font-cabinet font-medium text-text-dark text-sm">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Section */}
              <div className="border-t border-gray-100 pt-6 mb-6">
                <label className="block font-cabinet font-medium text-text-dark mb-2">
                  Promo Code
                </label>
                
                {appliedPromo ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-cabinet font-medium text-green-800">
                          {appliedPromo.code}
                        </p>
                        <p className="font-cabinet text-sm text-green-600">
                          {appliedPromo.description}
                        </p>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="font-cabinet text-sm text-green-700 hover:text-green-900 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value);
                          setPromoError(null);
                        }}
                        placeholder="Enter promo code"
                        className={`flex-1 px-4 py-2.5 rounded-lg border font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark focus:border-transparent transition-all ${
                          promoError ? 'border-discount-red' : 'border-gray-200'
                        }`}
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo}
                        className={`px-4 py-2.5 rounded-lg font-cabinet font-medium transition-colors ${
                          isApplyingPromo
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                        }`}
                      >
                        {isApplyingPromo ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promoError && (
                      <p className="font-cabinet text-sm text-discount-red mt-2">{promoError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between font-cabinet text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                {appliedPromo && (
                  <div className="flex justify-between font-cabinet text-green-600">
                    <span>Promo ({appliedPromo.code})</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-cabinet text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between font-cabinet text-gray-600">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between font-cabinet font-bold text-lg text-text-dark">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  {appliedPromo && (
                    <p className="font-cabinet text-sm text-green-600 text-right mt-1">
                      You save ${discount.toFixed(2)}!
                    </p>
                  )}
                </div>
              </div>

              {/* Proceed to Payment Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-lg font-cabinet font-bold text-base mt-6 transition-all ${
                  isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-card-bg text-white hover:bg-gray-800'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Proceed to Payment · $${total.toFixed(2)}`
                )}
              </button>

              {/* Stripe badge */}
              <div className="flex items-center justify-center gap-2 mt-3 text-gray-400">
                <svg className="w-10 h-4" viewBox="0 0 60 25" fill="currentColor">
                  <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.9 10.9 0 01-4.56.95c-4.01 0-6.83-2.5-6.83-7.28 0-4.19 2.39-7.34 6.42-7.34 3.72 0 5.82 2.88 5.82 6.79 0 .76-.04 1.43-.04 1.96zm-5.58-5.94c-1.32 0-2.3.97-2.47 2.55h4.9c-.09-1.54-.82-2.55-2.43-2.55zM40.95 20.3V5.84h4.17v1.53c.77-1.03 2.07-1.78 3.77-1.78.56 0 1.03.05 1.41.14v3.97c-.47-.14-1.03-.19-1.65-.19-1.41 0-2.68.65-3.53 1.87v8.92h-4.17zm-6.76 0V5.84h4.17V20.3h-4.17zm2.08-16.45c-1.37 0-2.47-1.07-2.47-2.41S34.9-.97 36.27-.97s2.47 1.07 2.47 2.41-1.1 2.41-2.47 2.41zm-9.65 10.83c0-3.86 2.82-8.84 8.38-8.84 1.27 0 2.49.23 3.58.7V9.4a7.32 7.32 0 00-3.44-.89c-2.82 0-4.33 2.27-4.33 5.17 0 3.16 1.65 5.12 4.33 5.12 1.27 0 2.49-.28 3.44-.84v3.16c-1.08.47-2.3.74-3.58.74-5.56 0-8.38-4.93-8.38-8.79zm-7.92 5.62V5.84h4.17v1.53c.86-1.12 2.21-1.78 3.95-1.78 2.96 0 5.07 2.13 5.07 6.14v8.57h-4.17v-7.66c0-2.13-.91-3.16-2.63-3.16-1.27 0-2.21.7-2.77 1.73v9.09h-4.62zM0 14.28c0-4.74 3.11-8.69 8.06-8.69 4.87 0 8.06 3.95 8.06 8.69 0 4.74-3.2 8.64-8.06 8.64C3.11 22.92 0 19.02 0 14.28zm11.96 0c0-2.92-1.55-5.17-3.9-5.17s-3.9 2.25-3.9 5.17c0 2.92 1.55 5.12 3.9 5.12s3.9-2.2 3.9-5.12z"/>
                </svg>
                <span className="font-cabinet text-xs">Secure payment</span>
              </div>

              <Link
                to="/cart"
                className="block text-center font-cabinet text-gray-500 hover:text-text-dark transition-colors mt-4"
              >
                ← Return to Cart
              </Link>

              <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-cabinet text-xs">Secure checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

export default Checkout;
