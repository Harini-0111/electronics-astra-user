/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Sora', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: '#0c1021',
        surface: 'rgba(255,255,255,0.08)',
        'surface-strong': 'rgba(255,255,255,0.14)',
        primary: '#7c3aed',
        primary2: '#2563eb',
        accent: '#3ddbf0',
        success: '#34d399',
        warning: '#f59e0b',
        danger: '#f87171',
        muted: '#9ca3af',
      },
      boxShadow: {
        glass: '0 8px 30px rgba(0,0,0,0.45)',
        soft: '8px 8px 16px rgba(0,0,0,0.35), -6px -6px 14px rgba(255,255,255,0.06)',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
      },
      backdropBlur: {
        glass: '12px',
      },
      backgroundImage: {
        'grad-hero': 'linear-gradient(135deg, #7c3aed 0%, #2563eb 45%, #0ea5e9 100%)',
        'grad-card': 'linear-gradient(145deg, rgba(124,58,237,0.14) 0%, rgba(37,99,235,0.12) 50%, rgba(14,165,233,0.08) 100%)',
      },
    },
  },
  plugins: [],
};
