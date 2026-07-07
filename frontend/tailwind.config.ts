import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const withOpacity = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        background: withOpacity('--background'),
        backgroundSubtle: withOpacity('--background-subtle'),
        backgroundMuted: withOpacity('--background-muted'),

        surface: withOpacity('--surface'),
        surfaceRaised: withOpacity('--surface-raised'),

        border: withOpacity('--border'),
        borderStrong: withOpacity('--border-strong'),

        textPrimary: withOpacity('--text-primary'),
        textSecondary: withOpacity('--text-secondary'),
        textTertiary: withOpacity('--text-tertiary'),
        textDisabled: withOpacity('--text-disabled'),

        accent: withOpacity('--accent'),
        accentHover: withOpacity('--accent-hover'),
        accentSubtle: withOpacity('--accent-subtle'),
        accentForeground: withOpacity('--accent-foreground'),

        success: withOpacity('--success'),
        successSubtle: withOpacity('--success-subtle'),
        warning: withOpacity('--warning'),
        warningSubtle: withOpacity('--warning-subtle'),
        danger: withOpacity('--danger'),
        dangerSubtle: withOpacity('--danger-subtle'),

        // shadcn/ui structural aliases (kept in sync with the tokens above
        // so hand-ported shadcn primitives compile without modification)
        input: withOpacity('--border'),
        ring: withOpacity('--accent'),
        foreground: withOpacity('--text-primary'),
        primary: {
          DEFAULT: withOpacity('--accent'),
          foreground: withOpacity('--accent-foreground'),
        },
        secondary: {
          DEFAULT: withOpacity('--background-muted'),
          foreground: withOpacity('--text-primary'),
        },
        destructive: {
          DEFAULT: withOpacity('--danger'),
          foreground: withOpacity('--accent-foreground'),
        },
        muted: {
          DEFAULT: withOpacity('--background-muted'),
          foreground: withOpacity('--text-secondary'),
        },
        accentMuted: {
          DEFAULT: withOpacity('--accent-subtle'),
          foreground: withOpacity('--accent'),
        },
        popover: {
          DEFAULT: withOpacity('--surface-raised'),
          foreground: withOpacity('--text-primary'),
        },
        card: {
          DEFAULT: withOpacity('--surface'),
          foreground: withOpacity('--text-primary'),
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        'glow-accent': 'var(--shadow-glow-accent)',
      },
      fontFamily: {
        sans: [
          'Geist Variable',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          'Geist Mono Variable',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'pulse-gradient': {
          '0%, 100%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'fade-out': 'fade-out 0.15s ease-out',
        'pulse-gradient': 'pulse-gradient 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
