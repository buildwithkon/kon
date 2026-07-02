/**
 * Dashboard state.
 *
 * Until the ENS subname indexer ships (Phase 8), the list of apps an
 * organizer owns is stored in localStorage keyed by their Safe address.
 * On Phase 8 this is replaced by a viem query against the ENS resolver
 * that enumerates contenthash records where the owner === signed-in
 * address — but the UI shape (the same `OwnedApp[]`) stays unchanged so
 * the swap is a single module replacement.
 */

import { signal, computed } from '@preact/signals'
import { resolveDashboardDeployment } from './deployment'

export interface OwnedApp {
  /** ENS subname, e.g. "ethtokyo.kon.xyz". */
  id: string
  /** Human-visible app name. */
  name: string
  /** Most recent published entry CID (or null when not yet published). */
  entryCid: string | null
  /** ISO timestamp the dashboard created or last touched this record. */
  updatedAt: string
}

export type SignInState =
  | { status: 'idle' }
  | { status: 'signing' }
  | { status: 'signed'; address: `0x${string}`; ens?: string }
  | { status: 'error'; message: string }

export const deployment = signal(resolveDashboardDeployment())
export const signInState = signal<SignInState>({ status: 'idle' })
export const ownedApps = signal<OwnedApp[]>([])

export const signedAddress = computed<`0x${string}` | null>(() => {
  const s = signInState.value
  return s.status === 'signed' ? s.address : null
})

function storageKey(address: string): string {
  return `kon.dashboard.apps:${address.toLowerCase()}`
}

export function loadOwnedApps(address: string): void {
  if (typeof localStorage === 'undefined') {
    ownedApps.value = []
    return
  }
  try {
    const raw = localStorage.getItem(storageKey(address))
    if (!raw) {
      ownedApps.value = []
      return
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      ownedApps.value = parsed as OwnedApp[]
      return
    }
  } catch {
    // ignore parse failure; treat as empty
  }
  ownedApps.value = []
}

export function persistOwnedApps(address: string, apps: OwnedApp[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(storageKey(address), JSON.stringify(apps))
  ownedApps.value = apps
}

/**
 * Append a newly-claimed subname to the stored list. Real provisioning
 * (ENS setSubnodeOwner + contenthash write) happens via the wallet popup;
 * this just records it locally so the UI surfaces the new card.
 */
export function recordNewApp(address: string, app: OwnedApp): void {
  const next = [...ownedApps.value.filter((a) => a.id !== app.id), app]
  persistOwnedApps(address, next)
}
