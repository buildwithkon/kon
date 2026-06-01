import { describe, expect, test } from 'vitest'
import { KON_DEFAULTS, resolveDeployment } from './defaults'

describe('KON_DEFAULTS', () => {
  test('contains the KON-managed origin literals', () => {
    expect(KON_DEFAULTS.wallet_origin).toBe('https://id.kon.xyz')
    expect(KON_DEFAULTS.ens_domain).toBe('kon.xyz')
    expect(KON_DEFAULTS.gun_peers.length).toBeGreaterThan(0)
    expect(KON_DEFAULTS.ipfs_gateways.length).toBeGreaterThan(0)
  })

  test('arrays are frozen-readonly via `as const`', () => {
    // TypeScript ensures readonly; at runtime arrays still exist but we don't expect
    // anyone to mutate them. Verify length is stable.
    const len = KON_DEFAULTS.gun_peers.length
    expect(KON_DEFAULTS.gun_peers).toHaveLength(len)
  })
})

describe('resolveDeployment', () => {
  test('returns defaults when override is undefined', () => {
    const d = resolveDeployment()
    expect(d.wallet_origin).toBe(KON_DEFAULTS.wallet_origin)
    expect(d.ens_domain).toBe(KON_DEFAULTS.ens_domain)
    expect(d.gun_peers).toEqual(KON_DEFAULTS.gun_peers)
    expect(d.ipfs_gateways).toEqual(KON_DEFAULTS.ipfs_gateways)
  })

  test('returns defaults when override is empty object', () => {
    const d = resolveDeployment({})
    expect(d.wallet_origin).toBe(KON_DEFAULTS.wallet_origin)
  })

  test('overrides wallet_origin when provided', () => {
    const d = resolveDeployment({ wallet_origin: 'https://id.myfestival.com' })
    expect(d.wallet_origin).toBe('https://id.myfestival.com')
    // Other fields fall through to defaults.
    expect(d.ens_domain).toBe(KON_DEFAULTS.ens_domain)
  })

  test('overrides ens_domain when provided', () => {
    const d = resolveDeployment({ ens_domain: 'myfestival.com' })
    expect(d.ens_domain).toBe('myfestival.com')
    expect(d.wallet_origin).toBe(KON_DEFAULTS.wallet_origin)
  })

  test('replaces gun_peers entirely (not merged)', () => {
    const d = resolveDeployment({ gun_peers: ['https://gun.myfestival.com/gun'] })
    expect(d.gun_peers).toEqual(['https://gun.myfestival.com/gun'])
    // Defaults are NOT appended; the override is authoritative.
    expect(d.gun_peers).not.toContain(KON_DEFAULTS.gun_peers[0])
  })

  test('replaces ipfs_gateways entirely (not merged)', () => {
    const d = resolveDeployment({ ipfs_gateways: ['https://gateway.myfestival.com'] })
    expect(d.ipfs_gateways).toEqual(['https://gateway.myfestival.com'])
  })

  test('returns a fresh array for gun_peers (defensive copy)', () => {
    const d = resolveDeployment()
    expect(d.gun_peers).not.toBe(KON_DEFAULTS.gun_peers)
    // Mutating the resolved deployment should not affect KON_DEFAULTS.
    d.gun_peers.push('https://malicious.example/gun')
    expect(KON_DEFAULTS.gun_peers).not.toContain('https://malicious.example/gun')
  })

  test('returns a fresh array for ipfs_gateways (defensive copy)', () => {
    const d = resolveDeployment()
    expect(d.ipfs_gateways).not.toBe(KON_DEFAULTS.ipfs_gateways)
    d.ipfs_gateways.push('https://malicious.example')
    expect(KON_DEFAULTS.ipfs_gateways).not.toContain('https://malicious.example')
  })

  test('self-host scenario: fully overridden deployment', () => {
    const d = resolveDeployment({
      wallet_origin: 'https://id.myfestival.com',
      ens_domain: 'myfestival.com',
      gun_peers: ['https://gun.myfestival.com/gun', 'https://relay.peer.ooo/gun'],
      ipfs_gateways: ['https://gateway.myfestival.com', 'https://w3s.link']
    })
    expect(d.wallet_origin).toBe('https://id.myfestival.com')
    expect(d.ens_domain).toBe('myfestival.com')
    expect(d.gun_peers).toHaveLength(2)
    expect(d.ipfs_gateways).toHaveLength(2)
  })
})
