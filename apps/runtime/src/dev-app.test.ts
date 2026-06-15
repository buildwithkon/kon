import { describe, expect, test } from 'vitest'
import { DEV_APP_MANIFESTS, devDeploymentOverride, pickDevAppName } from './dev-app'

describe('pickDevAppName', () => {
  test('?app= query takes precedence over the env default', () => {
    expect(pickDevAppName('?app=ethtokyo', 'demo')).toBe('ethtokyo')
  })

  test('leading ? is optional / handled by URLSearchParams', () => {
    expect(pickDevAppName('app=ethtokyo')).toBe('ethtokyo')
  })

  test('falls back to VITE_DEV_APP when no query', () => {
    expect(pickDevAppName('', 'ethtokyo')).toBe('ethtokyo')
  })

  test('empty ?app= is ignored, env wins', () => {
    expect(pickDevAppName('?app=', 'demo')).toBe('demo')
  })

  test('null when neither query nor env is set', () => {
    expect(pickDevAppName('', undefined)).toBeNull()
  })
})

describe('devDeploymentOverride', () => {
  test('replaces declared (production) gun peers with the local relay', () => {
    const out = devDeploymentOverride({ gun_peers: ['https://relay.kon.xyz/gun'] }, {})
    expect(out.gun_peers).toEqual(['http://localhost:8765/gun'])
  })

  test('honors VITE_DEV_GUN_PEER override', () => {
    const out = devDeploymentOverride(undefined, { gunPeer: 'http://localhost:9999/gun' })
    expect(out.gun_peers).toEqual(['http://localhost:9999/gun'])
  })

  test('sets wallet_origin only when explicitly provided', () => {
    expect(devDeploymentOverride(undefined, {}).wallet_origin).toBeUndefined()
    expect(devDeploymentOverride(undefined, { walletOrigin: 'http://localhost:5175' }).wallet_origin).toBe(
      'http://localhost:5175'
    )
  })

  test('preserves other declared deployment fields', () => {
    const out = devDeploymentOverride({ ipfs_gateways: ['https://w3s.link'] }, {})
    expect(out.ipfs_gateways).toEqual(['https://w3s.link'])
    expect(out.gun_peers).toEqual(['http://localhost:8765/gun'])
  })
})

describe('DEV_APP_MANIFESTS', () => {
  test('discovers the in-repo ethtokyo app manifest', () => {
    expect(DEV_APP_MANIFESTS.ethtokyo).toBeTruthy()
    // biome-ignore lint/suspicious/noExplicitAny: test introspection of parsed JSON
    expect((DEV_APP_MANIFESTS.ethtokyo as any).app.id).toBe('ethtokyo.kon.xyz')
  })

  test('ethtokyo manifest carries theme, 4 iconed pages, and 13 agenda events', () => {
    // biome-ignore lint/suspicious/noExplicitAny: test introspection of parsed JSON
    const m = DEV_APP_MANIFESTS.ethtokyo as any
    expect(m.app.theme.main).toBe('#562266')
    expect(m.pages.map((p: any) => p.id)).toEqual(['home', 'agenda', 'forum', 'info'])
    expect(m.pages.every((p: any) => typeof p.icon === 'string')).toBe(true)
    const agenda = m.pages.find((p: any) => p.id === 'agenda')
    const ical = agenda.plugins.find((pl: any) => pl.id === 'ical')
    expect(ical.props.tz).toBe('Asia/Tokyo')
    expect(ical.props.events).toHaveLength(13)
  })
})
