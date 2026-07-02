import { signal } from '@preact/signals'
import type { KonEntryV1, KonManifestV1, ResolvedDeployment } from '@konxyz/runtime-core'

export type BootStage =
  | 'idle'
  | 'reading-entry-ref'
  | 'resolving-ens'
  | 'fetching-entry'
  | 'fetching-manifest'
  | 'rendering'
  | 'ready'
  | 'error'

export const stage = signal<BootStage>('idle')
export const stageDetail = signal<string>('')
export const entry = signal<KonEntryV1 | null>(null)
export const manifest = signal<KonManifestV1 | null>(null)
export const deployment = signal<ResolvedDeployment | null>(null)
export const errorMessage = signal<string | null>(null)

export function setStage(next: BootStage, detail = '') {
  stage.value = next
  stageDetail.value = detail
}

export function setError(message: string) {
  errorMessage.value = message
  stage.value = 'error'
}
