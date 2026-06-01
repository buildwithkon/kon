/**
 * Supported EVM chains for the KON wallet.
 *
 * Safe v1.4.1 + the Safe Singleton Factory deploy proxies to the same
 * address on every supported chain when the same (owner, salt, version)
 * tuple is used. KON relies on this so a single passkey-derived Safe
 * address covers Base (primary, where AppCoin lives) plus future
 * expansion (Optimism, Arbitrum, Tempo, ...).
 *
 * Bundler / paymaster endpoints are derived from VITE_PIMLICO_API_KEY
 * at build time. Vite inlines the key into the bundle; the Pimlico
 * dashboard restricts it to KON's allowed origins + sponsorship policy
 * so extraction is harmless. See docs/self-host-wallet.md "Pimlico API
 * key handling" for the threat model + dashboard setup walkthrough.
 *
 * If VITE_PIMLICO_API_KEY is unset (e.g. a dev build before dashboard
 * setup is done), the bundler/paymaster URLs stay blank and signTx
 * falls back to a stub userOpHash — every step except the real
 * on-chain submission still exercises end-to-end.
 */

import { base } from 'viem/chains'

const PIMLICO_API_KEY = (import.meta.env.VITE_PIMLICO_API_KEY as string | undefined) ?? ''
const SPONSORSHIP_POLICY_ID = (import.meta.env.VITE_PIMLICO_SPONSORSHIP_POLICY_ID as string | undefined) ?? ''

function pimlicoUrl(chainId: number): string {
  if (!PIMLICO_API_KEY) return ''
  return `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${PIMLICO_API_KEY}`
}

/** True if Pimlico env is wired. Callers gate real bundler calls on this. */
export const PIMLICO_CONFIGURED = PIMLICO_API_KEY.length > 0

export interface ChainConfig {
  chainId: number
  name: string
  /** Generic HTTPS RPC endpoint (no auth). */
  rpcUrl: string
  /**
   * ERC-4337 bundler endpoint. Empty until step 8d wires Pimlico.
   * Each chain gets its own bundler URL because Pimlico namespaces
   * by chain in the URL path.
   */
  bundlerUrl: string
  /**
   * Paymaster endpoint. Empty until step 8e wires sponsorship.
   */
  paymasterUrl: string
  /**
   * Pimlico sponsorship policy id. Empty until step 8e.
   */
  sponsorshipPolicyId: string
  /**
   * Underlying viem chain definition. Used for tx construction; not
   * passed to public clients used in Safe address derivation (see
   * comment in safe.ts about block generic mismatches).
   */
  viemChain: typeof base
}

export const PRIMARY_CHAIN_ID = base.id

export const CHAINS: Record<number, ChainConfig> = {
  [base.id]: {
    chainId: base.id,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    bundlerUrl: pimlicoUrl(base.id),
    paymasterUrl: pimlicoUrl(base.id),
    sponsorshipPolicyId: SPONSORSHIP_POLICY_ID,
    viemChain: base
  }
  // Optimism, Arbitrum, etc. added later. Adding a chain here makes the
  // wallet able to sign tx on it; the Safe address remains identical
  // across chains thanks to predeterministic deploy.
}

export function getChain(chainId: number): ChainConfig | null {
  return CHAINS[chainId] ?? null
}

export function listChains(): ChainConfig[] {
  return Object.values(CHAINS)
}
