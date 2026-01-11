/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Toss-style colors
        primary: {
          DEFAULT: '#3182F6',
          50: '#EBF4FF',
          100: '#DBEAFE',
          500: '#3182F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        background: '#F4F5F7',
        surface: '#FFFFFF',
        text: {
          primary: '#191F28',
          secondary: '#8B95A1',
          tertiary: '#B0B8C1',
        },
        border: {
          DEFAULT: '#E5E8EB',
          light: '#F2F4F6',
        },
        success: '#00C853',
        warning: '#FF9100',
        error: '#F44336',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs: ['13px', '18px'],
        sm: ['15px', '22px'],
        base: ['17px', '26px'],
        lg: ['20px', '28px'],
        xl: ['24px', '32px'],
        '2xl': ['28px', '36px'],
        '3xl': ['32px', '40px'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.04)',
        elevated: '0 4px 16px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
