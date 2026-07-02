/**
 * Dynamic plugin loader.
 *
 * Phase 1 ships KON-shipped plugins via static imports in plugin-registry.ts
 * for speed. For third-party / custom plugins referenced by their IPFS CID
 * in `KonPluginV1.source`, this module fetches the JS bundle bytes from an
 * IPFS gateway and turns them into a callable component via Blob URL +
 * dynamic import.
 *
 * Constraints on dynamically-loaded plugin bundles:
 *   - Must be a self-contained ES module that default-exports a
 *     KonPluginComponent.
 *   - Bare imports (`import { h } from 'preact'`) resolve via the import
 *     map shipped in apps/runtime/index.html. Plugin authors should NOT
 *     bundle preact / preact/hooks / @preact/signals into their plugin
 *     bundle — the runtime provides them.
 *
 * Cached by source URI so reopening a page does not re-fetch + re-eval.
 * The cache is process-lifetime; the service worker provides the
 * across-reload caching for the bytes themselves.
 */

import type { KonPluginComponent } from '@konxyz/runtime-core'
import { fetchIpfsBytes } from './ipfs-fetch'

const cache = new Map<string, Promise<KonPluginComponent>>()

export interface DynamicLoadOptions {
  gateways: string[]
}

export function resolveDynamicPlugin(uri: string, opts: DynamicLoadOptions): Promise<KonPluginComponent> {
  const existing = cache.get(uri)
  if (existing) return existing
  const promise = loadOnce(uri, opts)
  cache.set(uri, promise)
  // If the load rejects, drop the cached promise so future attempts can retry.
  promise.catch(() => cache.delete(uri))
  return promise
}

async function loadOnce(uri: string, opts: DynamicLoadOptions): Promise<KonPluginComponent> {
  const bytes = await fetchIpfsBytes(uri, { gateways: opts.gateways })
  // Use application/javascript so the browser interprets the Blob as a
  // module when dynamic-imported. Plugin bundles must be ES modules.
  const blob = new Blob([bytes as BlobPart], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)
  try {
    const mod = await import(/* @vite-ignore */ url)
    const component = mod?.default
    if (typeof component !== 'function') {
      throw new Error(`plugin at ${uri} has no default-exported component`)
    }
    return component as KonPluginComponent
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Clear the in-memory cache. The SW cache for the underlying CIDs is not affected. */
export function clearDynamicPluginCache(): void {
  cache.clear()
}
