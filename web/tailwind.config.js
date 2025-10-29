/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ocean': {
          50: '#e6f7f9',
          100: '#b3e7ed',
          200: '#80d7e1',
          300: '#4dc7d5',
          400: '#1ab7c9',
          500: '#17a2b8',
          600: '#138b9e',
          700: '#0f7483',
          800: '#0b5d69',
          900: '#07464f',
        },
        'tentacle': {
          light: '#4ecdc4',
          DEFAULT: '#17a2b8',
          dark: '#138b9e',
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'wave': 'wave 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}
