#!/usr/bin/env node
// Publish apps/runtime (shared KON v2 runtime bundle).
//
// Modes:
//   pnpm publish:runtime           dry-run (build only)
//   pnpm publish:runtime --upload  build + upload dist/ to IPFS
//
// There is no --publish step: the runtime is referenced by CID from
// each app's entry.json (the `entry.runtime` field). Publishing the
// runtime gives us a CID which the publish:app pipeline substitutes
// for the __REPLACE_ME_RUNTIME_CID__ placeholder. Apps are pinned to a
// specific runtime CID — bumping the runtime requires re-publishing
// each app that wants the new version.
//
// Env (only required for --upload):
//   W3_PRINCIPAL / W3_PROOF     web3.storage delegation

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { ensureClient, readCredentialsFromEnv, uploadDirFromDisk } from './lib/w3up.mjs'

function parseArgs(argv) {
  const out = { upload: false }
  for (const a of argv) {
    if (a === '--upload') out.upload = true
  }
  return out
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RUNTIME_DIST = join(REPO_ROOT, 'apps/runtime/dist')

function buildRuntime() {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['--filter', '@konxyz/runtime', 'build'], {
      cwd: REPO_ROOT,
      stdio: 'inherit'
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error('runtime build exited with code ' + code))
    })
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('[publish:runtime] step 1: build runtime')
  await buildRuntime()
  console.log('[publish:runtime]   dist: ' + RUNTIME_DIST)

  if (!args.upload) {
    console.log('\n[publish:runtime] dry-run complete. Pass --upload to send to IPFS.')
    return
  }

  const creds = readCredentialsFromEnv()
  if (!creds) {
    console.error('\n[publish:runtime] x W3_PRINCIPAL / W3_PROOF env not set; cannot upload')
    process.exit(2)
  }

  console.log('\n[publish:runtime] step 2: upload dist/ to IPFS')
  const w3 = await ensureClient(creds)
  const { cid, count } = await uploadDirFromDisk(w3, RUNTIME_DIST)
  console.log('[publish:runtime]   uploaded ' + count + ' files; runtime CID: ' + cid)

  // Persist the CID so publish:app picks it up automatically. The file
  // is intentionally committed (a versioned pointer to the runtime the
  // repo currently ships) — running publish:runtime --upload creates a
  // new commit-ready pointer; CI publish:app then resolves the runtime
  // placeholder against it without further configuration.
  const pinDir = join(REPO_ROOT, '.kon')
  await mkdir(pinDir, { recursive: true })
  const pinFile = join(pinDir, 'runtime-cid.txt')
  await writeFile(pinFile, cid + '\n')
  console.log('[publish:runtime]   pinned -> .kon/runtime-cid.txt')

  console.log('\n[publish:runtime] + done.')
}

main().catch((e) => {
  console.error('[publish:runtime] x', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
