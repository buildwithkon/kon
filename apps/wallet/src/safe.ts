/**
 * Safe smart account derivation from a passkey-backed WebAuthn account.
 *
 * - Uses Safe v1.4.1 with the ERC-4337 module + WebAuthn shared signer +
 *   P256 verifier (permissionless picks the right module addresses per chain).
 * - The address is counterfactual — derived from the passkey publicKey
 *   without deploying. The first transaction the user signs will deploy
 *   the proxy.
 * - Cross-chain: predeterministic deploy via Safe{Core} v1.4.1 + the same
 *   passkey owner produces the same address on every supported chain, so
 *   one identity covers Base + future chains.
 *
 * Chain choice: KON uses Base for AppCoin contracts; we pin Base here.
 * Multi-chain config will move into a runtime-driven map in step 8h.
 */

import { createPublicClient, http, type Address } from 'viem'
import { entryPoint07Address } from 'viem/account-abstraction'
import type { WebAuthnAccount } from 'viem/account-abstraction'
import { toSafeSmartAccount } from 'permissionless/accounts'

// Public client without a pinned chain. We don't pass `chain: base` because
// Base's block / transaction generics introduce a `deposit` tx variant that
// permissionless's type signature does not include — even though the runtime
// behavior is identical. Leaving chain off keeps the types aligned; the
// transport URL still pins us to Base.
const BASE_RPC = 'https://mainnet.base.org'
const publicClient = createPublicClient({
  transport: http(BASE_RPC)
})

const SAFE_VERSION = '1.4.1' as const

/**
 * Derive the counterfactual Safe smart-account address that the given
 * passkey-backed WebAuthn account owns. Does not deploy.
 *
 * Cross-chain note: Safe v1.4.1 + the same passkey owner produces the same
 * address on every supported chain via predeterministic deploy, so caching
 * a single address per passkey is sound. Step 8h tightens this with
 * explicit chain → bundler routing.
 */
export async function safeAddressFromAccount(account: WebAuthnAccount): Promise<Address> {
  const safe = await toSafeSmartAccount({
    client: publicClient,
    owners: [account],
    version: SAFE_VERSION,
    entryPoint: { address: entryPoint07Address, version: '0.7' }
  })
  return safe.address
}
