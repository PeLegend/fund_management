import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        revolut: {
          // Canvas
          'canvas-dark': '#000000',
          'canvas-light': '#ffffff',
          bg: '#ffffff', // catalog canvas background
          
          // Surfaces
          surface: '#ffffff',
          'surface-soft': '#f4f4f4',
          'surface-elevated': '#16181a',
          'surface-deep': '#0a0a0a',
          
          // Primary Brand
          primary: '#494fdf', // Cobalt violet
          'primary-bright': '#4f55f1',
          'primary-deep': '#3a40c4',
          'primary-hover': '#3a40c4', // mapping for hover logic
          'on-primary': '#ffffff',
          
          // Dividers / Hairlines
          border: '#e2e2e7', // hairline-light mapping
          'hairline-light': '#e2e2e7',
          'hairline-dark': 'rgba(255,255,255,0.12)',
          'hairline-strong': '#191c1f',
          'divider-soft': 'rgba(255,255,255,0.06)',
          
          // Light Text
          text: '#191c1f', // ink
          ink: '#191c1f',
          body: '#1f2226',
          charcoal: '#3a3d40',
          'text-secondary': '#505a63', // mute mapping
          mute: '#505a63',
          ash: '#5c5e60',
          stone: '#8d969e',
          faint: '#c9c9cd',
          
          // Dark Text
          'on-dark': '#ffffff',
          'on-dark-mute': 'rgba(255,255,255,0.72)',
          
          // Product Accent Palette
          teal: '#00a87e',
          'blue-link': '#376cd5',
          'light-blue': '#007bc2',
          'light-green': '#428619',
          'green-text': '#006400',
          yellow: '#b09000',
          warning: '#ec7e00',
          pink: '#e61e49',
          danger: '#e23b4a',
          'deep-red': '#8b0000',
          brown: '#936d62',
          success: '#34c759', // fallback compatibility
          error: '#e23b4a', // mapping to danger
        },
      },
      borderRadius: {
        card: '20px',    // rounded.lg (20px)
        input: '12px',   // rounded.md (12px)
        button: '9999px', // rounded.full (9999px)
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '28px',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

