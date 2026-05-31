/**
 * Postmessage origin allowlist.
 *
 * Apps are expected to live at subdomains of the same apex domain as this
 * wallet origin (e.g. matsuri.kon.xyz, ethtokyo.kon.xyz when the wallet is
 * id.kon.xyz). We also allow ENS-resolved IPFS gateways (.limo) and the
 * apex IPFS gateways listed in defaults — those are the legitimate
 * additional paths apps may load from per the v2 architecture.
 *
 * Self-hosted deployments override this by editing the file and
 * rebuilding their own wallet bundle.
 */

import { KON_DEFAULTS } from '@konxyz/runtime-core'

/** Returns true if the postMessage event.origin is allowed to interact with this wallet. */
export function isAllowedAppOrigin(eventOrigin: string): boolean {
  if (!eventOrigin) return false
  let url: URL
  try {
    url = new URL(eventOrigin)
  } catch {
    return false
  }

  // Same apex domain (e.g. *.kon.xyz when wallet is at id.kon.xyz).
  if (matchesApex(url.hostname, KON_DEFAULTS.ens_domain)) return true

  // ENS gateway resolution (.limo etc).
  if (url.hostname.endsWith('.limo')) return true
  if (url.hostname.endsWith('.eth.link')) return true

  // Local dev for ad-hoc testing across apps/runtime + apps/wallet.
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true

  return false
}

function matchesApex(hostname: string, apex: string): boolean {
  if (hostname === apex) return true
  return hostname.endsWith(`.${apex}`)
}
