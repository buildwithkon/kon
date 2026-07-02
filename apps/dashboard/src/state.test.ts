import { afterEach, beforeEach, describe, expect, test } from 'vitest'

// Use an in-memory localStorage shim so the tests stay deterministic
// across test files and don't leak state.
class MemoryStorage {
  private map = new Map<string, string>()
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
  clear() {
    this.map.clear()
  }
  get length() {
    return this.map.size
  }
  key(i: number) {
    return Array.from(this.map.keys())[i] ?? null
  }
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  // Test-only override; `globalThis` is loosely typed so direct assignment compiles.
  ;(globalThis as unknown as { localStorage?: MemoryStorage }).localStorage = storage
  // window also needed because state.ts (transitively) reads it via
  // deployment.ts on import.
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { hostname: 'localhost' } }
  })
})

afterEach(() => {
  delete (globalThis as unknown as { localStorage?: MemoryStorage }).localStorage
  Object.defineProperty(globalThis, 'window', { configurable: true, value: undefined })
})

describe('ownedApps localStorage round-trip', () => {
  test('loadOwnedApps returns empty when nothing stored', async () => {
    const { loadOwnedApps, ownedApps } = await import('./state')
    loadOwnedApps('0x1234567890123456789012345678901234567890')
    expect(ownedApps.value).toEqual([])
  })

  test('persistOwnedApps + loadOwnedApps round-trip', async () => {
    const { loadOwnedApps, persistOwnedApps, ownedApps } = await import('./state')
    const addr = '0x1234567890123456789012345678901234567890'
    const apps = [
      {
        id: 'ethtokyo.kon.xyz',
        name: 'ethtokyo',
        entryCid: 'bafy...',
        updatedAt: '2026-09-01T00:00:00Z'
      }
    ]
    persistOwnedApps(addr, apps)
    expect(ownedApps.value).toEqual(apps)
    // Round-trip via a fresh load (signal value should match storage).
    ownedApps.value = []
    loadOwnedApps(addr)
    expect(ownedApps.value).toEqual(apps)
  })

  test('storage key is namespaced by signer address (case-insensitive)', async () => {
    const { persistOwnedApps, loadOwnedApps, ownedApps } = await import('./state')
    const upper = '0xABCDEF1234567890123456789012345678901234'
    const lower = upper.toLowerCase() as `0x${string}`
    const apps = [{ id: 'a.kon.xyz', name: 'a', entryCid: null, updatedAt: '2026-09-01T00:00:00Z' }]
    persistOwnedApps(upper, apps)
    // Loading via the lowercase form retrieves the same record.
    loadOwnedApps(lower)
    expect(ownedApps.value).toEqual(apps)
  })

  test('recordNewApp appends + deduplicates by id', async () => {
    const { persistOwnedApps, recordNewApp, ownedApps } = await import('./state')
    const addr = '0x1111111111111111111111111111111111111111'
    persistOwnedApps(addr, [])

    recordNewApp(addr, { id: 'a.kon.xyz', name: 'a', entryCid: null, updatedAt: 't1' })
    recordNewApp(addr, { id: 'b.kon.xyz', name: 'b', entryCid: null, updatedAt: 't2' })
    expect(ownedApps.value.map((x) => x.id)).toEqual(['a.kon.xyz', 'b.kon.xyz'])

    // Re-recording an existing id replaces, not duplicates.
    recordNewApp(addr, { id: 'a.kon.xyz', name: 'A', entryCid: 'bafy...', updatedAt: 't3' })
    expect(ownedApps.value).toHaveLength(2)
    const reloaded = ownedApps.value.find((x) => x.id === 'a.kon.xyz')
    expect(reloaded?.entryCid).toBe('bafy...')
    expect(reloaded?.updatedAt).toBe('t3')
  })

  test('loadOwnedApps tolerates corrupt JSON in storage', async () => {
    const { loadOwnedApps, ownedApps } = await import('./state')
    storage.setItem('kon.dashboard.apps:0x1111111111111111111111111111111111111111', '{ not valid json')
    loadOwnedApps('0x1111111111111111111111111111111111111111')
    // Corrupt → empty array, no throw.
    expect(ownedApps.value).toEqual([])
  })

  test('loadOwnedApps tolerates non-array JSON in storage', async () => {
    const { loadOwnedApps, ownedApps } = await import('./state')
    storage.setItem(
      'kon.dashboard.apps:0x1111111111111111111111111111111111111111',
      JSON.stringify({ not: 'an array' })
    )
    loadOwnedApps('0x1111111111111111111111111111111111111111')
    expect(ownedApps.value).toEqual([])
  })

  test('signedAddress computed reflects signInState changes', async () => {
    const { signInState, signedAddress } = await import('./state')
    expect(signedAddress.value).toBeNull()
    signInState.value = {
      status: 'signed',
      address: '0xabcdef1234567890123456789012345678901234'
    }
    expect(signedAddress.value).toBe('0xabcdef1234567890123456789012345678901234')
    signInState.value = { status: 'idle' }
    expect(signedAddress.value).toBeNull()
  })
})
