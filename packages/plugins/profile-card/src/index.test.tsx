// @vitest-environment happy-dom
import { render } from 'preact'
import { describe, expect, test } from 'vitest'
import ProfileCard from './index'

const ctx = {
  appId: 'ethtokyo.kon.xyz',
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- minimal context stub
  deployment: {} as any,
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- wallet not used by this plugin
  wallet: {} as any
}

function html(props: Record<string, unknown>): string {
  const host = document.createElement('div')
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- plugin contract
  render(ProfileCard({ props, context: ctx }) as any, host)
  return host.innerHTML
}

describe('ProfileCard branded variant', () => {
  test('renders the logo image when logoUrl is set', () => {
    const out = html({ title: 'ETHTokyo', logoUrl: 'https://example.com/o.png' })
    expect(out).toContain('https://example.com/o.png')
  })

  test('renders the identity label when identity is set', () => {
    const out = html({ title: 'ETHTokyo', identity: { label: 'caffein.base.eth' } })
    expect(out).toContain('caffein.base.eth')
  })

  test('renders a QR affordance when showQr is true', () => {
    const out = html({ title: 'ETHTokyo', identity: { label: 'caffein.base.eth' }, showQr: true })
    expect(out.toLowerCase()).toContain('qr')
  })
})
