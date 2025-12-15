/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Replaced Banana Yellow with Cloudflare Orange style
        banana: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f38020', // Cloudflare Brand Orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        zinc: {
          850: '#1f2025',
          950: '#0e0e10', // Darker, cleaner background
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'], // Cloudflare uses Inter/Sans primarily
      }
    },
  },
  plugins: [],
}