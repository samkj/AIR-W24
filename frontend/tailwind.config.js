/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          '0%': { width: '3.5rem' },
          '100%': { width: '450px' },
        },
        slideOut: {
          '0%': { width: '450px' },
          '100%': { width: '3.5rem' },
        },
      },
      animation: {
        slideIn: 'slideIn 300ms ease-in-out',
        slideOut: 'slideOut 300ms ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-primeui')]
}

