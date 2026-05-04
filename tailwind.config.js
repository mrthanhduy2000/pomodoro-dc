/** @type {import('tailwindcss').Config} */
export default {
  // Scan all source files for Tailwind class names
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      colors: {
        // Era accent colors available as Tailwind tokens
        'era-1': '#4ade80',  // Book 1 - Geological (green)
        'era-2': '#f59e0b',  // Book 2 - Civilisation (amber)
        'era-3': '#818cf8',  // Book 3 - Industrial (indigo)
      },
    },
  },
  plugins: [],
};
