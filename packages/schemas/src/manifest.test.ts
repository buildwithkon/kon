import { describe, expect, test } from 'vitest'
import { KonManifestV1Schema } from './manifest'

const base = {
  schema: 'kon-manifest-v1' as const,
  app: { id: 'x.kon.xyz', name: 'X', version: 1 },
  pages: [{ id: 'home', title: 'Home' }],
  publishedAt: '2026-01-01T00:00:00Z',
  publisher: 'did:pkh:eip155:8453:0x0000000000000000000000000000000000000000'
}

describe('KonManifestV1Schema theme + icon', () => {
  test('accepts app.theme and page.icon', () => {
    const out = KonManifestV1Schema.parse({
      ...base,
      app: { ...base.app, theme: { main: '#562266', accent: '#FF5545', font: 'sans' } },
      pages: [{ id: 'home', title: 'Home', icon: 'home' }]
    })
    expect(out.app.theme?.main).toBe('#562266')
    expect(out.pages[0].icon).toBe('home')
  })

  test('still accepts a manifest with neither field (back-compat)', () => {
    expect(() => KonManifestV1Schema.parse(base)).not.toThrow()
  })

  test('rejects an unknown icon name', () => {
    expect(() =>
      KonManifestV1Schema.parse({ ...base, pages: [{ id: 'home', title: 'Home', icon: 'rocket' }] })
    ).toThrow()
  })

  test('rejects an unknown theme font', () => {
    expect(() =>
      KonManifestV1Schema.parse({
        ...base,
        app: { ...base.app, theme: { main: '#fff', accent: '#000', font: 'comic-sans' } }
      })
    ).toThrow()
  })

  test('accepts a custom { svg } page icon', () => {
    const out = KonManifestV1Schema.parse({
      ...base,
      pages: [{ id: 'home', title: 'Home', icon: { svg: '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>' } }]
    })
    expect((out.pages[0].icon as { svg: string }).svg).toContain('<svg')
  })

  test('rejects a custom icon object without svg', () => {
    expect(() =>
      KonManifestV1Schema.parse({ ...base, pages: [{ id: 'home', title: 'Home', icon: {} }] })
    ).toThrow()
  })
})
