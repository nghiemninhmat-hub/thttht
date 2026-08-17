/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Chonburi', 'serif'],
        display: ['Playfair Display', 'Chonburi', 'serif'],
        hero: ['Playfair Display', 'Chonburi', 'serif'],
        script: ['Chonburi', 'Playfair Display', 'serif'],
        signature: ['Chonburi', 'Playfair Display', 'serif'],
        brush: ['Chonburi', 'Playfair Display', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse-slow 8s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
