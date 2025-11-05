/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', "sans-serif"],
      },
      fontWeight: {
        medium: '400',
        bold: '500',
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontSize: {
        h1: "20px",
        h2: "16px",
        metric: "12px",
        "heading-lg": "1.25rem",
        "heading-md": "1.125rem",
        "heading-sm": "0.875rem",
        body: "1rem",
        label: "0.875rem",
        caption: "0.75rem",
      },
      lineHeight: {
        h1: "20px",
        h2: "16px",
        metric: "12px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "blink": {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "blink": "blink 1s step-end infinite",
      },
      boxShadow: {
        'calendar-selected': '0px 0px 8.3px 0px rgba(2,6,24,0.40)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addComponents }) {
      addComponents({
        ".text-h1": {
          fontSize: "20px",
          fontWeight: "500",
          lineHeight: "20px",
          fontFamily: "Be Vietnam Pro, sans-serif",
        },
        ".text-h2": {
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "16px",
          fontFamily: "Be Vietnam Pro, sans-serif",
        },
        ".text-metric": {
          fontSize: "12px",
          fontWeight: "700",
          lineHeight: "12px",
          fontFamily: "Be Vietnam Pro, sans-serif",
        },
        ".text-body": {
          fontSize: "1rem",
          fontWeight: "400",
          fontFamily: "Be Vietnam Pro, sans-serif",
        },
        ".text-label": {
          fontSize: "0.875rem",
          fontWeight: "500",
          fontFamily: "Be Vietnam Pro, sans-serif",
        },
        ".text-caption": {
          fontSize: "0.75rem",
          fontWeight: "400",
          fontFamily: "Be Vietnam Pro, sans-serif",
        },
        ".text-heading-lg": {
          fontSize: "1.25rem",
          fontWeight: "500",
          fontFamily: "Be Vietnam Pro, sans-serif",
        },
        ".text-heading-md": {
          fontSize: "1.125rem",
          fontWeight: "500",
          fontFamily: "Be Vietnam Pro, sans-serif",
        },
        ".text-heading-sm": {
          fontSize: "0.875rem",
          fontWeight: "500",
          fontFamily: "Be Vietnam Pro, sans-serif",
        },
      });
    },
  ],
};
