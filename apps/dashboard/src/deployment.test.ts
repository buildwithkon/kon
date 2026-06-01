import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { KON_DEFAULTS } from '@konxyz/runtime-core'

// stub window.location for each test scenario
function setHostname(hostname: string) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { hostname } }
  })
}

function clearWindow() {
  // Reset to a state where typeof window === 'undefined' (the SSR/Node path)
  Object.defineProperty(globalThis, 'window', { configurable: true, value: undefined })
}

describe('resolveDashboardDeployment', () => {
  beforeEach(() => {
    // Each test scenario starts with a fresh module + fresh window.
    vi.resetModules()
  })

  afterEach(() => {
    clearWindow()
  })

  test('returns KON-managed defaults when window is undefined (SSR / Node)', async () => {
    clearWindow()
    const { resolveDashboardDeployment } = await import('./deployment')
    const d = resolveDashboardDeployment()
    expect(d.wallet_origin).toBe(KON_DEFAULTS.wallet_origin)
    expect(d.ens_domain).toBe(KON_DEFAULTS.ens_domain)
    expect(d.ipfs_pin_endpoint).toBe(KON_DEFAULTS.ipfs_pin_endpoint)
  })

  test('derives self-host fields from my.<root> hostname', async () => {
    setHostname('my.myfestival.com')
    const { resolveDashboardDeployment } = await import('./deployment')
    const d = resolveDashboardDeployment()
    expect(d.wallet_origin).toBe('https://id.myfestival.com')
    expect(d.ens_domain).toBe('myfestival.com')
    expect(d.ipfs_pin_endpoint).toBe('https://gateway.myfestival.com/api/pin')
  })

  test('handles the KON-managed hostname (my.kon.xyz) round-tripping back to defaults', async () => {
    setHostname('my.kon.xyz')
    const { resolveDashboardDeployment } = await import('./deployment')
    const d = resolveDashboardDeployment()
    // The derivation rule + the defaults intentionally agree for KON's
    // own deployment — same wallet_origin, same pin endpoint.
    expect(d.wallet_origin).toBe(KON_DEFAULTS.wallet_origin)
    expect(d.ens_domain).toBe('kon.xyz')
  })

  test('falls back to defaults on hostnames that do not match my.<root>', async () => {
    setHostname('localhost')
    const { resolveDashboardDeployment } = await import('./deployment')
    const d = resolveDashboardDeployment()
    expect(d.wallet_origin).toBe(KON_DEFAULTS.wallet_origin)
  })

  test('falls back to defaults on a bare "my" (no parent root)', async () => {
    setHostname('my')
    const { resolveDashboardDeployment } = await import('./deployment')
    const d = resolveDashboardDeployment()
    // 'my' alone has no dot, so the regex shouldn't match — defaults out
    expect(d.ens_domain).toBe(KON_DEFAULTS.ens_domain)
  })

  test('falls back to defaults when the root has no dot (e.g. my.localhost)', async () => {
    setHostname('my.localhost')
    const { resolveDashboardDeployment } = await import('./deployment')
    const d = resolveDashboardDeployment()
    // Requires root to contain a dot — single-label TLDs would yield
    // garbage origins, so falls through to safe defaults.
    expect(d.ens_domain).toBe(KON_DEFAULTS.ens_domain)
  })

  test('handles deeply nested my.* hosts (my.staging.myfestival.com)', async () => {
    setHostname('my.staging.myfestival.com')
    const { resolveDashboardDeployment } = await import('./deployment')
    const d = resolveDashboardDeployment()
    // Strips ONLY the leading "my." — root remains staging.myfestival.com
    expect(d.ens_domain).toBe('staging.myfestival.com')
    expect(d.wallet_origin).toBe('https://id.staging.myfestival.com')
    expect(d.ipfs_pin_endpoint).toBe('https://gateway.staging.myfestival.com/api/pin')
  })

  test('returns fresh arrays so callers can mutate without poisoning the cache', async () => {
    setHostname('my.myfestival.com')
    const { resolveDashboardDeployment } = await import('./deployment')
    const d1 = resolveDashboardDeployment()
    d1.gun_peers.push('https://malicious.example/gun')
    const d2 = resolveDashboardDeployment()
    expect(d2.gun_peers).not.toContain('https://malicious.example/gun')
  })
})
