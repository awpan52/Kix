# KIX - Premium Footwear E-Commerce

A modern shoe e-commerce web application built with React 18, TypeScript, Vite, and Tailwind CSS.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and visit `http://localhost:5173`

## Project Structure

```
/src
  /components
    /layout          # Navbar, Footer
    /product         # ProductCard
    /common          # Reusable UI components (Button, ErrorBoundary, ProductGrid)
  /pages
    Home.tsx         # Homepage with hero, new arrivals, trending
    MensShoes.tsx    # Men's category page
    WomensShoes.tsx  # Women's category page
    KidsShoes.tsx    # Kids category page
    Profile.tsx      # User profile/login page
  /types
    product.ts       # Product interface and types
  /data
    mockProducts.ts  # Sample shoe data
  /assets
  App.tsx            # Main app with routing
  main.tsx           # Entry point
```

## Features

### Phase 1 (Current)

- ✅ Responsive navigation with mobile hamburger menu
- ✅ Product cards with hover effects and favorites toggle
- ✅ Home page with hero section, new arrivals, and trending sections
- ✅ Category pages (Men's, Women's, Kids)
- ✅ Profile page with login/signup placeholders
- ✅ Cart and favorites counter badges
- ✅ Star rating display
- ✅ Error boundary for graceful error handling

### Coming Soon

- Shopping cart functionality
- User authentication
- Product detail pages
- Search functionality
- Filters and sorting
- Checkout flow

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
