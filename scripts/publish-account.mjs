#!/usr/bin/env node
// Publish apps/account (KON wallet origin, served at id.<DOMAIN>).
//
// Modes:
//   bun run publish:account             dry-run (build only)
//   bun run publish:account --upload    build + upload dist/ to relay-ipfs blockstore
//
// On --upload prints the root CID and the exact line to add (or update)
// in the relay stack's .env file:
//
//     KON_ACCOUNT_CID=bafy...
//
// Followed by `docker compose up -d caddy` on the VPS to reload the
// Caddy vhost serving id.<DOMAIN>. No ENS contenthash write — the
// account origin is hostname-routed via Caddy, not contenthash-resolved.
//
// Env (only required for --upload):
//   W3_PRINCIPAL / W3_PROOF             web3.storage delegation (when KON_PIN_SERVICE=w3up)
//   PIN_ENDPOINT_URL                    custom /api/pin URL (when KON_PIN_SERVICE=remote, e.g.
//                                       posting to gateway.kon.xyz/api/pin from a separate host)
//
// See docs/self-host-wallet.md for the full deploy walkthrough.

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
const ACCOUNT_DIST = join(REPO_ROOT, 'apps/account/dist')

function buildAccount() {
  return new Promise((resolve, reject) => {
    const child = spawn('bun', ['--filter=@konxyz/account', 'run', 'build'], {
      cwd: REPO_ROOT,
      stdio: 'inherit'
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error('account build exited with code ' + code))
    })
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log('[publish:account] step 1: build account')
  await buildAccount()
  console.log('[publish:account]   dist: ' + ACCOUNT_DIST)

  if (!args.upload) {
    console.log('\n[publish:account] dry-run complete. Pass --upload to send to IPFS.')
    return
  }

  const pin = await createPinService()
  if (!pin) {
    console.error('\n[publish:account] x ' + describeMissingCredentials() + '; cannot upload')
    process.exit(2)
  }

  console.log('\n[publish:account] step 2: upload dist/ to IPFS (via ' + pin.kind + ')')
  const { cid, count } = await pin.uploadDirFromDisk(ACCOUNT_DIST)
  console.log('[publish:account]   uploaded ' + count + ' files; root CID: ' + cid)

  console.log('\n[publish:account] upload complete. Next steps:')
  console.log('  1. On the relay VPS, edit kon/.env and set:')
  console.log('       KON_ACCOUNT_CID=' + cid)
  console.log('  2. Reload Caddy so the id.<DOMAIN> vhost picks up the new CID:')
  console.log('       docker compose up -d caddy')
  console.log('  3. Visit https://id.<DOMAIN>/ to verify (cert + bundle).')
}

main().catch((err) => {
  console.error('[publish:account] x ' + (err instanceof Error ? err.message : String(err)))
  process.exit(1)
})
