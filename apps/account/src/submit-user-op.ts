/**
 * Submit an ERC-4337 UserOperation through the configured bundler +
 * paymaster pair.
 *
 * Pipeline:
 *   1. Build a Safe smart-account client tied to the user's passkey.
 *      Same code path as safeAddressFromAccount() — the address derived
 *      from this is the address the UserOp executes against.
 *   2. Wrap it in permissionless's `createSmartAccountClient`. The bundler
 *      transport points at Pimlico; the optional paymaster transport
 *      points at Coinbase (default) or Pimlico (fallback) per chains.ts.
 *   3. Call `sendUserOperation({ calls: [...] })`. permissionless +
 *      viem 2.51 takes care of:
 *        - Fetching the EntryPoint nonce
 *        - Building the UserOperation v0.7 fields
 *        - Asking the paymaster to fill `paymasterAndData`
 *        - Signing the userOpHash with the passkey (WebAuthn assertion)
 *        - Submitting to the bundler
 *   4. Return the userOpHash. The bundler will lift it to a transaction
 *      hash a few seconds later; the dashboard's UI shows the userOpHash
 *      as the immediate response and can poll for finality separately.
 *
 * On the first UserOp the Safe contract isn't deployed yet; the
 * permissionless integration handles atomic deploy + execute via the
 * EntryPoint's `initCode` field. No special handling needed at this
 * layer.
 */

import { createPublicClient, http } from 'viem'
import { createPaymasterClient, entryPoint07Address } from 'viem/account-abstraction'
import type { WebAuthnAccount } from 'viem/account-abstraction'
import { toSafeSmartAccount } from 'permissionless/accounts'
import { createSmartAccountClient } from 'permissionless'
import { getChain, PAYMASTER_VENDOR, PIMLICO_CONFIGURED } from './chains'

const SAFE_VERSION = '1.4.1' as const

export interface SubmitUserOpRequest {
  chainId: number
  to: `0x${string}`
  data: `0x${string}`
  value?: `0x${string}`
}

export interface SubmitUserOpResult {
  userOpHash: `0x${string}`
  /** Which paymaster (if any) sponsored the gas. Useful for the UI badge. */
  paymasterVendor: 'coinbase' | 'pimlico' | 'none'
}

/**
 * Build the smart-account client + send a UserOperation. Throws if the
 * bundler isn't configured (caller should gate on `PIMLICO_CONFIGURED`
 * before calling, then fall back to a stub for dev iteration).
 */
export async function submitUserOp(
  account: WebAuthnAccount,
  req: SubmitUserOpRequest
): Promise<SubmitUserOpResult> {
  if (!PIMLICO_CONFIGURED) {
    throw new Error('submitUserOp: VITE_PIMLICO_API_KEY not set — bundler unreachable')
  }
  const chain = getChain(req.chainId)
  if (!chain) throw new Error(`submitUserOp: chain ${req.chainId} not configured`)
  if (!chain.bundlerUrl) {
    throw new Error(`submitUserOp: bundler URL empty for chain ${req.chainId}`)
  }

  // Same construction as safeAddressFromAccount — must yield the same
  // counterfactual address.
  const publicClient = createPublicClient({ transport: http(chain.rpcUrl) })
  const safeAccount = await toSafeSmartAccount({
    client: publicClient,
    owners: [account],
    version: SAFE_VERSION,
    entryPoint: { address: entryPoint07Address, version: '0.7' }
  })

  // Optional paymaster — only when one is configured. Without a paymaster,
  // the Safe pays its own gas (which means the first UserOp fails unless
  // the Safe is pre-funded; we don't currently surface that flow in the UI).
  const paymasterClient = chain.paymasterUrl
    ? createPaymasterClient({ transport: http(chain.paymasterUrl) })
    : undefined

  const smartAccountClient = createSmartAccountClient({
    account: safeAccount,
    chain: chain.viemChain,
    bundlerTransport: http(chain.bundlerUrl),
    ...(paymasterClient
      ? {
          paymaster: paymasterClient,
          // Pimlico's paymaster needs `paymasterContext.sponsorshipPolicyId`
          // to know which policy to apply. Coinbase's paymaster uses the
          // CDP project's dashboard-side allowlist instead.
          ...(PAYMASTER_VENDOR === 'pimlico' && chain.sponsorshipPolicyId
            ? { paymasterContext: { sponsorshipPolicyId: chain.sponsorshipPolicyId } }
            : {})
        }
      : {})
  })

  const userOpHash = await smartAccountClient.sendUserOperation({
    calls: [
      {
        to: req.to,
        data: req.data,
        value: BigInt(req.value ?? '0x0')
      }
    ]
  })

  return {
    userOpHash,
    paymasterVendor: PAYMASTER_VENDOR
  }
}
