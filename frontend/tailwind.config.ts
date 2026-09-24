import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        brand: {
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          200: 'hsl(var(--brand-200))',
          300: 'hsl(var(--brand-300))',
          400: 'hsl(var(--brand-400))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          800: 'hsl(var(--brand-800))',
          900: 'hsl(var(--brand-900))',
          950: 'hsl(var(--brand-950))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        gold: {
          DEFAULT: 'hsl(var(--gold))',
          foreground: 'hsl(var(--gold-foreground))',
          50: 'hsl(var(--gold-50))',
          100: 'hsl(var(--gold-100))',
          200: 'hsl(var(--gold-200))',
          300: 'hsl(var(--gold-300))',
          400: 'hsl(var(--gold-400))',
          500: 'hsl(var(--gold-500))',
          600: 'hsl(var(--gold-600))',
          700: 'hsl(var(--gold-700))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': 'var(--radius-2xl)',
        xl2: '1rem',
        xl3: '1.375rem',
        '4xl': 'var(--radius-4xl)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.05)',
        pop: '0 12px 32px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.05)',
        soft: '0 6px 24px -8px rgba(15, 23, 42, 0.10)',
        lift: '0 24px 48px -16px rgba(15, 23, 42, 0.18)',
        glow: '0 0 0 1px hsl(var(--primary) / 0.08), 0 8px 40px -8px hsl(var(--primary) / 0.5)',
        'glow-lg': '0 0 0 1px hsl(var(--primary) / 0.10), 0 16px 60px -12px hsl(var(--primary) / 0.55)',
        'ring-gold': '0 0 0 1px hsl(var(--gold) / 0.45), 0 14px 44px -10px hsl(var(--gold) / 0.55)',
        'pill': '0 8px 30px -10px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.05)',
        'header': '0 1px 0 rgba(15, 23, 42, 0.06)',
        'floating-pill': '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'mega': '0 12px 32px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.05)',
        'focus-ring': '0 0 0 4px rgba(26, 86, 219, 0.10)',
      },
      fontSize: {
        display: [
          'clamp(2.5rem, 1.2rem + 4vw, 4.25rem)',
          {
            lineHeight: '1.04',
            letterSpacing: '-0.035em',
            fontWeight: '700',
          },
        ],
        'display-sm': [
          'clamp(1.9rem, 1.2rem + 2.5vw, 3rem)',
          { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' },
        ],
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-comfortaa)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'spring-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'marquee': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shine: {
          '0%': { transform: 'translateX(-150%)', opacity: '0' },
          '30%': { opacity: '0.9' },
          '60%': { opacity: '0.9' },
          '100%': { transform: 'translateX(150%)', opacity: '0' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -10px, 0)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
          '50%': { transform: 'translate3d(0, -14px, 0) rotate(0.6deg)' },
        },
        'badge-reveal': {
          '0%': { transform: 'scale(0.85) rotate(-6deg)', opacity: '0' },
          '60%': { transform: 'scale(1.04) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'slide-down-pill': {
          '0%': { transform: 'translate(-50%, -80px)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        'slide-up-pill': {
          '0%': { transform: 'translate(-50%, 0)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -80px)', opacity: '0' },
        },
        'slide-up-sheet': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 6s ease infinite',
        marquee: 'marquee 40s linear infinite',
        shine: 'shine 3s ease-in-out infinite',
        drift: 'drift 8s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'badge-reveal': 'badge-reveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-down-pill': 'slide-down-pill 350ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up-pill': 'slide-up-pill 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up-sheet': 'slide-up-sheet 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    plugin(function ({ addUtilities, addBase }) {
      addBase({
        ':root': {
          '--scrollbar-width': '10px',
        },
      });
      addUtilities({
        '.glass': {
          'background-color': 'hsl(var(--card) / 0.6)',
          'backdrop-filter': 'blur(16px) saturate(160%)',
          '-webkit-backdrop-filter': 'blur(16px) saturate(160%)',
        },
        '.glass-strong': {
          'background-color': 'hsl(var(--card) / 0.85)',
          'backdrop-filter': 'blur(24px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(24px) saturate(180%)',
        },
        '.bg-glass-pill': {
          'background-color': 'rgba(255, 255, 255, 0.85)',
          'backdrop-filter': 'blur(12px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(12px) saturate(180%)',
        },
        '.text-comfortaa': {
          'font-family': 'var(--font-comfortaa), var(--font-inter), system-ui, sans-serif',
        },
      });
    }),
  ],
};

export default config;
