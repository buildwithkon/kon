import { describe, expect, test } from 'vitest'
import { themeVars } from './use-theme'

describe('themeVars', () => {
  test('maps theme to CSS variables + font family', () => {
    const v = themeVars({ main: '#562266', accent: '#FF5545', font: 'mono' })
    expect(v['--kon-main']).toBe('#562266')
    expect(v['--kon-accent']).toBe('#FF5545')
    expect(String(v.fontFamily)).toContain('mono')
  })

  test('falls back to blue defaults when theme is undefined', () => {
    const v = themeVars(undefined)
    expect(v['--kon-main']).toBe('#1a73e8')
    expect(v['--kon-accent']).toBe('#1a73e8')
  })
})
