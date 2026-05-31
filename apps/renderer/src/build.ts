/**
 * Pure publish-time transformation:
 *   manifest source (author-friendly JSON)
 *     → validate against KonManifestV1Schema
 *     → emit canonical manifest.json (sorted keys for stable hashing)
 *     → emit entry.template.json (entry referencing manifest with a CID placeholder)
 *     → emit minimal index.html (Hono JSX-rendered)
 *
 * No IPFS upload, no ENS contenthash mutation — that's the Phase 5 publish
 * pipeline's responsibility. The renderer is deterministic: same input ⇒
 * byte-identical output. The pipeline reads our output, uploads each file,
 * substitutes real CIDs for the placeholders, and publishes.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { canonicalize, type KonEntryV1, type KonManifestV1 } from '@konxyz/runtime-core'
import { KonManifestV1Schema } from '@konxyz/schemas'
import { renderIndex } from './html'

export const MANIFEST_CID_PLACEHOLDER = 'ipfs://__REPLACE_ME_MANIFEST_CID__' as const

export interface BuildOptions {
  input: string
  output: string
  /** Runtime CID to embed in the entry. Default: a placeholder for Phase 1. */
  runtimeCid?: `ipfs://${string}`
}

export interface BuildResult {
  manifestPath: string
  entryTemplatePath: string
  htmlPath: string
  /** The canonical JSON the publisher will sign. */
  canonical: string
  manifest: KonManifestV1
  entryTemplate: KonEntryV1
}

export async function build(opts: BuildOptions): Promise<BuildResult> {
  const source = JSON.parse(await readFile(opts.input, 'utf8'))

  const parsed = KonManifestV1Schema.safeParse(source)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`manifest source failed schema validation:\n${issues}`)
  }
  // Cast: schema validates structurally identical types from runtime-core.
  const manifest = parsed.data as unknown as KonManifestV1

  // Canonicalize for stable hashing / signing.
  const canonical = canonicalize(manifest)

  // Entry template — the pipeline will substitute the manifest CID placeholder
  // after uploading manifest.json to IPFS.
  const entryTemplate: KonEntryV1 = {
    schema: 'kon-entry-v1',
    name: manifest.app.id,
    runtime: opts.runtimeCid ?? 'ipfs://__REPLACE_ME_RUNTIME_CID__',
    manifest: MANIFEST_CID_PLACEHOLDER,
    version: manifest.app.version,
    publishedAt: manifest.publishedAt
  }

  const html = renderIndex({
    name: manifest.app.name,
    entryCidPlaceholder: 'ipfs://__REPLACE_ME_ENTRY_CID__'
  })

  await mkdir(opts.output, { recursive: true })

  const manifestPath = join(opts.output, 'manifest.json')
  const entryTemplatePath = join(opts.output, 'entry.template.json')
  const htmlPath = join(opts.output, 'index.html')

  await writeFile(manifestPath, `${canonical}\n`)
  await writeFile(entryTemplatePath, `${JSON.stringify(entryTemplate, null, 2)}\n`)
  await writeFile(htmlPath, html)

  return {
    manifestPath,
    entryTemplatePath,
    htmlPath,
    canonical,
    manifest,
    entryTemplate
  }
}
