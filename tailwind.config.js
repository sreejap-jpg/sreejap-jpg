/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#E8EEF5',
          100: '#D1DCE9',
          200: '#A3B8D2',
          300: '#7594BC',
          400: '#4770A6',
          500: '#14335A',
          600: '#112B4D',
          700: '#0E2440',
          800: '#0A1A33',
          900: '#071226',
        },
        gold: {
          50: '#FBF3DC',
          100: '#F5E7B8',
          200: '#EDCF71',
          300: '#E5BD4F',
          400: '#D4A037',
          500: '#B8882E',
          600: '#946E26',
          700: '#6E531D',
          800: '#493814',
          900: '#241C0A',
        },
        cream: {
          50: '#FDFCF8',
          100: '#FAF6ED',
          200: '#F5EFD9',
          300: '#EFE4C0',
          400: '#E8D6A3',
          500: '#DCC57E',
        },
        ink: {
          50: '#F6F5F2',
          100: '#E8E5DF',
          200: '#C9C4BA',
          300: '#9A9388',
          400: '#6B6457',
          500: '#3D362A',
          600: '#2E281F',
          700: '#1F1B14',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', '"DejaVu Sans"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '68ch',
      },
      boxShadow: {
        book: '0 4px 12px rgba(20, 51, 90, 0.12), 0 1px 3px rgba(20, 51, 90, 0.08)',
        'book-hover': '0 12px 28px rgba(20, 51, 90, 0.18), 0 4px 8px rgba(20, 51, 90, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
