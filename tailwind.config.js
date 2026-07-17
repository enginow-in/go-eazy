/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffc9c9',
          300: '#ffa2a2',
          400: '#ff6b6b',
          500: '#CA3433', // Persian Red
          600: '#ac2d2c',
          700: '#8b2423',
          800: '#6c1c1b',
          900: '#521514',
          pink: '#E63946', // Red accent
          purple: '#6B46C1', 
          dark: '#0B0F19', 
          lime: '#CCFF00',
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s ease both',
        float: 'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      },
      // Mobile-first grid: 2-column dense layout (matching Instagram/Airbnb on mobile)
      // 96px per card = ~2 cards per 375px viewport with 12px gaps
      gridTemplateColumns: {
        // Mobile: 2-column dense grid
        'dense-mobile': 'repeat(2, minmax(88px, 1fr))',
        // Tablet: 3-column
        'dense-tablet': 'repeat(3, minmax(120px, 1fr))',
        // Desktop: 4-column
        'dense-desktop': 'repeat(4, minmax(160px, 1fr))',
      },
      spacing: {
        // Optimized for 2-column mobile layouts
        'card-gap': '0.75rem',  // Gap between cards (12px)
        'card-mobile': '88px',  // Card width on mobile (2-column @ 375px)
      },
    },
  },
  // Safelist for Mapbox GL CSS classes (prevents purging of dynamic map styles)
  safelist: [
    {
      pattern: /^mapboxgl-/,
    },
  ],
  plugins: [],
}
