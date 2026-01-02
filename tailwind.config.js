/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./functions/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Future Tech Palette - Lightened & Refined (Slate/Navy Base)
        cyber: {
          bg: '#0f172a', // Slate 900 - Rich Deep Blue/Grey (was #030508)
          panel: '#1e293b', // Slate 800 - Lighter panel background
          card: '#334155', // Slate 700 - Lighter card background
          primary: '#22d3ee', // Cyan 400 - Slightly brighter/softer cyan
          secondary: '#818cf8', // Indigo 400
          accent: '#f472b6', // Pink 400
          text: '#f1f5f9', // Slate 100 - High contrast white
          dim: 'rgba(34, 211, 238, 0.1)',
        },
        banana: {
          500: '#f97316', // Orange 500
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"Rajdhani"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'scan': 'scan 4s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 10px #22d3ee' },
          '50%': { opacity: .5, boxShadow: '0 0 20px #22d3ee' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}