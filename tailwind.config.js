/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#F5EFE6',
        'parchment-light': '#FBF8F3',
        'parchment-dark': '#EBE0CE',
        espresso: '#2C1A0E',
        'espresso-mid': '#5C3D20',
        'espresso-light': '#8B6E52',
        amber: '#C47A3C',
        'amber-light': '#E09A5C',
        sage: '#7B9B6E',
        'warm-border': '#E8DFCF',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        ui: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
