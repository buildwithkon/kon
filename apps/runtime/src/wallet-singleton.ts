/**
 * Singleton AccountSDK instance shared across all plugins on this app.
 *
 * The runtime instantiates this once after the manifest resolves (because
 * the wallet origin comes from manifest.deployment.wallet_origin). Plugins
 * receive it via KonPluginContext.wallet so they never construct their
 * own — keeps popup management centralized and prevents duplicate
 * derivation prompts.
 */

import { AccountSDK } from '@konxyz/account-sdk'
import type { KonPluginWallet } from '@konxyz/runtime-core'

let instance: AccountSDK | null = null

// Phase 1 stub key — byte-identical to what apps/account returns from
// `approveDeriveKey` (apps/account/src/app.tsx). Used by the dev wallet
// shortcut below so the derived chat identity matches the real popup flow.
const DEV_STUB_KEY = '0x0000000000000000000000000000000000000000000000000000000000000001' as const

export function ensureWallet(walletOrigin: string): KonPluginWallet {
  // Dev shortcut: derive keys in-process instead of opening the wallet popup.
  // Plugins (e.g. Forum) request derivation on mount rather than from a user
  // gesture, so the popup would be blocked by the browser anyway. This lets
  // `bun @runtime:dev` run chat locally with just relay-gun — no account app.
  // Set VITE_DEV_WALLET_ORIGIN to instead exercise the real popup flow against
  // a locally-running apps/account.
  if (import.meta.env.DEV && !import.meta.env.VITE_DEV_WALLET_ORIGIN) {
    return {
      walletOrigin,
      async requestKeyDerivation() {
        return { key: DEV_STUB_KEY }
      }
    }
  }

  if (!instance || instance.walletOrigin !== walletOrigin) {
    instance = new AccountSDK({ walletOrigin })
  }
  // Adapt the public sdk surface to the narrower plugin handle.
  return {
    walletOrigin,
    async requestKeyDerivation(label: string) {
      const res = await instance!.requestKeyDerivation(label)
      return { key: res.key }
    }
  }
}
