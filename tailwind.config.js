/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '950px', // Adjust 'lg' breakpoint to 950px
      'xl': '1280px',
      'custom': '1500px', // Adjust 'custom' breakpoint if necessary
    },
  },
  plugins: [],
}