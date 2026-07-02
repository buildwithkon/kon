/**
 * Plugin registry.
 *
 * Two paths coexist:
 *
 *   1. Built-in plugins (KON-shipped) are statically imported at build
 *      time so apps/runtime can render them with zero extra round-trips.
 *      Resolution is by `id` — the manifest's plugin.id field is the
 *      lookup key. Plugin authors who ship via this path live in
 *      packages/plugins/<name>/.
 *
 *   2. Third-party plugins are loaded dynamically by their IPFS source
 *      CID (KonPluginV1.source). See dynamic-plugin-loader.ts.
 *
 * The page renderer in app.tsx calls resolvePlugin(plugin) which returns
 * either a synchronous component (path 1) or a thenable (path 2).
 */

import type { KonPluginComponent, KonPluginV1, ResolvedDeployment } from '@konxyz/runtime-core'
import Badge from '@konxyz/plugin-badge'
import BuildWith from '@konxyz/plugin-build-with'
import Forum from '@konxyz/plugin-forum'
import Ical from '@konxyz/plugin-ical'
import Iframe from '@konxyz/plugin-iframe'
import Markdown from '@konxyz/plugin-markdown'
import ProfileCard from '@konxyz/plugin-profile-card'
import { resolveDynamicPlugin } from './dynamic-plugin-loader'

export const BUILTIN_PLUGINS: Record<string, KonPluginComponent> = {
  badge: Badge as KonPluginComponent,
  'build-with': BuildWith as KonPluginComponent,
  forum: Forum as KonPluginComponent,
  ical: Ical as KonPluginComponent,
  iframe: Iframe as KonPluginComponent,
  markdown: Markdown as KonPluginComponent,
  'profile-card': ProfileCard as KonPluginComponent
}

export type PluginResolution =
  | { kind: 'builtin'; component: KonPluginComponent }
  | { kind: 'dynamic'; promise: Promise<KonPluginComponent>; source: string }
  | { kind: 'unknown'; reason: string }

/**
 * Resolve a manifest plugin reference to a component (sync) or a load
 * promise (async). Callers handle both forms — see PluginRenderer in
 * app.tsx for the canonical async-handling pattern.
 */
export function resolvePlugin(plugin: KonPluginV1, deployment: ResolvedDeployment): PluginResolution {
  const builtin = BUILTIN_PLUGINS[plugin.id]
  if (builtin) return { kind: 'builtin', component: builtin }

  if (typeof plugin.source === 'string' && plugin.source.startsWith('ipfs://')) {
    return {
      kind: 'dynamic',
      source: plugin.source,
      promise: resolveDynamicPlugin(plugin.source, { gateways: deployment.ipfs_gateways })
    }
  }

  return {
    kind: 'unknown',
    reason: `plugin '${plugin.id}' not in built-in registry and no ipfs:// source available`
  }
}
