/**
 * Supported EVM chains for the KON wallet.
 *
 * Safe v1.4.1 + the Safe Singleton Factory deploy proxies to the same
 * address on every supported chain when the same (owner, salt, version)
 * tuple is used. KON relies on this so a single passkey-derived Safe
 * address covers Base (primary, where AppCoin lives) plus future
 * expansion (Optimism, Arbitrum, Tempo, ...).
 *
 * Bundler / paymaster / RPC URLs are placeholders — step 8d wires in the
 * real Pimlico endpoints once the API key is available. Self-hosted
 * deployments override these by replacing this file (a future step will
 * move the override into manifest.deployment.chains).
 */

import { base } from 'viem/chains'

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
    bundlerUrl: '', // TODO 8d: `https://api.pimlico.io/v2/${base.id}/rpc?apikey=${PIMLICO_API_KEY}`
    paymasterUrl: '', // TODO 8e: same URL, separate verb
    sponsorshipPolicyId: '', // TODO 8e: Pimlico policy id
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
