/**
 * Singleton WalletSdk instance shared across all plugins on this app.
 *
 * The runtime instantiates this once after the manifest resolves (because
 * the wallet origin comes from manifest.deployment.wallet_origin). Plugins
 * receive it via KonPluginContext.wallet so they never construct their
 * own — keeps popup management centralized and prevents duplicate
 * derivation prompts.
 */

import { WalletSdk } from '@konxyz/wallet-sdk'
import type { KonPluginWallet } from '@konxyz/runtime-core'

let instance: WalletSdk | null = null

export function ensureWallet(walletOrigin: string): KonPluginWallet {
  if (!instance || instance.walletOrigin !== walletOrigin) {
    instance = new WalletSdk({ walletOrigin })
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
