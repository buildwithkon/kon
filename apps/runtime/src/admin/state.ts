/**
 * Admin Dashboard state.
 *
 * The dashboard maintains a draft manifest separate from the one
 * loaded into the runtime. Edits go into the draft; clicking
 * "Publish" sends the draft through the publish pipeline. The
 * loaded `manifest` signal stays in sync with what the live app
 * actually renders — never with mid-edit drafts.
 *
 * In Phase 8 the draft will sync to a GUN graph workspace so multiple
 * committee members can co-edit before publish. For now it's local
 * to the current tab.
 */

import { signal, computed } from '@preact/signals'
import type { KonManifestV1 } from '@konxyz/runtime-core'
import { validateSubname } from '@konxyz/runtime-core'
import { KonManifestV1Schema } from '@konxyz/schemas'
import { manifest as loadedManifest } from '../state'

export type ValidationResult = { ok: true } | { ok: false; issues: Array<{ path: string; message: string }> }

export const draft = signal<KonManifestV1 | null>(null)
export const initialJson = signal<string | null>(null)
export const signInState = signal<
  | { status: 'idle' }
  | { status: 'signing' }
  | { status: 'signed'; address: `0x${string}`; ens?: string }
  | { status: 'error'; message: string }
>({ status: 'idle' })

export const publishState = signal<
  | { status: 'idle' }
  | { status: 'preparing' }
  | { status: 'uploading' }
  | { status: 'signing' }
  | { status: 'success'; cid: string; txHash?: string }
  | { status: 'error'; message: string }
>({ status: 'idle' })

export const isDirty = computed(() => {
  if (!draft.value || !initialJson.value) return false
  return JSON.stringify(draft.value) !== initialJson.value
})

export const validation = computed<ValidationResult>(() => {
  if (!draft.value) return { ok: true }
  const issues: Array<{ path: string; message: string }> = []

  const schemaResult = KonManifestV1Schema.safeParse(draft.value)
  if (!schemaResult.success) {
    for (const i of schemaResult.error.issues) {
      issues.push({ path: i.path.join('.') || '(root)', message: i.message })
    }
  }

  // Additional check: the leftmost label of app.id (i.e. the ENS subname
  // the organizer is claiming) must not be reserved. Skipping this when
  // the schema already rejected the value avoids piling on redundant
  // errors for an obviously-broken id.
  const id = draft.value.app?.id
  if (typeof id === 'string' && id.length > 0) {
    const leftmost = id.split('.')[0]
    if (leftmost) {
      const sub = validateSubname(leftmost)
      if (!sub.ok) {
        issues.push({ path: 'app.id', message: sub.reason ?? 'invalid subname' })
      }
    }
  }

  if (issues.length === 0) return { ok: true }
  return { ok: false, issues }
})

/**
 * Populate the draft from the loaded manifest. Called when the user
 * enters the dashboard for the first time, or on demand to reset.
 */
export function initDraft(): void {
  const m = loadedManifest.value
  if (!m) {
    draft.value = null
    initialJson.value = null
    return
  }
  const clone = structuredClone(m)
  draft.value = clone
  initialJson.value = JSON.stringify(clone)
}

/**
 * Apply an updater to the draft. The updater mutates a clone in place;
 * this avoids forcing call sites to do full-structure spread-cloning.
 */
export function updateDraft(updater: (m: KonManifestV1) => void): void {
  if (!draft.value) return
  const next = structuredClone(draft.value)
  updater(next)
  draft.value = next
}

export function resetDraft(): void {
  initDraft()
}
