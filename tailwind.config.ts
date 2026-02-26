import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['Source Code Pro', 'monospace'],
      },
      colors: {
        background: '#15191C',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: '#1E2327',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: '#1E2327',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: '#4DA7F7',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#2A3137',
          foreground: '#85D4EC',
        },
        muted: {
          DEFAULT: '#2A3137',
          foreground: '#94A3B8',
        },
        accent: {
          DEFAULT: '#85D4EC',
          foreground: '#15191C',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: '#2A3137',
        input: '#2A3137',
        ring: '#4DA7F7',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: '#111417',
          foreground: '#94A3B8',
          primary: '#4DA7F7',
          'primary-foreground': '#FFFFFF',
          accent: '#1E2327',
          'accent-foreground': '#4DA7F7',
          border: '#2A3137',
          ring: '#4DA7F7',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
