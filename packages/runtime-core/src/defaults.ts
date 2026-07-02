/**
 * KON-managed defaults.
 *
 * !!! THIS IS THE ONLY FILE IN THE CODEBASE WHERE LITERAL KON-MANAGED
 * ORIGINS MAY APPEAR. CI lint (added in task #7) forbids these strings
 * anywhere else.
 *
 * Self-host requirement: every consumer must read deployment via
 * `resolveDeployment(manifest.deployment)` so a custom manifest can
 * override the entire stack without code changes.
 */

import type { KonDeploymentV1 } from './types'

export const KON_DEFAULTS = {
  wallet_origin: 'https://id.kon.xyz',
  ens_domain: 'kon.xyz',
  gun_peers: ['https://relay.kon.xyz/gun', 'https://relay.peer.ooo/gun'],
  ipfs_gateways: [
    'https://gateway.kon.xyz',
    'https://w3s.link',
    'https://ipfs.io',
    'https://cloudflare-ipfs.com'
  ],
  ipfs_pin_endpoint: 'https://gateway.kon.xyz/api/pin'
} as const satisfies Required<KonDeploymentV1>

export type ResolvedDeployment = {
  wallet_origin: string
  ens_domain: string
  gun_peers: string[]
  ipfs_gateways: string[]
  ipfs_pin_endpoint: string
}

/**
 * Merge a deployment override block with the KON-managed defaults.
 * The runtime calls this once on boot, then threads the result through every
 * subsystem (wallet SDK, GUN init, IPFS fetch).
 */
export function resolveDeployment(override?: KonDeploymentV1): ResolvedDeployment {
  return {
    wallet_origin: override?.wallet_origin ?? KON_DEFAULTS.wallet_origin,
    ens_domain: override?.ens_domain ?? KON_DEFAULTS.ens_domain,
    gun_peers: override?.gun_peers ? [...override.gun_peers] : [...KON_DEFAULTS.gun_peers],
    ipfs_gateways: override?.ipfs_gateways ? [...override.ipfs_gateways] : [...KON_DEFAULTS.ipfs_gateways],
    ipfs_pin_endpoint: override?.ipfs_pin_endpoint ?? KON_DEFAULTS.ipfs_pin_endpoint
  }
}
