#!/usr/bin/env tsx
/**
 * kon-render CLI
 *
 * Usage:
 *   kon-render --input <manifest.source.json> --output <dir> [--runtime <ipfs://CID>]
 */

import { build } from './build'

function parseArgs(argv: string[]): { input?: string; output?: string; runtime?: string; help?: boolean } {
  const out: { input?: string; output?: string; runtime?: string; help?: boolean } = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') out.help = true
    else if (a === '--input') out.input = argv[++i]
    else if (a === '--output') out.output = argv[++i]
    else if (a === '--runtime') out.runtime = argv[++i]
  }
  return out
}

function usage(exit: number): never {
  console.log(`kon-render — KON v2 Static/IPFS Renderer

Usage:
  kon-render --input <manifest.source.json> --output <dir> [--runtime <ipfs://CID>]

Inputs:
  --input    Path to author-friendly manifest source JSON
  --output   Path to directory where the deterministic release files will be written
  --runtime  (optional) Shared runtime CID to embed in the entry. Defaults to a placeholder
             that the Phase 5 publish pipeline will substitute.

Output files in <dir>:
  manifest.json         Canonical KonManifestV1 (sorted keys, ready to sign + upload)
  entry.template.json   KonEntryV1 with placeholder for the manifest's eventual CID
  index.html            Minimal HTML shell for the runtime to attach to

This is a pure transformer — no IPFS upload, no ENS update. Those happen
in the Phase 5 publish pipeline which consumes our output.
`)
  process.exit(exit)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.input || !args.output) usage(args.help ? 0 : 1)

  const result = await build({
    input: args.input,
    output: args.output,
    runtimeCid: args.runtime as `ipfs://${string}` | undefined
  })

  console.log('kon-render: ✓ build complete')
  console.log(`  app:      ${result.manifest.app.id} v${result.manifest.app.version}`)
  console.log(`  manifest: ${result.manifestPath}`)
  console.log(`  entry:    ${result.entryTemplatePath}`)
  console.log(`  html:     ${result.htmlPath}`)
  console.log(`  bytes:    canonical manifest = ${result.canonical.length}`)
}

main().catch((e) => {
  console.error('kon-render: ✗', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
