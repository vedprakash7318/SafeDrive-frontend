/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#E94E1A',
          green: '#259A3A',
          blue: '#1D56A5',
          bg: '#E9DFEE',
        }
      }
    },
  },
  plugins: [],
}
