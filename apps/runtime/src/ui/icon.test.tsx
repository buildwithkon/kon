// @vitest-environment happy-dom
/** @jsxImportSource preact */
import { render } from 'preact'
import { describe, expect, test } from 'vitest'
import { ICON_NAMES, Icon } from './icon'

function html(node: ReturnType<typeof Icon>): string {
  const host = document.createElement('div')
  // biome-ignore lint/suspicious/noExplicitAny: vnode host render
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
})
