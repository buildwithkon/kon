#!/usr/bin/env node
// Publish a single KON v2 plugin (or all of them) to IPFS.
//
// Modes:
//   pnpm publish:plugin --plugin badge           dry-run (build only)
//   pnpm publish:plugin --plugin badge --upload  build + upload dist/plugin.js
//   pnpm publish:plugin --all                    build all plugins (dry-run)
//   pnpm publish:plugin --all --upload           build + upload all
//
// Each plugin builds to packages/plugins/<name>/dist/plugin.js as a
// single self-contained ES module. Externals (preact / preact/hooks /
// @preact/signals) resolve via the runtime's import map at fetch time;
// everything else (gun, markdown-to-jsx, ...) gets bundled in.
//
// Upload result: one CID per plugin, printed at the end. The intended
// consumer is the app publish pipeline — substitute the CID into your
// app's manifest.source.json `source` field for the matching plugin id.

import { dirname, join } from 'node:path'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { ensureClient, readCredentialsFromEnv, uploadFile } from './lib/w3up.mjs'

function parseArgs(argv) {
  const out = { plugin: '', all: false, upload: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--plugin') out.plugin = argv[++i] ?? ''
    if (a === '--all') out.all = true
    if (a === '--upload') out.upload = true
  }
  return out
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PLUGINS_DIR = join(REPO_ROOT, 'packages/plugins')

async function listPlugins() {
  const entries = await readdir(PLUGINS_DIR, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .sort()
}

function buildPlugin(name) {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['--filter', '@konxyz/plugin-' + name, 'build'], {
      cwd: REPO_ROOT,
      stdio: 'inherit'
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error('plugin build for ' + name + ' exited with code ' + code))
    })
  })
}

async function uploadPlugin(client, name) {
  const bundlePath = join(PLUGINS_DIR, name, 'dist/plugin.js')
  const bytes = await readFile(bundlePath)
  const cid = await uploadFile(client, 'plugin.js', bytes)
  return cid
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.all && !args.plugin) {
    console.error('[publish:plugin] x must pass --plugin <name> or --all')
    process.exit(1)
  }

  const plugins = args.all ? await listPlugins() : [args.plugin]

  console.log('[publish:plugin] step 1: build ' + plugins.length + ' plugin(s)')
  for (const name of plugins) {
    console.log('[publish:plugin]   ' + name)
    await buildPlugin(name)
  }

  if (!args.upload) {
    console.log('\n[publish:plugin] dry-run complete. Pass --upload to send to IPFS.')
    return
  }

  const creds = readCredentialsFromEnv()
  if (!creds) {
    console.error('\n[publish:plugin] x W3_PRINCIPAL / W3_PROOF env not set; cannot upload')
    process.exit(2)
  }

  console.log('\n[publish:plugin] step 2: upload')
  const w3 = await ensureClient(creds)
  const cids = []
  for (const name of plugins) {
    const cid = await uploadPlugin(w3, name)
    console.log('[publish:plugin]   ' + name + ' -> ' + cid)
    cids.push({ name, cid })
  }

  console.log('\n[publish:plugin] + done. Plugin CIDs (paste into manifest.source.json `source` fields):')
  for (const { name, cid } of cids) {
    console.log('  ' + name + ': ipfs://' + cid)
  }
}

main().catch((e) => {
  console.error('[publish:plugin] x', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
