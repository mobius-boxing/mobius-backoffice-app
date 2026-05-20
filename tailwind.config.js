/** @type {import('tailwindcss').Config} */

// Wrap an OKLCH token (stored in index.css as space-separated "L C H") so that
// Tailwind's opacity utilities (e.g. bg-primary-600/30) keep working.
const t = (name) => `oklch(var(${name}) / <alpha-value>)`;

const ramp = (key, shades) =>
  shades.reduce((acc, s) => ({ ...acc, [s]: t(`--${key}-${s}`) }), {});

const NEUTRAL = ramp('n', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
const SEM = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        white: t('--white'),
        black: t('--black'),
        canvas: t('--canvas'),

        // Brand accent (ochre)
        primary: ramp('p', SEM),

        // Warm graphite neutral — drives both `secondary` and default `gray`
        secondary: NEUTRAL,
        gray: NEUTRAL,
        neutral: NEUTRAL,
        slate: NEUTRAL,

        // Semantic status scales, harmonized in OKLCH
        red: ramp('red', SEM),
        rose: ramp('red', SEM),
        green: ramp('green', SEM),
        emerald: ramp('green', SEM),
        amber: ramp('amber', SEM),
        yellow: ramp('amber', SEM),
        blue: ramp('blue', SEM),
        sky: ramp('blue', SEM),
        indigo: ramp('blue', SEM),
        orange: ramp('orange', SEM),
        purple: ramp('purple', SEM),
        violet: ramp('purple', SEM),
        fuchsia: ramp('purple', SEM),
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 oklch(var(--n-950) / 0.05)',
        DEFAULT:
          '0 1px 2px 0 oklch(var(--n-950) / 0.05), 0 1px 3px 0 oklch(var(--n-950) / 0.06)',
        md: '0 2px 4px -1px oklch(var(--n-950) / 0.06), 0 6px 12px -2px oklch(var(--n-950) / 0.08)',
        lg: '0 4px 6px -2px oklch(var(--n-950) / 0.06), 0 14px 24px -6px oklch(var(--n-950) / 0.10)',
        xl: '0 10px 15px -4px oklch(var(--n-950) / 0.08), 0 28px 44px -10px oklch(var(--n-950) / 0.14)',
      },
      ringColor: {
        DEFAULT: t('--p-500'),
      },
      ringOffsetColor: {
        DEFAULT: t('--white'),
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scaleIn 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slideUp 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in': 'slideIn 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
