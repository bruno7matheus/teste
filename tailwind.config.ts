import type {Config} from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

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
        body: ['Montserrat', 'sans-serif'],
        headline: ['Montserrat', 'sans-serif'], // Changed to Montserrat
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsla(var(--card-rgb) / var(--card-alpha))', // For glass effect
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsla(var(--popover-rgb) / var(--popover-alpha))', // For glass effect
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border-rgb) / var(--border-alpha))', // Default border with alpha
        input: 'hsla(var(--input-rgb) / var(--input-alpha))', // For glass effect
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsla(var(--sidebar-rgb) / var(--sidebar-alpha))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))', // Text color for active item
          'primary-background': 'hsl(var(--sidebar-primary) / var(--sidebar-primary-background-alpha))', // Background for active item
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)', // 1.5rem (24px)
        md: 'calc(var(--radius) - 0.5rem)', // 1rem (16px)
        sm: 'calc(var(--radius) - 0.75rem)', // 0.75rem (12px)
        full: '9999px', // For stadium shape
      },
      boxShadow: {
        'btn-primary-glow': 'var(--btn-primary-glow)',
        'low': '0 4px 15px rgba(0,0,0,0.05)', // Subtle shadow for "low" elevation
      },
      transitionTimingFunction: {
        'ease-out-custom': 'cubic-bezier(0.25, 0.1, 0.25, 1)', // Example of easeOut
      },
      transitionDuration: {
        '250': '250ms',
      },
      backdropBlur: {
        'xl': 'var(--glass-blur)', // 20px
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
        'accordion-down': 'accordion-down 0.25s ease-out-custom',
        'accordion-up': 'accordion-up 0.25s ease-out-custom',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    plugin(function({ addUtilities, theme }) {
      const newUtilities = {
        '.shadow-glow-primary': {
          boxShadow: theme('boxShadow.btn-primary-glow'),
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    })
  ],
} satisfies Config;
