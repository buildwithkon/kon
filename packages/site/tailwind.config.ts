import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  darkMode: ['class'],
  content: ['./app/**/*.tsx'],
  theme: {
    fontFamily: {
      mono: ['"Space Mono"', ...defaultTheme.fontFamily.mono]
    },
    extend: {}
  }
} satisfies Config
