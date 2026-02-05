import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx,js,json}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: [
          'ui-serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif'
        ],
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Liberation Sans',
          'sans-serif'
        ]
      },
      letterSpacing: {
        'quiet': '0.01em'
      },
      boxShadow: {
        'soft': '0 6px 24px rgba(0, 0, 0, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
