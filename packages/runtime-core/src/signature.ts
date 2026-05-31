/**
 * Manifest signing helpers (Phase 1 — types + canonicalization only).
 *
 * The actual signing implementation lands in Phase 5 (publish pipeline),
 * because it depends on the wallet-sdk + Safe + paymaster wiring from
 * Phase 2.6. For now we lock down the canonical-JSON shape so the manifest
 * format is stable from day one.
 */

import type { Did, KonManifestV1 } from './types'

export interface ManifestSignature {
  publisher: Did
  /** Hex-encoded signature over the canonical JSON of the manifest sans this field. */
  signature: string
  /** ISO 8601 — when the signature was produced. */
  signed_at: string
}

/**
 * Stable JSON serialization for manifest signing.
 *
 * Production note: this is a simple deterministic JSON.stringify with sorted
 * keys, sufficient for KON's manifest shapes. If we ever need to interop with
 * external systems that expect RFC 8785 (JCS), swap this for a JCS lib.
 * The output of this function is what the publisher signs.
 */
export function canonicalize(manifest: Omit<KonManifestV1, 'signature'>): string {
  return JSON.stringify(sortKeys(manifest))
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    const keys = Object.keys(value as Record<string, unknown>).toSorted()
    for (const key of keys) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}
