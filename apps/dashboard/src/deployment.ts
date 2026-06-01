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
 * The fallback path is the only reason this module exists; in production
 * rule 1 always fires.
 */

import { KON_DEFAULTS, type ResolvedDeployment } from '@konxyz/runtime-core'

function defaults(): ResolvedDeployment {
  return {
    wallet_origin: KON_DEFAULTS.wallet_origin,
    ens_domain: KON_DEFAULTS.ens_domain,
    gun_peers: [...KON_DEFAULTS.gun_peers],
    ipfs_gateways: [...KON_DEFAULTS.ipfs_gateways],
    ipfs_pin_endpoint: KON_DEFAULTS.ipfs_pin_endpoint
  }
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
    return {
      wallet_origin: `https://id.${root}`,
      ens_domain: root,
      gun_peers: [...KON_DEFAULTS.gun_peers],
      ipfs_gateways: [...KON_DEFAULTS.ipfs_gateways],
      ipfs_pin_endpoint: `https://gateway.${root}/api/pin`
    }
  }
  return defaults()
}
