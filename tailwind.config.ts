import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#0a0a0a',
        'charcoal-light': '#111111',
        gold: '#FFD700',
        amber: {
          500: '#FF8C00',
          600: '#FF6B00',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'shimmer': 'shimmer 2s infinite',
        'spin': 'spin 0.8s linear infinite',
        'gold-line': 'goldLine 3s infinite',
      },
      backdropBlur: {
        xl: '20px',
      },
      boxShadow: {
        'gold': '0 0 20px rgba(255, 215, 0, 0.1)',
        'gold-intense': '0 0 40px rgba(255, 215, 0, 0.2)',
      },
    },
  },
  plugins: [],
} satisfies Config;