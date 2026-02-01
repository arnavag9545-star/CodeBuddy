/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'editor-bg': '#1e1e2e',
        'panel-bg': '#181825',
        'accent': '#89b4fa',
        'accent-hover': '#b4befe',
        'success': '#a6e3a1',
        'error': '#f38ba8',
        'warning': '#fab387',
        'text-primary': '#cdd6f4',
        'text-secondary': '#a6adc8',
        'border': '#313244',
      },
      fontFamily: {
        'code': ['JetBrains Mono', 'monospace'],
        'ui': ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'pulse-slow': 'pulse 2s infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
