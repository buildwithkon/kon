/**
 * Dev-only app loader.
 *
 * In production the runtime resolves an entry CID (ENS / meta / query) and
 * fetches the manifest from IPFS. That round-trip is overkill when you just
 * want to dogfood an in-repo app locally, so in dev we can boot any
 * `apps/<name>/manifest.source.json` directly — no IPFS pin, no ENS write.
 *
 *   bun @runtime:dev
 *   open http://127.0.0.1:5174/?app=ethtokyo
 *
 * This module is imported only from boot.ts's dev branch (guarded by
 * `import.meta.env.DEV`), so the `import.meta.glob` below — and the bundled
 * manifest sources — are dropped from production builds.
 */

import type { KonDeploymentV1 } from '@konxyz/runtime-core'

// All in-repo app manifest sources, keyed by app directory name.
// `apps/<name>/manifest.source.json` → { '<name>': <parsed manifest> }.
const SOURCES = import.meta.glob('../../*/manifest.source.json', {
  eager: true,
  import: 'default'
})

export const DEV_APP_MANIFESTS: Record<string, unknown> = Object.fromEntries(
  Object.entries(SOURCES).map(([path, manifest]) => {
    const match = /\/([^/]+)\/manifest\.source\.json$/.exec(path)
    return [match ? match[1] : path, manifest]
  })
)

/**
 * Pick which in-repo app to boot in dev. Precedence:
 *   1. `?app=<name>` URL query (per-tab override)
 *   2. `VITE_DEV_APP` env (set a default app for `bun @runtime:dev`)
 *   3. null — caller falls back to the bundled all-plugins demo preset.
 */
export function pickDevAppName(search: string, viteDevApp?: string): string | null {
  const fromQuery = new URLSearchParams(search).get('app')
  if (fromQuery) return fromQuery
  if (viteDevApp) return viteDevApp
  return null
}

/**
 * Rewrite a manifest's declared deployment so a locally-booted app talks to
 * local services instead of the production stack:
 *   - gun_peers → the local relay-gun (so Forum chat works offline). The
 *     manifest's declared (production) peers are dropped in dev to avoid
 *     dead-peer console noise; override the local peer with VITE_DEV_GUN_PEER.
 *   - wallet_origin → only set when VITE_DEV_WALLET_ORIGIN is provided. Left
 *     untouched otherwise so the runtime's in-process dev wallet stub handles
 *     key derivation without a (popup-blocked) round-trip to id.kon.xyz.
 *
 * Every other declared field (ipfs_gateways, ens_domain, …) is preserved.
 */
export function devDeploymentOverride(
  declared: KonDeploymentV1 | undefined,
  env: { gunPeer?: string; walletOrigin?: string }
): KonDeploymentV1 {
  const gunPeer = env.gunPeer || 'http://localhost:8765/gun'
  return {
    ...declared,
    gun_peers: [gunPeer],
    ...(env.walletOrigin ? { wallet_origin: env.walletOrigin } : {})
  }
}
