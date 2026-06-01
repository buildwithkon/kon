/**
 * Supported EVM chains for the KON wallet.
 *
 * Safe v1.4.1 + the Safe Singleton Factory deploy proxies to the same
 * address on every supported chain when the same (owner, salt, version)
 * tuple is used. KON relies on this so a single passkey-derived Safe
 * address covers Base (primary, where AppCoin lives) plus future
 * expansion (Optimism, Arbitrum, Tempo, ...).
 *
 * Bundler / paymaster endpoints are derived from build-time env. Two
 * vendors are in play:
 *
 *   Bundler:    Pimlico  (VITE_PIMLICO_API_KEY)
 *   Paymaster:  Coinbase (VITE_CDP_API_KEY)         — preferred on Base,
 *                                                     KON $100 credit
 *               or Pimlico (VITE_PIMLICO_SPONSORSHIP_POLICY_ID) — fallback
 *
 * Each vendor's dashboard restricts its key by origin + chain + allowed
 * contracts/selectors so the key extracted from the browser bundle is
 * useless outside KON's actual call surface. See
 * docs/self-host-wallet.md "Pimlico API key handling" for the threat
 * model + step-by-step dashboard setup for both vendors.
 *
 * If neither bundler nor paymaster env is set (e.g. a dev build before
 * dashboard setup), URLs stay blank and signTx falls back to a stub
 * userOpHash so the dashboard publish flow still exercises end-to-end
 * except the on-chain submission.
 */

import { base } from 'viem/chains'

const PIMLICO_API_KEY = (import.meta.env.VITE_PIMLICO_API_KEY as string | undefined) ?? ''
const PIMLICO_SPONSORSHIP_POLICY_ID =
  (import.meta.env.VITE_PIMLICO_SPONSORSHIP_POLICY_ID as string | undefined) ?? ''
const CDP_API_KEY = (import.meta.env.VITE_CDP_API_KEY as string | undefined) ?? ''

function pimlicoBundlerUrl(chainId: number): string {
  if (!PIMLICO_API_KEY) return ''
  return `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${PIMLICO_API_KEY}`
}

/**
 * Pick the paymaster URL for a chain.
 *
 * Preference order:
 *   1. Coinbase Paymaster (when VITE_CDP_API_KEY is set + the chain is
 *      one Coinbase covers — currently Base mainnet + Sepolia).
 *      Routes paymaster RPC to api.developer.coinbase.com, which absorbs
 *      gas via Coinbase's free Base subsidy.
 *   2. Pimlico paymaster (fallback when VITE_CDP_API_KEY is empty but
 *      VITE_PIMLICO_API_KEY is set). Requires a Pimlico sponsorship
 *      policy id.
 *   3. Empty URL — paymaster disabled (user's Safe pays its own gas).
 */
function paymasterUrl(chainId: number): string {
  if (CDP_API_KEY && (chainId === 8453 || chainId === 84532)) {
    const network = chainId === 8453 ? 'base' : 'base-sepolia'
    return `https://api.developer.coinbase.com/rpc/v1/${network}/${CDP_API_KEY}`
  }
  if (PIMLICO_API_KEY) {
    return `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${PIMLICO_API_KEY}`
  }
  return ''
}

/** True if Pimlico bundler env is wired. */
export const PIMLICO_CONFIGURED = PIMLICO_API_KEY.length > 0

/** Which paymaster vendor is in play. Useful for UI + logging. */
export const PAYMASTER_VENDOR: 'coinbase' | 'pimlico' | 'none' = CDP_API_KEY
  ? 'coinbase'
  : PIMLICO_API_KEY
    ? 'pimlico'
    : 'none'

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
    bundlerUrl: pimlicoBundlerUrl(base.id),
    paymasterUrl: paymasterUrl(base.id),
    // Only used when paymaster is Pimlico; Coinbase Paymaster's
    // allowlist + policy live in the CDP dashboard instead.
    sponsorshipPolicyId: PAYMASTER_VENDOR === 'pimlico' ? PIMLICO_SPONSORSHIP_POLICY_ID : '',
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
