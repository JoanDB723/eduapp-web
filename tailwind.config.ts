import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:   '#0D2118',
          DEFAULT:'#1A4731',
          medium: '#2D6A4F',
          light:  '#52B788',
        },
        accent: {
          DEFAULT: '#C9A84C',
          light:   '#F0D58C',
        },
      },
    },
  },
  plugins: [],
};

export default config;
