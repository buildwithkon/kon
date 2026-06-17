import type { JSX } from 'preact'
import type { KonThemeV1 } from '@konxyz/runtime-core'

// 'sans' (the default) is the bundled Hanken Grotesk variable font loaded in
// main.tsx; apps can override to serif/mono via manifest theme.font.
const FONT_STACKS: Record<NonNullable<KonThemeV1['font']>, string> = {
  sans: '"Hanken Grotesk Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "SF Mono", "Cascadia Code", monospace'
}

const DEFAULT_MAIN = '#1a73e8'

/** Build a style object carrying theme CSS variables + font family for the app root. */
export function themeVars(theme: KonThemeV1 | undefined): JSX.CSSProperties {
  const main = theme?.main ?? DEFAULT_MAIN
  const accent = theme?.accent ?? DEFAULT_MAIN
  return {
    '--kon-main': main,
    '--kon-accent': accent,
    fontFamily: FONT_STACKS[theme?.font ?? 'sans']
    // biome-ignore lint/suspicious/noExplicitAny: CSS custom properties aren't in JSX.CSSProperties
  } as any
}
