# Shoe E-Commerce Store

A full-stack e-commerce web application for buying shoes, built with React, TypeScript, and Firebase.

## Features

- 🛍️ Product browsing and search
- 🛒 Shopping cart with size selection
- ❤️ Favorites/wishlist
- ⭐ Product reviews and ratings
- 💳 Stripe payment integration (test mode)
- 🔐 User authentication
- 📦 Order history and tracking
- 🎟️ Promo code system
- 💰 Sale section with discounted items

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Firebase (Authentication, Firestore Database)
- **Payment:** Stripe (test mode)
- **Routing:** React Router v6
- **State Management:** React Context API

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/YOUR-USERNAME/shoe-ecommerce-app.git
cd shoe-ecommerce-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory (copy from `.env.example`):
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_test_publishable_key
```

4. Run the development server
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## Testing Payments

This app uses Stripe in test mode. Use these test cards:

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits

## Promo Codes

- **YR24:** 20% off your order

## License

MIT
