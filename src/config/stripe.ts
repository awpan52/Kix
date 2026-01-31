import { loadStripe, Stripe } from '@stripe/stripe-js';

// Load Stripe publishable key from environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('[Stripe] Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Singleton promise for Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe instance (lazy loaded singleton)
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise || Promise.resolve(null);
};

/**
 * Stripe configuration for checkout sessions
 */
export const STRIPE_CONFIG = {
  // Currency for payments
  currency: 'usd',
  
  // Payment mode (one-time payment, not subscription)
  mode: 'payment' as const,
  
  // Success and cancel URLs (relative paths, will be prefixed with window.location.origin)
  successUrl: '/payment-success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: '/checkout?canceled=true',
};

/**
 * Format a price for Stripe (converts dollars to cents)
 * Stripe expects amounts in the smallest currency unit (cents for USD)
 */
export const formatPriceForStripe = (priceInDollars: number): number => {
  return Math.round(priceInDollars * 100);
};

/**
 * Test card numbers for Stripe test mode:
 * - Success: 4242 4242 4242 4242
 * - Decline: 4000 0000 0000 0002
 * - Requires auth: 4000 0025 0000 3155
 * - Expiry: any future date (e.g., 12/34)
 * - CVC: any 3 digits
 * - ZIP: any 5 digits
 */
export const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  requiresAuth: '4000002500003155',
};
