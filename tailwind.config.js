/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'Kanit', 'system-ui', 'sans-serif'],
        display: ['Kanit', 'Prompt', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'float-reverse': 'floatReverse 10s ease-in-out infinite',
        'spin-slow': 'spin 24s linear infinite',
        'spin-slower': 'spin 38s linear infinite reverse',
        'shimmer': 'shimmer 2.4s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'aurora-drift': 'auroraDrift 14s ease-in-out infinite',
        'bulb-blink': 'bulbBlink 1.4s ease-in-out infinite',
        'bulb-chase': 'bulbBlink 0.28s ease-in-out infinite',
        'sunburst': 'spin 18s linear infinite',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-16px) rotate(6deg)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(14px) rotate(-6deg)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-140%) skewX(-20deg)' },
          '100%': { transform: 'translateX(240%) skewX(-20deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.95', transform: 'scale(1.06)' },
        },
        auroraDrift: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(35px, -22px) scale(1.08)' },
          '66%': { transform: 'translate(-28px, 18px) scale(0.96)' },
        },
        bulbBlink: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
};
