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
      },
      colors: {
        'heading-black': '#2F3640',
      },
      fontSize: {
        'heading': '25px',
        'metric': '16px',
      },
      lineHeight: {
        'metric': '15px',
      },
      fontWeight: {
        'metric': '500',
      },
    },
  },
  plugins: [],
} 