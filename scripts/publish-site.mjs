#!/usr/bin/env node
// Publish apps/site (v2 marketing site at kon.xyz apex).
//
// Modes:
//   pnpm publish:site             dry-run (build only)
//   pnpm publish:site --upload    build + upload dist/ to IPFS
//   pnpm publish:site --publish   above + update kon.xyz contenthash
//
// Env (only required for --upload / --publish):
//   W3_PRINCIPAL / W3_PROOF     web3.storage delegation
//   KON_DEPLOY_KEY              wallet authorized to update ENS contenthash on kon.xyz
//
// Differs from publish:app because the site has no manifest / entry /
// renderer indirection — it builds to a static dist/ tree (HTML +
// pre-rendered routes + assets) and ships as a UnixFS directory.

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { ensureClient, readCredentialsFromEnv, uploadDirFromDisk } from './lib/w3up.mjs'
import { publishContenthash } from './lib/ens.mjs'

function parseArgs(argv) {
  const out = { upload: false, publish: false }
  for (const a of argv) {
    if (a === '--upload') out.upload = true
    if (a === '--publish') {
      out.upload = true
      out.publish = true
    }
  }
  return out
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE_DIST = join(REPO_ROOT, 'apps/site/dist')

function buildSite() {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['--filter', '@konxyz/site-v2', 'build'], {
      cwd: REPO_ROOT,
      stdio: 'inherit'
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error('site build exited with code ' + code))
    })
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('[publish:site] step 1: build site')
  await buildSite()
  console.log('[publish:site]   dist: ' + SITE_DIST)

  if (!args.upload) {
    console.log('\n[publish:site] dry-run complete. Pass --upload to send to IPFS.')
    return
  }

  const creds = readCredentialsFromEnv()
  if (!creds) {
    console.error('\n[publish:site] x W3_PRINCIPAL / W3_PROOF env not set; cannot upload')
    process.exit(2)
  }

  console.log('\n[publish:site] step 2: upload dist/ to IPFS')
  const w3 = await ensureClient(creds)
  const { cid, count } = await uploadDirFromDisk(w3, SITE_DIST)
  console.log('[publish:site]   uploaded ' + count + ' files; root CID: ' + cid)

  if (!args.publish) {
    console.log('\n[publish:site] upload complete. Pass --publish to update kon.xyz contenthash.')
    console.log('[publish:site] manual: set ENS contenthash on kon.xyz to ipfs://' + cid)
    return
  }

  console.log('\n[publish:site] step 3: update ENS contenthash on kon.xyz')
  const result = await publishContenthash({
    ensName: 'kon.xyz',
    contenthash: 'ipfs://' + cid
  })
  if (result.applied) {
    console.log('[publish:site]   + contenthash updated. tx: ' + result.txHash)
  } else {
    console.log('[publish:site]   ! contenthash NOT updated: ' + result.reason)
    console.log('[publish:site]   manual: set contenthash on kon.xyz to ipfs://' + cid)
  }

  console.log('\n[publish:site] + done')
}

main().catch((e) => {
  console.error('[publish:site] x', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
