import { describe, expect, test } from 'vitest'
import { createRateLimiter, guessContentType, ipOf, parseIpfsUrl } from './lib.mjs'

describe('guessContentType', () => {
  test('html / json / js / css / mjs', () => {
    expect(guessContentType('index.html')).toBe('text/html; charset=utf-8')
    expect(guessContentType('m.json')).toBe('application/json')
    expect(guessContentType('app.js')).toBe('application/javascript')
    expect(guessContentType('app.mjs')).toBe('application/javascript')
    expect(guessContentType('s.css')).toBe('text/css')
  })

  test('image formats + wasm + fonts', () => {
    expect(guessContentType('a.png')).toBe('image/png')
    expect(guessContentType('a.jpg')).toBe('image/jpeg')
    expect(guessContentType('a.jpeg')).toBe('image/jpeg')
    expect(guessContentType('a.svg')).toBe('image/svg+xml')
    expect(guessContentType('a.webp')).toBe('image/webp')
    expect(guessContentType('m.wasm')).toBe('application/wasm')
    expect(guessContentType('f.woff2')).toBe('font/woff2')
  })

  test('case-insensitive extension matching', () => {
    expect(guessContentType('INDEX.HTML')).toBe('text/html; charset=utf-8')
    expect(guessContentType('App.JS')).toBe('application/javascript')
  })

  test('unknown extension falls back to octet-stream', () => {
    expect(guessContentType('binary.bin')).toBe('application/octet-stream')
    expect(guessContentType('no-extension')).toBe('application/octet-stream')
    expect(guessContentType('')).toBe('application/octet-stream')
  })

  test('non-string input safely returns octet-stream', () => {
    expect(guessContentType(null)).toBe('application/octet-stream')
    expect(guessContentType(undefined)).toBe('application/octet-stream')
    expect(guessContentType(123)).toBe('application/octet-stream')
  })

  test('full paths with directories', () => {
    expect(guessContentType('assets/index-abc.js')).toBe('application/javascript')
    expect(guessContentType('/ipfs/bafy.../sw.js')).toBe('application/javascript')
  })
})

describe('parseIpfsUrl', () => {
  test('extracts CID with no subpath', () => {
    expect(parseIpfsUrl('/ipfs/bafyabc123')).toEqual({ cid: 'bafyabc123', subPath: '' })
  })

  test('extracts CID + leading-slash subPath', () => {
    expect(parseIpfsUrl('/ipfs/bafyabc/index.html')).toEqual({
      cid: 'bafyabc',
      subPath: '/index.html'
    })
  })

  test('handles deeply nested paths', () => {
    expect(parseIpfsUrl('/ipfs/bafyabc/assets/css/main.css')).toEqual({
      cid: 'bafyabc',
      subPath: '/assets/css/main.css'
    })
  })

  test('trailing slash preserved (used to flag directory request)', () => {
    expect(parseIpfsUrl('/ipfs/bafyabc/')).toEqual({ cid: 'bafyabc', subPath: '/' })
  })
})

describe('ipOf', () => {
  test('honors X-Forwarded-For when present', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.10' }, socket: { remoteAddress: '127.0.0.1' } }
    expect(ipOf(req)).toBe('203.0.113.10')
  })

  test('uses first hop when X-F-F has multiple values', () => {
    const req = {
      headers: { 'x-forwarded-for': '203.0.113.10, 198.51.100.5' },
      socket: { remoteAddress: '127.0.0.1' }
    }
    expect(ipOf(req)).toBe('203.0.113.10')
  })

  test('falls back to socket.remoteAddress when no X-F-F', () => {
    const req = { headers: {}, socket: { remoteAddress: '198.51.100.42' } }
    expect(ipOf(req)).toBe('198.51.100.42')
  })

  test('returns "unknown" when neither is available', () => {
    expect(ipOf({ headers: {} })).toBe('unknown')
    expect(ipOf({ headers: {}, socket: {} })).toBe('unknown')
  })
})

describe('createRateLimiter', () => {
  function fakeClock(start = 0) {
    let t = start
    return {
      now: () => t,
      tick: (ms) => {
        t += ms
      }
    }
  }

  test('initial state allows first request', () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ requestsPerMin: 10, bytesPerDay: 1000, now: clock.now })
    expect(rl.check('1.1.1.1', 100).ok).toBe(true)
  })

  test('exhausts token bucket after requestsPerMin consecutive requests', () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ requestsPerMin: 3, bytesPerDay: 1_000_000, now: clock.now })
    expect(rl.check('1.1.1.1', 10).ok).toBe(true)
    expect(rl.check('1.1.1.1', 10).ok).toBe(true)
    expect(rl.check('1.1.1.1', 10).ok).toBe(true)
    // Fourth request without time advance → reject
    const denied = rl.check('1.1.1.1', 10)
    expect(denied.ok).toBe(false)
    expect(denied.reason).toMatch(/rate limit/i)
  })

  test('refills tokens at requestsPerMin / 60s rate', () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ requestsPerMin: 6, bytesPerDay: 1_000_000, now: clock.now })
    // Drain all 6 tokens
    for (let i = 0; i < 6; i++) rl.check('1.1.1.1', 1)
    expect(rl.check('1.1.1.1', 1).ok).toBe(false)
    // 10 seconds later: refilled by 1 token (6 per 60s = 1 per 10s)
    clock.tick(10_000)
    expect(rl.check('1.1.1.1', 1).ok).toBe(true)
    // Immediately again → denied (bucket back to 0)
    expect(rl.check('1.1.1.1', 1).ok).toBe(false)
  })

  test('isolated counters per IP', () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ requestsPerMin: 1, bytesPerDay: 1_000_000, now: clock.now })
    expect(rl.check('1.1.1.1', 1).ok).toBe(true)
    expect(rl.check('1.1.1.1', 1).ok).toBe(false) // 1.1.1.1 capped
    expect(rl.check('2.2.2.2', 1).ok).toBe(true) // 2.2.2.2 unaffected
  })

  test('enforces daily byte quota independently of request count', () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ requestsPerMin: 1000, bytesPerDay: 100, now: clock.now })
    expect(rl.check('1.1.1.1', 60).ok).toBe(true)
    expect(rl.check('1.1.1.1', 30).ok).toBe(true) // 90 bytes total
    const denied = rl.check('1.1.1.1', 20) // would push to 110
    expect(denied.ok).toBe(false)
    expect(denied.reason).toMatch(/byte quota/i)
  })

  test('daily byte counter rolls after 24h', () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ requestsPerMin: 1000, bytesPerDay: 100, now: clock.now })
    expect(rl.check('1.1.1.1', 90).ok).toBe(true)
    expect(rl.check('1.1.1.1', 20).ok).toBe(false) // over quota
    clock.tick(86_400_001) // > 24h
    expect(rl.check('1.1.1.1', 90).ok).toBe(true) // counter reset
  })

  test('snapshot exposes per-IP accounting state for inspection', () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ requestsPerMin: 10, bytesPerDay: 1000, now: clock.now })
    rl.check('1.1.1.1', 50)
    const s = rl.snapshot('1.1.1.1')
    expect(s).not.toBeNull()
    expect(s.bytesToday).toBe(50)
    expect(s.tokens).toBe(9)
    expect(rl.snapshot('2.2.2.2')).toBeNull()
  })
})
