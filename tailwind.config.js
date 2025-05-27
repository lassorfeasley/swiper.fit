/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        'light-balck': '#4B6584',
        'black': '#2F3640',
        'white': '#FFF',
      },
      fontSize: {
        'h1': '20px',
        'h2': '16px',
        'metric': '12px',
      },
      fontWeight: {
        'h1': '500',
        'h2': '400',
        'metric': '700',
      },
      lineHeight: {
        'h1': '20px',
        'h2': '16px',
        'metric': '12px',
      },
    },
  },
  plugins: [],
} 