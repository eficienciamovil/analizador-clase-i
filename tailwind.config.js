/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        army: {
          50: '#f0f4f0',
          100: '#d9e4d9',
          200: '#b3c9b3',
          300: '#8aad8a',
          400: '#5f8f5f',
          500: '#3d6b3d',
          600: '#2d5a2d',
          700: '#1e4a1e',
          800: '#143314',
          900: '#0a1f0a',
        }
      }
    },
  },
  plugins: [],
}
