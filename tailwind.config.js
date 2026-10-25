/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { display: ['Montserrat', 'ui-sans-serif', 'system-ui', 'Arial', 'sans-serif'], sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'] },
      colors: {
        // Hancock Health, sampled from the official logo: orange #ef7724 (500) and charcoal #565757.
        // 600/700 are deeper oranges for buttons and links (white text passes contrast);
        // 800/900 are charcoal for the header, headings and dark panels.
        brand: { 50: '#fef4ec', 100: '#fde5d2', 200: '#fac7a1', 300: '#f6a66b', 400: '#f28c42', 500: '#ef7724', 600: '#bb5711', 700: '#a14b0f', 800: '#3f4040', 900: '#2b2c2c' },
      },
    },
  },
  plugins: [],
};
