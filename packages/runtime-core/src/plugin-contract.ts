/**
 * Plugin contract.
 *
 * KON v2 plugins are independently-versioned IPFS objects loaded by the
 * runtime. Each plugin exports a Preact component as its default export.
 * The component receives a single `props` object (shape defined per plugin)
 * + a `context` object containing resolved deployment + wallet sdk handle.
 *
 * Phase 1 loads plugins via a static registry in the runtime. Phase 5
 * (publish pipeline) wires dynamic IPFS-CID loading via Blob URL +
 * dynamic import. The contract here is stable across both loading
 * strategies — plugins don't need to know how they were loaded.
 */

import type { ResolvedDeployment } from './defaults'

/**
 * Wallet handle exposed to plugins via context. Plugins call this to
 * request derived keys (for SEA, E2EE, etc) or sign transactions without
 * having to construct their own WalletSdk instance — the runtime keeps a
 * singleton so popups are deduplicated across plugins.
 *
 * Typed as opaque here so runtime-core stays free of the wallet-sdk dep;
 * the runtime instantiates the real WalletSdk and assigns it.
 */
export interface KonPluginWallet {
  readonly walletOrigin: string
  requestKeyDerivation(label: string): Promise<{ key: `0x${string}` }>
}

export interface KonPluginContext {
  /** Resolved deployment for the current app. */
  deployment: ResolvedDeployment
  /** App identifier (manifest.app.id). */
  appId: string
  /** Singleton wallet handle for plugins that need signed actions / derived keys. */
  wallet: KonPluginWallet
}

/**
 * Plugin component signature. Plugin packages export a Preact component
 * that matches this shape as the default export.
 *
 * We deliberately type props as `unknown` here — each plugin narrows the
 * shape it expects via Zod / its own type guards. The runtime cannot
 * statically know each plugin's prop shape.
 */
export type KonPluginComponent<TProps = unknown> = (args: {
  props: TProps
  context: KonPluginContext
}) => unknown
