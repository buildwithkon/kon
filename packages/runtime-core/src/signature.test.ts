import { describe, expect, test } from 'vitest'
import { canonicalize } from './signature'
import type { KonManifestV1 } from './types'

const baseManifest = (): Omit<KonManifestV1, 'signature'> => ({
  schema: 'kon-manifest-v1',
  app: {
    id: 'ethtokyo.kon.xyz',
    name: 'ETHTokyo',
    version: 1
  },
  pages: [],
  plugins: [],
  publishedAt: '2026-05-31T00:00:00.000Z',
  publisher: 'did:pkh:eip155:8453:0x0000000000000000000000000000000000000001'
})

describe('canonicalize', () => {
  test('produces stable output regardless of input key order', () => {
    const m = baseManifest()
    const a = canonicalize(m)
    // Reconstruct the same object with keys in reverse order to assert
    // canonicalize sorts them deterministically.
    const reordered: Omit<KonManifestV1, 'signature'> = {
      publisher: m.publisher,
      publishedAt: m.publishedAt,
      plugins: m.plugins,
      pages: m.pages,
      app: { version: m.app.version, name: m.app.name, id: m.app.id },
      schema: 'kon-manifest-v1'
    }
    const b = canonicalize(reordered)
    expect(a).toBe(b)
  })

  test('sorts nested object keys recursively', () => {
    const out = canonicalize({
      ...baseManifest(),
      app: {
        version: 1,
        name: 'X',
        id: 'x.kon.xyz',
        description: 'd'
      }
    } as Omit<KonManifestV1, 'signature'>)
    // After sorting, 'description' precedes 'id' precedes 'name' precedes 'version'.
    const appIndex = out.indexOf('"app":')
    const descIdx = out.indexOf('"description"', appIndex)
    const idIdx = out.indexOf('"id"', appIndex)
    const nameIdx = out.indexOf('"name"', appIndex)
    const verIdx = out.indexOf('"version"', appIndex)
    expect(descIdx).toBeLessThan(idIdx)
    expect(idIdx).toBeLessThan(nameIdx)
    expect(nameIdx).toBeLessThan(verIdx)
  })

  test('preserves array order (arrays are not sorted)', () => {
    const out = canonicalize({
      ...baseManifest(),
      pages: [
        { id: 'home', title: 'Home', plugins: [] },
        { id: 'about', title: 'About', plugins: [] }
      ]
    })
    const homeIdx = out.indexOf('"id":"home"')
    const aboutIdx = out.indexOf('"id":"about"')
    expect(homeIdx).toBeGreaterThan(-1)
    expect(aboutIdx).toBeGreaterThan(-1)
    expect(homeIdx).toBeLessThan(aboutIdx)
  })

  test('idempotent: canonicalize(parse(canonicalize(m))) === canonicalize(m)', () => {
    const m = baseManifest()
    const once = canonicalize(m)
    const twice = canonicalize(JSON.parse(once) as Omit<KonManifestV1, 'signature'>)
    expect(once).toBe(twice)
  })

  test('different content → different output', () => {
    const a = canonicalize(baseManifest())
    const b = canonicalize({ ...baseManifest(), app: { ...baseManifest().app, version: 2 } })
    expect(a).not.toBe(b)
  })

  test('handles deeply nested arrays + objects', () => {
    const out = canonicalize({
      ...baseManifest(),
      pages: [
        {
          id: 'home',
          title: 'Home',
          plugins: [
            {
              id: 'badge',
              version: '1.0.0',
              source: 'ipfs://bafybeibadge',
              props: { z: 1, a: 2 }
            }
          ]
        }
      ]
    })
    // props.a should appear before props.z (sorted)
    const aIdx = out.indexOf('"a":2')
    const zIdx = out.indexOf('"z":1')
    expect(aIdx).toBeGreaterThan(-1)
    expect(zIdx).toBeGreaterThan(-1)
    expect(aIdx).toBeLessThan(zIdx)
  })

  test('null + undefined survive JSON serialization rules', () => {
    const out = canonicalize({
      ...baseManifest(),
      app: { ...baseManifest().app, description: undefined }
    })
    // undefined fields drop out of JSON.stringify
    expect(out).not.toContain('"description"')
  })
})
