/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './data/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9e9ff',
          200: '#b5d4ff',
          300: '#8dbdff',
          400: '#5a9bff',
          500: '#387dff',
          600: '#1f5fe6',
          700: '#1449b4',
          800: '#103b8c',
          900: '#0f356f',
        },
      },
    },
  },
  plugins: [],
};
