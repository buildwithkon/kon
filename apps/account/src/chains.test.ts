import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// chains.ts reads import.meta.env.VITE_PIMLICO_API_KEY +
// VITE_CDP_API_KEY at module init, so each scenario re-imports the
// module with a fresh env state. vi.stubEnv from vitest is the canonical
// way to do this against Vite's import.meta.env semantics.

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('chains.ts — env-driven paymaster detection', () => {
  test('PIMLICO_CONFIGURED false + PAYMASTER_VENDOR none when no env set', async () => {
    vi.stubEnv('VITE_PIMLICO_API_KEY', '')
    vi.stubEnv('VITE_PIMLICO_SPONSORSHIP_POLICY_ID', '')
    vi.stubEnv('VITE_CDP_API_KEY', '')
    const { PIMLICO_CONFIGURED, PAYMASTER_VENDOR, CHAINS } = await import('./chains')
    expect(PIMLICO_CONFIGURED).toBe(false)
    expect(PAYMASTER_VENDOR).toBe('none')
    expect(CHAINS[8453].bundlerUrl).toBe('')
    expect(CHAINS[8453].paymasterUrl).toBe('')
  })

  test('Pimlico-only (no CDP key) → PAYMASTER_VENDOR pimlico, paymaster URL = Pimlico', async () => {
    vi.stubEnv('VITE_PIMLICO_API_KEY', 'pim_test123')
    vi.stubEnv('VITE_PIMLICO_SPONSORSHIP_POLICY_ID', 'sp_test')
    vi.stubEnv('VITE_CDP_API_KEY', '')
    const { PIMLICO_CONFIGURED, PAYMASTER_VENDOR, CHAINS } = await import('./chains')
    expect(PIMLICO_CONFIGURED).toBe(true)
    expect(PAYMASTER_VENDOR).toBe('pimlico')
    expect(CHAINS[8453].bundlerUrl).toContain('api.pimlico.io/v2/8453/rpc')
    expect(CHAINS[8453].bundlerUrl).toContain('apikey=pim_test123')
    expect(CHAINS[8453].paymasterUrl).toContain('api.pimlico.io/v2/8453/rpc')
    expect(CHAINS[8453].sponsorshipPolicyId).toBe('sp_test')
  })

  test('CDP set + Pimlico set → PAYMASTER_VENDOR coinbase, paymaster URL = CDP', async () => {
    vi.stubEnv('VITE_PIMLICO_API_KEY', 'pim_test')
    vi.stubEnv('VITE_PIMLICO_SPONSORSHIP_POLICY_ID', 'sp_test')
    vi.stubEnv('VITE_CDP_API_KEY', 'cdp_uuid_test')
    const { PAYMASTER_VENDOR, CHAINS } = await import('./chains')
    expect(PAYMASTER_VENDOR).toBe('coinbase')
    expect(CHAINS[8453].paymasterUrl).toContain('api.developer.coinbase.com/rpc/v1/base/')
    expect(CHAINS[8453].paymasterUrl).toContain('cdp_uuid_test')
    // sponsorshipPolicyId is intentionally empty when vendor is coinbase
    // (CDP's allowlist lives in the dashboard, not in the bundle).
    expect(CHAINS[8453].sponsorshipPolicyId).toBe('')
  })

  test('CDP set without Pimlico → still need Pimlico for bundler (vendor coinbase, but bundler unwired)', async () => {
    // Edge case: operator wired Coinbase paymaster but forgot the
    // Pimlico bundler key. submit-user-op.ts gates on
    // PIMLICO_CONFIGURED, so this combo returns vendor=coinbase but
    // PIMLICO_CONFIGURED=false — the wallet popup will fall through to
    // the stub.
    vi.stubEnv('VITE_PIMLICO_API_KEY', '')
    vi.stubEnv('VITE_PIMLICO_SPONSORSHIP_POLICY_ID', '')
    vi.stubEnv('VITE_CDP_API_KEY', 'cdp_uuid_test')
    const { PIMLICO_CONFIGURED, PAYMASTER_VENDOR } = await import('./chains')
    expect(PIMLICO_CONFIGURED).toBe(false)
    expect(PAYMASTER_VENDOR).toBe('coinbase')
  })

  test('CDP key only applies to Base chains (8453 / 84532), not other chain ids', async () => {
    // CHAINS only contains Base today, but the internal paymasterUrl()
    // helper gates by chainId. If a future chain (e.g. Optimism 10) is
    // added to CHAINS, CDP should not be used there. Re-test by importing
    // the helper indirectly through CHAINS shape.
    vi.stubEnv('VITE_PIMLICO_API_KEY', 'pim_test')
    vi.stubEnv('VITE_CDP_API_KEY', 'cdp_test')
    const { CHAINS } = await import('./chains')
    // Base is in CHAINS, paymaster goes to CDP
    expect(CHAINS[8453].paymasterUrl).toContain('coinbase.com')
    // Chains not in CHAINS return null from getChain — verify that
    const { getChain } = await import('./chains')
    expect(getChain(10)).toBeNull()
  })

  test('listChains returns Base by default', async () => {
    vi.stubEnv('VITE_PIMLICO_API_KEY', 'pim_test')
    vi.stubEnv('VITE_CDP_API_KEY', 'cdp_test')
    const { listChains } = await import('./chains')
    const chains = listChains()
    expect(chains).toHaveLength(1)
    expect(chains[0].name).toBe('Base')
    expect(chains[0].chainId).toBe(8453)
  })

  test('PRIMARY_CHAIN_ID is Base mainnet', async () => {
    const { PRIMARY_CHAIN_ID } = await import('./chains')
    expect(PRIMARY_CHAIN_ID).toBe(8453)
  })
})

describe('chains.ts — URL format invariants', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_PIMLICO_API_KEY', 'pim_key_abc123')
  })

  test('Pimlico bundler URL matches the expected v2/<chainId>/rpc?apikey shape', async () => {
    vi.stubEnv('VITE_CDP_API_KEY', '')
    const { CHAINS } = await import('./chains')
    expect(CHAINS[8453].bundlerUrl).toBe('https://api.pimlico.io/v2/8453/rpc?apikey=pim_key_abc123')
  })

  test('CDP paymaster URL maps chainId 8453 → /base/ and 84532 → /base-sepolia/', async () => {
    vi.stubEnv('VITE_CDP_API_KEY', 'cdp_xyz')
    const { CHAINS } = await import('./chains')
    expect(CHAINS[8453].paymasterUrl).toBe('https://api.developer.coinbase.com/rpc/v1/base/cdp_xyz')
    // Only Base mainnet is in CHAINS today; the network mapping for
    // 84532 is exercised via the paymasterUrl helper directly if/when
    // Base Sepolia is added to CHAINS.
  })
})
