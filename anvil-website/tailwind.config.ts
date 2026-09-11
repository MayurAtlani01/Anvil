import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        anvil: {
          bg: '#111111',
          bgSecondary: '#1B1B1B',
          card: '#1D1D1D',
          border: '#2A2A2A',
          borderSubtle: '#222222',
          coral: '#FF6B5A',
          coralHover: '#FF7A6A',
          coralActive: '#FF5A48',
          textPrimary: '#F5F5F5',
          textSecondary: '#A7A7A7',
          textMuted: '#737373',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        handwritten: ['Caveat', 'Caveat Brush', 'cursive'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        coral: '0 0 24px rgba(255, 107, 90, 0.25)',
        coralGlow: '0 0 40px rgba(255, 107, 90, 0.2)',
        card: '0 20px 48px -8px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
