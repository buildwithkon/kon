/**
 * Safe smart account derivation from a passkey-backed WebAuthn account.
 *
 * - Uses Safe v1.4.1 with the ERC-4337 module + WebAuthn shared signer +
 *   P256 verifier (permissionless picks the right module addresses per chain).
 * - The address is counterfactual — derived from the passkey publicKey
 *   without deploying. The first transaction the user signs will deploy
 *   the proxy.
 * - Cross-chain: Safe v1.4.1 + the same passkey owner produces the same
 *   address on every supported chain via the Safe Singleton Factory
 *   (deployed to the same address on every EVM chain). KON treats this as
 *   load-bearing: a single passkey identity = a single address across
 *   Base + future chains. verifyAddressAcrossChains() asserts the
 *   invariant before we cache the address for cross-chain use.
 */

import { createPublicClient, http, type Address } from 'viem'
import { entryPoint07Address } from 'viem/account-abstraction'
import type { WebAuthnAccount } from 'viem/account-abstraction'
import { toSafeSmartAccount } from 'permissionless/accounts'
import { CHAINS, getChain, listChains, PRIMARY_CHAIN_ID } from './chains'

const SAFE_VERSION = '1.4.1' as const

// Per-chain public clients. We don't pin viem `chain: ...` because Base's
// block / tx generics include a `deposit` variant that permissionless's
// type signature doesn't enumerate — runtime behavior is identical, this
// only matters for TypeScript. The transport URL still pins the network.
//
// Cache stored at module scope but indexed by rpcUrl string so the
// returned client keeps its narrow inferred type at each call site.
const transportCache = new Map<string, ReturnType<typeof http>>()

function transportFor(chainId: number) {
  const cfg = getChain(chainId)
  if (!cfg) throw new Error(`safe: chain ${chainId} not configured (see apps/wallet/src/chains.ts)`)
  const cached = transportCache.get(cfg.rpcUrl)
  if (cached) return cached
  const transport = http(cfg.rpcUrl)
  transportCache.set(cfg.rpcUrl, transport)
  return transport
}

/**
 * Derive the counterfactual Safe smart-account address on a specific chain.
 * Defaults to the primary chain (Base). For cross-chain verification use
 * verifyAddressAcrossChains().
 */
export async function safeAddressFromAccount(
  account: WebAuthnAccount,
  chainId: number = PRIMARY_CHAIN_ID
): Promise<Address> {
  const client = createPublicClient({ transport: transportFor(chainId) })
  const safe = await toSafeSmartAccount({
    client,
    owners: [account],
    version: SAFE_VERSION,
    entryPoint: { address: entryPoint07Address, version: '0.7' }
  })
  return safe.address
}

/**
 * Derive the address on every configured chain and assert they all match.
 * Use this as a self-check before caching the address for cross-chain use —
 * if the invariant ever breaks (Safe Singleton Factory not deployed on a
 * new chain we add, version mismatch, etc.) we want to know loudly.
 *
 * Returns the shared address. Throws if any chain produces a different
 * address.
 */
export async function verifyAddressAcrossChains(account: WebAuthnAccount): Promise<{
  address: Address
  chains: Array<{ chainId: number; address: Address }>
}> {
  const chains = listChains()
  if (chains.length === 0) throw new Error('verifyAddressAcrossChains: no chains configured')

  const results: Array<{ chainId: number; address: Address }> = []
  for (const cfg of chains) {
    const addr = await safeAddressFromAccount(account, cfg.chainId)
    results.push({ chainId: cfg.chainId, address: addr })
  }

  const reference = results[0].address
  const mismatch = results.find((r) => r.address.toLowerCase() !== reference.toLowerCase())
  if (mismatch) {
    throw new Error(
      `verifyAddressAcrossChains: address differs across chains: ${results
        .map((r) => `${r.chainId}=${r.address}`)
        .join(', ')}`
    )
  }

  return { address: reference, chains: results }
}

/** Diagnostic only: list configured chains. */
export function configuredChains() {
  return Array.from(Object.keys(CHAINS)).map((id) => Number(id))
}
