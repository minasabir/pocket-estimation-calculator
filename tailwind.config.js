/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          0: '#0b1f18',
          1: '#123328',
          2: '#1a4536',
        },
        gold: {
          DEFAULT: '#c99a3e',
          bright: '#e6bb5c',
        },
        cardbg: '#f6f1e4',
        ink: {
          DEFAULT: '#1c2420',
          dim: '#5c6a62',
        },
        spade: '#20241f',
        heart: '#a8334c',
        diamond: '#c47a2c',
        club: '#2f6b4f',
        win: '#3f8f5f',
        loss: '#a8334c',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SF Mono', 'Cascadia Mono', 'Menlo', 'Consolas', 'monospace'],
        serif: ['Georgia', 'Iowan Old Style', 'Palatino Linotype', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
