#!/usr/bin/env node
// KON v2 publish pipeline.
//
// Modes:
//   pnpm publish:app --app ethtokyo                  (dry-run: build + report)
//   pnpm publish:app --app ethtokyo --upload         (build + IPFS upload)
//   pnpm publish:app --app ethtokyo --publish        (above + ENS contenthash update)
//
// Env (only required for --upload / --publish):
//   W3_PRINCIPAL     ed25519 signing key from `w3 key create`
//   W3_PROOF         base64 delegation proof granting upload to your space
//   KON_DEPLOY_KEY   private key authorized to update the ENS subname
//
// Order of operations:
//   1. Run apps/renderer for the app's manifest source. Produces
//      manifest.json + entry.template.json + index.html under
//      dist/publish/<app>/. The renderer runs as a subprocess so its
//      Hono JSX config does not collide with this script's JS context.
//   2. (--upload) Upload manifest.json to IPFS -> manifestCid.
//   3. Substitute manifest CID placeholder in entry.template.json.
//   4. (--upload) Upload entry.json to IPFS -> entryCid.
//   5. Substitute entry CID placeholder in index.html.
//   6. (--publish) Update ENS contenthash on `<app>.kon.xyz` to entryCid.
//
// Plugin CID resolution and runtime CID upload are TODOs. KON-shipped
// plugins are statically imported into apps/runtime in Phase 1, so the
// entry's runtime CID placeholder is informational until we ship
// plugins as standalone IPFS objects.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { ensureClient, readCredentialsFromEnv, uploadFile } from './lib/w3up.mjs'
import { publishContenthash } from './lib/ens.mjs'

function parseArgs(argv) {
  const out = { app: '', upload: false, publish: false, help: false, runtime: '' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') out.help = true
    else if (a === '--app') out.app = argv[++i] ?? ''
    else if (a === '--runtime') out.runtime = argv[++i] ?? ''
    else if (a === '--upload') out.upload = true
    else if (a === '--publish') {
      out.upload = true
      out.publish = true
    }
  }
  return out
}

/**
 * Resolve the runtime CID for substitution into entry.template.json.
 * Precedence: --runtime CLI arg > KON_RUNTIME_CID env > .kon/runtime-cid.txt > null.
 * Returns { cid, source } so the operator sees where the value came from.
 */
async function resolveRuntimeCid(cliArg) {
  if (cliArg) return { cid: cliArg.replace(/^ipfs:\/\//, ''), source: '--runtime arg' }
  if (process.env.KON_RUNTIME_CID) {
    return { cid: process.env.KON_RUNTIME_CID.replace(/^ipfs:\/\//, ''), source: 'KON_RUNTIME_CID env' }
  }
  try {
    const raw = await readFile(join(REPO_ROOT, '.kon/runtime-cid.txt'), 'utf8')
    const cid = raw.trim()
    if (cid) return { cid, source: '.kon/runtime-cid.txt' }
  } catch {
    // file missing; fall through to null
  }
  return { cid: null, source: null }
}

function usage(exit) {
  const lines = [
    'kon publish - KON v2 release pipeline',
    '',
    'Usage:',
    '  pnpm publish:app --app <name>            dry-run (build only)',
    '  pnpm publish:app --app <name> --upload   build + IPFS upload',
    '  pnpm publish:app --app <name> --publish  above + ENS contenthash update',
    '',
    'Looks for apps/<name>/manifest.source.json as input. Writes release artifacts',
    'under dist/publish/<name>/.'
  ]
  console.log(lines.join('\n'))
  process.exit(exit)
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function runRendererSubprocess(input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'pnpm',
      ['--filter', '@konxyz/renderer', 'exec', 'tsx', 'src/index.ts', '--input', input, '--output', output],
      { cwd: REPO_ROOT, stdio: 'inherit' }
    )
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error('renderer exited with code ' + code))
    })
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.app) usage(args.help ? 0 : 1)

  const input = join(REPO_ROOT, 'apps', args.app, 'manifest.source.json')
  const output = join(REPO_ROOT, 'dist/publish', args.app)
  await mkdir(output, { recursive: true })

  console.log('[publish] step 1: render ' + args.app)
  await runRendererSubprocess(input, output)
  const manifestPath = join(output, 'manifest.json')
  const entryTemplatePath = join(output, 'entry.template.json')
  const htmlPath = join(output, 'index.html')

  const runtime = await resolveRuntimeCid(args.runtime)
  if (runtime.cid) {
    console.log('[publish]   runtime CID: ' + runtime.cid + ' (from ' + runtime.source + ')')
  } else {
    console.log(
      '[publish]   runtime CID: (none — entry will keep placeholder; run publish:runtime --upload first or pass --runtime <cid>)'
    )
  }

  if (!args.upload) {
    console.log('\n[publish] dry-run complete. Pass --upload to send to IPFS.')
    console.log('[publish] artifacts in ' + output)
    return
  }

  const creds = readCredentialsFromEnv()
  if (!creds) {
    console.error('\n[publish] x W3_PRINCIPAL / W3_PROOF env not set; cannot upload')
    process.exit(2)
  }

  console.log('\n[publish] step 2: upload manifest')
  const w3 = await ensureClient(creds)
  const manifestBytes = await readFile(manifestPath)
  const manifestCid = await uploadFile(w3, 'manifest.json', manifestBytes)
  console.log('[publish]   manifest CID: ' + manifestCid)

  console.log('\n[publish] step 3: substitute CIDs in entry')
  const entryTemplate = JSON.parse(await readFile(entryTemplatePath, 'utf8'))
  entryTemplate.manifest = 'ipfs://' + manifestCid
  if (runtime.cid) {
    entryTemplate.runtime = 'ipfs://' + runtime.cid
  }
  const entryPath = join(output, 'entry.json')
  await writeFile(entryPath, JSON.stringify(entryTemplate, null, 2) + '\n')

  console.log('\n[publish] step 4: upload entry')
  const entryBytes = await readFile(entryPath)
  const entryCid = await uploadFile(w3, 'entry.json', entryBytes)
  console.log('[publish]   entry CID: ' + entryCid)

  console.log('\n[publish] step 5: substitute entry CID in index.html')
  const htmlSrc = await readFile(htmlPath, 'utf8')
  const htmlOut = htmlSrc.replaceAll('__REPLACE_ME_ENTRY_CID__', entryCid)
  await writeFile(htmlPath, htmlOut)

  if (!args.publish) {
    console.log('\n[publish] upload complete. Pass --publish to update ENS contenthash.')
    console.log(
      '[publish] manual ENS update: set contenthash on ' + args.app + '.kon.xyz to ipfs://' + entryCid
    )
    return
  }

  console.log('\n[publish] step 6: update ENS contenthash')
  const result = await publishContenthash({
    ensName: args.app + '.kon.xyz',
    contenthash: 'ipfs://' + entryCid
  })
  if (result.applied) {
    console.log('[publish]   + ENS contenthash updated. tx: ' + result.txHash)
  } else {
    console.log('[publish]   ! ENS contenthash NOT updated: ' + result.reason)
    console.log('[publish]   manual: set contenthash on ' + args.app + '.kon.xyz to ipfs://' + entryCid)
  }

  console.log('\n[publish] + done')
}

main().catch((e) => {
  console.error('[publish] x', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
