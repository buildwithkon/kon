// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { sanitizeSvg } from './sanitize-svg'

describe('sanitizeSvg', () => {
  test('keeps a clean path-only svg and normalizes size to 1em', () => {
    const out = sanitizeSvg('<svg viewBox="0 0 24 24" width="40"><path d="M0 0h24v24H0z"/></svg>')
    expect(out).toContain('<svg')
    expect(out).toContain('<path')
    expect(out).toContain('width="1em"')
    expect(out).toContain('height="1em"')
  })

  test('strips <script> elements', () => {
    const out = sanitizeSvg('<svg viewBox="0 0 24 24"><script>alert(1)</script><path d="M0 0"/></svg>')
    expect(out.toLowerCase()).not.toContain('<script')
    expect(out).toContain('<path')
  })

  test('strips on* event handler attributes', () => {
    const out = sanitizeSvg('<svg viewBox="0 0 24 24"><path d="M0 0" onclick="evil()"/></svg>')
    expect(out.toLowerCase()).not.toContain('onclick')
  })

  test('strips javascript: hrefs', () => {
    const out = sanitizeSvg('<svg viewBox="0 0 24 24"><a href="javascript:evil()"><path d="M0 0"/></a></svg>')
    expect(out.toLowerCase()).not.toContain('javascript:')
  })

  test('returns empty string for non-svg / garbage input', () => {
    expect(sanitizeSvg('not an svg')).toBe('')
    expect(sanitizeSvg('')).toBe('')
  })
})
