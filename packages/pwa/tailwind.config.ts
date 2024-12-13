import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  darkMode: ['class'],
  content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
  safelist: ['font-sans', 'font-serif', 'font-mono', 'font-dot'],
  theme: {
    fontFamily: {
      sans: ['"Mona Sans"', ...defaultTheme.fontFamily.sans],
      serif: ['"Source Serif 4"', ...defaultTheme.fontFamily.serif],
      mono: ['"Space Mono"', ...defaultTheme.fontFamily.mono],
      dot: ['DotGothic16', ...defaultTheme.fontFamily.mono]
    },
    extend: {
      boxShadow: {
        'top-2xl': '0px -25px 30px -25px rgb(0 0 0 / 0.25)'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        main: 'var(--c-main)',
        'main-fg': 'var(--c-main-fg)',
        sub1: '#f1f1f1',
        sub2: '#c7c7c7'
      },
      screens: {
        xs: '430px'
      },
      animation: {
        'spin-slow': 'spin 1.8s linear infinite'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
} satisfies Config
