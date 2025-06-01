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
        // All custom color extensions removed; use Tailwind's native palette
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