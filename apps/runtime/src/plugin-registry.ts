/**
 * Plugin registry.
 *
 * Phase 1: KON-shipped plugins are statically imported and registered by id.
 * Phase 5: dynamic IPFS-CID loading via Blob URL + dynamic import will sit
 * alongside this registry — third-party plugins fetch by `source: ipfs://CID`
 * while KON-shipped ones short-circuit via this table for speed.
 *
 * Adding a new built-in plugin = add a workspace dep + one line here.
 */

import type { KonPluginComponent } from '@konxyz/runtime-core'
import Badge from '@konxyz/plugin-badge'
import BuildWith from '@konxyz/plugin-build-with'
import Forum from '@konxyz/plugin-forum'
import Iframe from '@konxyz/plugin-iframe'

export const BUILTIN_PLUGINS: Record<string, KonPluginComponent> = {
  badge: Badge as KonPluginComponent,
  'build-with': BuildWith as KonPluginComponent,
  forum: Forum as KonPluginComponent,
  iframe: Iframe as KonPluginComponent
}

export function resolvePlugin(id: string): KonPluginComponent | null {
  return BUILTIN_PLUGINS[id] ?? null
}
