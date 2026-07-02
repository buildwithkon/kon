// @vitest-environment happy-dom
import { h, render } from 'preact'
import { describe, expect, test } from 'vitest'
import Ical from './index'

const events = [
  { id: 'a', title: '[Conf] Opening Talk', start: '2025-09-12T01:00:00Z', end: '2025-09-12T02:00:00Z' },
  { id: 'b', title: '[Hack] Entry', start: '2025-09-13T00:00:00Z', end: '2025-09-13T09:00:00Z' }
]

function html(props: Record<string, unknown>): string {
  const host = document.createElement('div')
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- plugin contract
  render(h(Ical as any, { props, context: {} as any }), host)
  return host.innerHTML
}

describe('Ical tags + tz', () => {
  test('renders the tag text as a pill and strips it from the title', () => {
    const out = html({ events })
    expect(out).toContain('Conf')
    expect(out).toContain('Opening Talk')
    expect(out).not.toContain('[Conf]')
  })

  test('formats time in the given tz (Asia/Tokyo -> 10:00 for 01:00Z)', () => {
    const out = html({ events, tz: 'Asia/Tokyo' })
    expect(out).toContain('10:00')
  })

  test('renders a day pill per event date', () => {
    const out = html({ events, tz: 'Asia/Tokyo' })
    expect(out).toContain('Sep 12')
    expect(out).toContain('Sep 13')
  })

  test('an invalid tz falls back gracefully instead of throwing', () => {
    // 'Invalid/Zone' makes Intl throw RangeError; safeTz must swallow it.
    const out = html({ events, tz: 'Invalid/Zone' })
    expect(out).toContain('Opening Talk')
    expect(out).toContain('Entry')
  })
})
