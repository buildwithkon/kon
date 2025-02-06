import { COLOR_HEX_DARK, COLOR_HEX_LIGHT } from '@konxyz/shared/lib/const'

export const hexToRgb = (
  hex: string,
  mode: 'obj' | 'str' = 'obj'
): { r: number; g: number; b: number } | string => {
  // remove `#`
  const _hex = hex.replace('#', '')

  const shorthand = _hex.length === 3
  const r = Number.parseInt(shorthand ? _hex[0] + _hex[0] : _hex.slice(0, 2), 16)
  const g = Number.parseInt(shorthand ? _hex[1] + _hex[1] : _hex.slice(2, 4), 16)
  const b = Number.parseInt(shorthand ? _hex[2] + _hex[2] : _hex.slice(4, 6), 16)

  return mode === 'obj' ? { r, g, b } : `${r} ${g} ${b}`
}

export const getFgColorFromBgColor = (mainColor: string): string => {
  const { r, g, b } = hexToRgb(mainColor)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance < 0.5 ? COLOR_HEX_LIGHT : COLOR_HEX_DARK
}

export const setAppColor = (mainColor: string | undefined): React.CSSProperties =>
  ({
    '--color-main': mainColor ?? '#C5F900',
    '--color-main-fg': getFgColorFromBgColor(mainColor ?? '#C5F900')
  }) as React.CSSProperties

export const setFontClass = (fontStyle: string | undefined = 'sans'): string => `font-${fontStyle}`
