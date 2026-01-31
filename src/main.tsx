import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, CartProvider, FavoritesProvider, ReviewsProvider, ProductsProvider } from './context'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <FavoritesProvider>
              <ReviewsProvider>
                <App />
              </ReviewsProvider>
            </FavoritesProvider>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
