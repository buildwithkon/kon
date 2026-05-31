/**
 * Public Runtime boot sequence.
 *
 *   1. Read the entry reference (URL query / meta tag / ENS contenthash)
 *   2. Fetch the entry JSON from IPFS, validate
 *   3. Resolve deployment (merge entry-side override with KON defaults)
 *   4. Fetch the manifest JSON from IPFS, validate
 *   5. Hand off to the rendering layer (App component reacts to signals)
 *
 * The bootstrap is intentionally chatty via `setStage` so the diagnostic
 * UI can show progress. In production the SW pre-caches step 2+4 by CID,
 * so warm boots skip most of this.
 */

import { resolveDeployment } from '@konxyz/runtime-core'
import { KonEntryV1Schema, KonManifestV1Schema } from '@konxyz/schemas'
import { resolveEntryRef } from './ens-resolve'
import { fetchIpfsJson } from './ipfs-fetch'
import { deployment, entry, manifest, setError, setStage } from './state'

export async function boot() {
  try {
    setStage('reading-entry-ref')
    const { ref, via } = await resolveEntryRef()
    setStage('reading-entry-ref', `resolved via ${via}: ${ref}`)

    // First gateway fetch uses bootstrap defaults; once we read the entry
    // and its manifest we can switch to the manifest.deployment.ipfs_gateways
    // for subsequent fetches.
    const bootstrapDeployment = resolveDeployment()

    setStage('fetching-entry')
    const entryJson = await fetchIpfsJson(ref, { gateways: bootstrapDeployment.ipfs_gateways })
    const entryParsed = KonEntryV1Schema.safeParse(entryJson)
    if (!entryParsed.success) {
      throw new Error(`entry failed schema validation: ${formatIssues(entryParsed.error.issues)}`)
    }
    entry.value = entryParsed.data as unknown as typeof entry.value

    setStage('fetching-manifest')
    const manifestJson = await fetchIpfsJson(entryParsed.data.manifest, {
      gateways: bootstrapDeployment.ipfs_gateways
    })
    const manifestParsed = KonManifestV1Schema.safeParse(manifestJson)
    if (!manifestParsed.success) {
      throw new Error(`manifest failed schema validation: ${formatIssues(manifestParsed.error.issues)}`)
    }
    manifest.value = manifestParsed.data as unknown as typeof manifest.value
    deployment.value = resolveDeployment(manifestParsed.data.deployment)

    setStage('rendering')
    // Phase 2 (#9) wires actual page/plugin rendering. For now we mark ready
    // and let App render a manifest summary.
    setStage('ready')
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e))
  }
}

// biome-ignore lint/suspicious/noExplicitAny: zod issue shape is well-known
function formatIssues(issues: any[]): string {
  return issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
}
