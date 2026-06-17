// @vitest-environment happy-dom
/** @jsxImportSource preact */
import { render } from 'preact'
import { describe, expect, test } from 'vitest'
import { ICON_NAMES, Icon } from './icon'

function html(node: ReturnType<typeof Icon>): string {
  const host = document.createElement('div')
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- vnode host render
  render(node as any, host)
  return host.innerHTML
}

describe('Icon', () => {
  test('every name renders an <svg>', () => {
    for (const name of ICON_NAMES) {
      expect(html(Icon({ name }))).toContain('<svg')
    }
  })

  test('applies the given size to width/height', () => {
    expect(html(Icon({ name: 'home', size: 28 }))).toContain('width="28"')
  })

  test('filled variant renders a solid (fill) icon; stroke variant does not', () => {
    expect(html(Icon({ name: 'home', filled: true }))).toContain('fill="currentColor"')
    expect(html(Icon({ name: 'home' }))).toContain('stroke="currentColor"')
  })

  test('falls back to the stroke icon when no filled variant exists (list)', () => {
    expect(html(Icon({ name: 'list', filled: true }))).toContain('stroke="currentColor"')
  })
})
