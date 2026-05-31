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

export interface KonPluginContext {
  /** Resolved deployment for the current app. */
  deployment: ResolvedDeployment
  /** App identifier (manifest.app.id). */
  appId: string
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
