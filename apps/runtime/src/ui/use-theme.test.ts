import { describe, expect, test } from 'vitest'
import { readableOn, themeVars } from './use-theme'

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

  test('emits auto-contrast foregrounds for main + accent', () => {
    const v = themeVars({ main: '#562266', accent: '#FFEB3B' })
    expect(v['--kon-on-main']).toBe('#ffffff') // white on dark purple
    expect(v['--kon-on-accent']).toBe('#16151a') // dark on light yellow
  })
})

describe('readableOn', () => {
  test('white on dark colors, dark on light colors', () => {
    expect(readableOn('#562266')).toBe('#ffffff')
    expect(readableOn('#111111')).toBe('#ffffff')
    expect(readableOn('#FFEB3B')).toBe('#16151a')
    expect(readableOn('#ffffff')).toBe('#16151a')
  })

  test('supports 3-digit hex and a leading-#-less value', () => {
    expect(readableOn('#fff')).toBe('#16151a')
    expect(readableOn('000')).toBe('#ffffff')
  })

  test('falls back to white for unparseable colors', () => {
    expect(readableOn('rebeccapurple')).toBe('#ffffff')
    expect(readableOn('linear-gradient(...)')).toBe('#ffffff')
  })
})
