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

/**
 * Readable foreground (#fff or near-black) for a given background color, by WCAG
 * relative luminance. Colors are operator-configurable, so we can't assume white
 * text is legible on `main`/`accent` — compute it. Falls back to white for any
 * color we can't parse as #rgb/#rrggbb (named colors, gradients, etc.).
 */
export function readableOn(color: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return '#ffffff'
  const hex = m[1].length === 3 ? m[1].replace(/(.)/g, '$1$1') : m[1]
  const toLin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const r = toLin(Number.parseInt(hex.slice(0, 2), 16) / 255)
  const g = toLin(Number.parseInt(hex.slice(2, 4), 16) / 255)
  const b = toLin(Number.parseInt(hex.slice(4, 6), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.45 ? '#16151a' : '#ffffff'
}

/** Build a style object carrying theme CSS variables + font family for the app root. */
export function themeVars(theme: KonThemeV1 | undefined): JSX.CSSProperties {
  const main = theme?.main ?? DEFAULT_MAIN
  const accent = theme?.accent ?? DEFAULT_MAIN
  return {
    '--kon-main': main,
    '--kon-accent': accent,
    '--kon-on-main': readableOn(main),
    '--kon-on-accent': readableOn(accent),
    fontFamily: FONT_STACKS[theme?.font ?? 'sans']
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- CSS custom properties aren't in JSX.CSSProperties
  } as any
}
