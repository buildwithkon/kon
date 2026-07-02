/**
 * Resolve the deployment context the dashboard runs in.
 *
 * The dashboard is itself a `my.<ens_domain>` deployment. Self-host operators
 * publish their own bundle to their own domain — `my.myfestival.com` paired
 * with `id.myfestival.com`. To stay generic the dashboard derives both
 * origins from the current page hostname rather than hardcoding `kon.xyz`.
 *
 * Rules:
 *   1. If the page is loaded at `my.<root>`, the ens domain is `<root>`,
 *      the wallet origin is `https://id.<root>`, the pin endpoint is
 *      `https://gateway.<root>/api/pin`.
 *   2. Otherwise (localhost / preview / odd hostname), fall back to the
 *      KON-managed defaults — this is the dev-loop path.
 *
 * Vite-only dev overrides (read from import.meta.env at build time):
 *
 *   VITE_DEV_WALLET_ORIGIN     overrides wallet_origin
 *   VITE_DEV_PIN_ENDPOINT      overrides ipfs_pin_endpoint
 *
 * These let the local smoke test (docs/smoke-test.md) point the
 * dashboard at a locally-running relay-ipfs + locally-running account
 * origin without needing the production KON-managed deployment to exist
 * yet. Production builds leave both unset.
 */

import { KON_DEFAULTS, type ResolvedDeployment } from '@konxyz/runtime-core'

const DEV_WALLET_ORIGIN = (import.meta.env.VITE_DEV_WALLET_ORIGIN as string | undefined) ?? ''
const DEV_PIN_ENDPOINT = (import.meta.env.VITE_DEV_PIN_ENDPOINT as string | undefined) ?? ''

function applyDevOverrides(d: ResolvedDeployment): ResolvedDeployment {
  if (DEV_WALLET_ORIGIN) d.wallet_origin = DEV_WALLET_ORIGIN
  if (DEV_PIN_ENDPOINT) d.ipfs_pin_endpoint = DEV_PIN_ENDPOINT
  return d
}

function defaults(): ResolvedDeployment {
  return applyDevOverrides({
    wallet_origin: KON_DEFAULTS.wallet_origin,
    ens_domain: KON_DEFAULTS.ens_domain,
    gun_peers: [...KON_DEFAULTS.gun_peers],
    ipfs_gateways: [...KON_DEFAULTS.ipfs_gateways],
    ipfs_pin_endpoint: KON_DEFAULTS.ipfs_pin_endpoint
  })
}

export function resolveDashboardDeployment(): ResolvedDeployment {
  if (typeof window === 'undefined') return defaults()
  const host = window.location.hostname
  // Strip a leading "my." label only if present; everything else is the
  // ens_domain. Hosts like "localhost" or "127.0.0.1" fail this regex and
  // fall through to the defaults.
  const match = /^my\.(.+)$/.exec(host)
  if (match && match[1] && match[1].includes('.')) {
    const root = match[1]
    return applyDevOverrides({
      wallet_origin: `https://id.${root}`,
      ens_domain: root,
      gun_peers: [...KON_DEFAULTS.gun_peers],
      ipfs_gateways: [...KON_DEFAULTS.ipfs_gateways],
      ipfs_pin_endpoint: `https://gateway.${root}/api/pin`
    })
  }
  return defaults()
}
