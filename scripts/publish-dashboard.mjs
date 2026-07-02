#!/usr/bin/env node
// Publish apps/dashboard (organizer portal, served at my.<DOMAIN>).
//
// Modes:
//   bun run publish:dashboard             dry-run (build only)
//   bun run publish:dashboard --upload    build + upload dist/ to relay-ipfs blockstore
//
// On --upload prints the root CID and the line to add in the relay
// stack's .env file:
//
//     KON_DASHBOARD_CID=bafy...
//
// Followed by `docker compose up -d caddy` on the VPS to reload the
// my.<DOMAIN> vhost. No ENS contenthash write — hostname-routed via
// Caddy, same as the account origin.
//
// See docs/self-host-dashboard.md for the full deploy walkthrough.

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { createPinService, describeMissingCredentials } from './lib/pin-service.mjs'

function parseArgs(argv) {
  const out = { upload: false }
  for (const a of argv) {
    if (a === '--upload') out.upload = true
  }
  return out
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DASHBOARD_DIST = join(REPO_ROOT, 'apps/dashboard/dist')

function buildDashboard() {
  return new Promise((resolve, reject) => {
    const child = spawn('bun', ['--filter=@konxyz/dashboard', 'run', 'build'], {
      cwd: REPO_ROOT,
      stdio: 'inherit'
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error('dashboard build exited with code ' + code))
    })
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('[publish:dashboard] step 1: build dashboard')
  await buildDashboard()
  console.log('[publish:dashboard]   dist: ' + DASHBOARD_DIST)

  if (!args.upload) {
    console.log('\n[publish:dashboard] dry-run complete. Pass --upload to send to IPFS.')
    return
  }

  const pin = await createPinService()
  if (!pin) {
    console.error('\n[publish:dashboard] x ' + describeMissingCredentials() + '; cannot upload')
    process.exit(2)
  }

  console.log('\n[publish:dashboard] step 2: upload dist/ to IPFS (via ' + pin.kind + ')')
  const { cid, count } = await pin.uploadDirFromDisk(DASHBOARD_DIST)
  console.log('[publish:dashboard]   uploaded ' + count + ' files; root CID: ' + cid)

  console.log('\n[publish:dashboard] upload complete. Next steps:')
  console.log('  1. On the relay VPS, edit kon/.env and set:')
  console.log('       KON_DASHBOARD_CID=' + cid)
  console.log('  2. Reload Caddy so the my.<DOMAIN> vhost picks up the new CID:')
  console.log('       docker compose up -d caddy')
  console.log('  3. Visit https://my.<DOMAIN>/ to verify (cert + bundle).')
}

main().catch((err) => {
  console.error('[publish:dashboard] x ' + (err instanceof Error ? err.message : String(err)))
  process.exit(1)
})
