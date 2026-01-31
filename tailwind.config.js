/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cabinet: ['"Plus Jakarta Sans"', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
        teko: ['"Teko"', 'sans-serif'],
      },
      colors: {
        background: '#F4F4F4',
        'footer-bg': '#333333',
        'text-dark': '#181818',
        'text-light': '#FFFFFF',
        'card-bg': '#000000',
        'discount-red': '#DB4444',
        'star-gold': '#FFAD33',
      },
      spacing: {
        '112': '112px',
        '144': '144px',
      },
      maxWidth: {
        'page': '1440px',
      },
    },
  },
  plugins: [],
}
