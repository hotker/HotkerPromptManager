/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Future Tech Palette
        cyber: {
          bg: '#030508', // Deep space black
          panel: '#0a0f16', // Dark blue-ish grey
          primary: '#00f0ff', // Neon Cyan
          secondary: '#7000ff', // Neon Purple
          accent: '#ff2a6d', // Glitch Red/Pink
          text: '#e0f7fa', // Pale Cyan White
          dim: 'rgba(0, 240, 255, 0.1)',
        },
        banana: {
          500: '#f38020', // Keep for brand continuity but use sparingly
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"Rajdhani"', 'Inter', 'system-ui', 'sans-serif'], // Rajdhani is great for sci-fi, falling back to Inter
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
          '0%, 100%': { opacity: 1, boxShadow: '0 0 10px #00f0ff' },
          '50%': { opacity: .5, boxShadow: '0 0 20px #00f0ff' },
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