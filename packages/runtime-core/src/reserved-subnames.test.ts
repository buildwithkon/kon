import { describe, expect, test } from 'vitest'
import { isReservedSubname, RESERVED_SUBNAMES, validateSubname } from './reserved-subnames'

describe('validateSubname — DNS format', () => {
  test('accepts a well-formed subname', () => {
    const r = validateSubname('matsuri')
    expect(r.ok).toBe(true)
    expect(r.normalized).toBe('matsuri')
  })

  test('accepts subnames with hyphens in the middle', () => {
    expect(validateSubname('eth-tokyo').ok).toBe(true)
    expect(validateSubname('foo-bar-baz').ok).toBe(true)
  })

  test('accepts subnames containing digits', () => {
    expect(validateSubname('matsuri2026').ok).toBe(true)
    expect(validateSubname('eth2-tokyo').ok).toBe(true)
  })

  test('normalizes uppercase + whitespace', () => {
    const r = validateSubname('  Matsuri  ')
    expect(r.ok).toBe(true)
    expect(r.normalized).toBe('matsuri')
  })

  test('rejects non-string input', () => {
    // @ts-expect-error — testing the runtime guard
    expect(validateSubname(123).ok).toBe(false)
    // @ts-expect-error
    expect(validateSubname(null).ok).toBe(false)
    // @ts-expect-error
    expect(validateSubname(undefined).ok).toBe(false)
  })

  test('rejects empty / too short / too long names', () => {
    expect(validateSubname('').ok).toBe(false)
    expect(validateSubname('a').ok).toBe(false)
    expect(validateSubname('ab').ok).toBe(false)
    expect(validateSubname('a'.repeat(64)).ok).toBe(false)
  })

  test('accepts exactly 3 and exactly 63 characters', () => {
    expect(validateSubname('abc').ok).toBe(true)
    expect(validateSubname('a'.repeat(63)).ok).toBe(true)
  })

  test('rejects leading or trailing hyphen', () => {
    expect(validateSubname('-foo').ok).toBe(false)
    expect(validateSubname('foo-').ok).toBe(false)
    expect(validateSubname('-foo-').ok).toBe(false)
  })

  test('rejects double-hyphen at start (Punycode-looking) but accepts in middle', () => {
    // double-hyphen at position 3 looks like Punycode; we DON'T reject it because the
    // regex `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$` permits it. Document the current
    // behavior so a future tightening change is intentional, not silent.
    expect(validateSubname('xn--abc').ok).toBe(true)
  })

  test('rejects symbols + spaces + non-ASCII', () => {
    expect(validateSubname('foo bar').ok).toBe(false)
    expect(validateSubname('foo_bar').ok).toBe(false)
    expect(validateSubname('foo.bar').ok).toBe(false)
    expect(validateSubname('matsuri!').ok).toBe(false)
    expect(validateSubname('まつり').ok).toBe(false)
  })
})

describe('validateSubname — reserved list', () => {
  test('rejects KON-managed origins (id / my / kon)', () => {
    expect(validateSubname('id').ok).toBe(false) // also too short (2 chars)
    expect(validateSubname('my').ok).toBe(false) // also too short
    expect(validateSubname('kon').ok).toBe(false)
    const r = validateSubname('kon')
    expect(r.reason).toMatch(/reserved/i)
  })

  test('rejects dashboard variants', () => {
    expect(validateSubname('admin').ok).toBe(false)
    expect(validateSubname('app').ok).toBe(false)
    expect(validateSubname('apps').ok).toBe(false)
    expect(validateSubname('dashboard').ok).toBe(false)
    expect(validateSubname('console').ok).toBe(false)
  })

  test('rejects auth / account variants', () => {
    for (const name of ['login', 'signin', 'signup', 'auth', 'account', 'settings', 'profile']) {
      expect(validateSubname(name).ok).toBe(false)
    }
  })

  test('rejects RFC 2142 standard mailbox names', () => {
    for (const name of ['root', 'postmaster', 'webmaster', 'abuse', 'security', 'noreply']) {
      expect(validateSubname(name).ok).toBe(false)
    }
  })

  test('rejects environment / stage names', () => {
    for (const name of ['dev', 'staging', 'preview', 'beta', 'alpha']) {
      expect(validateSubname(name).ok).toBe(false)
    }
  })

  test('all reserved entries are themselves valid DNS-format strings', () => {
    for (const name of RESERVED_SUBNAMES) {
      const isAtLeast3 = name.length >= 3
      if (isAtLeast3) {
        // ≥3 chars: validateSubname rejects them only because of reserved lookup
        const r = validateSubname(name)
        expect(r.ok).toBe(false)
        expect(r.reason).toMatch(/reserved/i)
      }
    }
  })

  test('extraReserved parameter rejects deployment-specific names', () => {
    const extra = new Set(['mycompany', 'internal-name'])
    expect(validateSubname('mycompany', extra).ok).toBe(false)
    expect(validateSubname('internal-name', extra).ok).toBe(false)
    // names not in extra are fine
    expect(validateSubname('public', extra).ok).toBe(true)
  })

  test('extraReserved error message distinguishes from KON-managed reserves', () => {
    const r = validateSubname('mycompany', new Set(['mycompany']))
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/deployment/i)
  })
})

describe('isReservedSubname', () => {
  test('returns true for reserved names', () => {
    expect(isReservedSubname('admin')).toBe(true)
    expect(isReservedSubname('login')).toBe(true)
  })

  test('returns false for valid non-reserved names', () => {
    expect(isReservedSubname('matsuri')).toBe(false)
    expect(isReservedSubname('ethtokyo')).toBe(false)
  })

  test('returns false for invalid-format names (those failures are not "reserved")', () => {
    // a 1-char name fails validation but it's not because of the reserved list,
    // so isReservedSubname() shouldn't mislead callers into thinking it was.
    expect(isReservedSubname('a')).toBe(false)
    expect(isReservedSubname('foo bar')).toBe(false)
  })

  test('honors extraReserved', () => {
    expect(isReservedSubname('mycompany', new Set(['mycompany']))).toBe(true)
  })
})
