#!/usr/bin/env node
/**
 * @konxyz/relay-gun — production-ready GUN.js relay.
 *
 * GUN peers (browsers running apps/runtime + Forum plugin) need at least
 * one always-online peer for offline message persistence and peer
 * discovery across NAT. Public relays (relay.peer.ooo, gun-manhattan)
 * work but go down intermittently; KON ships its own at relay.kon.xyz
 * and the same bundle for self-host (relay.<your-domain>).
 *
 * Operational profile:
 *   - WebSocket on KON_GUN_PORT (default 8765)
 *   - persistence via Radisk (file-based, KON_GUN_DATA_PATH directory)
 *   - tiny memory footprint, ~100MB RSS at idle
 *   - no native deps — runs on any Node.js host (Fly.io, Render, VPS,
 *     Oracle Free, the same VPS as relay-ipfs via docker-compose, etc.)
 *
 * Multi-region (Stage 2+):
 *   This relay can peer with sibling relays in other regions to form
 *   a CRDT-merged single logical graph. Set KON_GUN_PEERS to a
 *   comma-separated list of other relay /gun URLs and they will gossip
 *   updates back and forth via GUN's wire protocol. The intended
 *   topology is GeoDNS at the edge (relay.kon.xyz → nearest region)
 *   plus a full mesh of regions in this env so writes converge across
 *   the world in ~hundreds of ms.
 *
 *   Example (Tokyo relay):
 *     KON_GUN_PEERS=https://fra.relay.kon.xyz/gun,https://iad.relay.kon.xyz/gun
 *
 *   For Stage 1 (Tokyo only) leave this empty.
 *
 * Env vars:
 *   KON_GUN_PORT        listen port (default 8765)
 *   KON_GUN_DATA_PATH   on-disk graph storage (default ./gun-data)
 *                       persist this across restarts so chat history
 *                       survives. With Radisk it's a directory of
 *                       sharded files.
 *   KON_GUN_PEERS       comma-separated list of sibling relays to
 *                       gossip with. Empty (default) = single-region.
 *
 * Health endpoint:
 *   GET /health → { ok: true, gun: "0.2020", uptime: <seconds>, peers: N }
 *
 * GUN handler:
 *   POST /gun       → GUN's WebSocket upgrade + radisk persistence
 *
 * Security:
 *   GUN messages flowing through here are SEA-signed by the sending
 *   peer. The relay sees ciphertext for encrypted graphs, signatures
 *   for public graphs — it cannot impersonate users. Trust model is
 *   "availability provider", not "identity authority".
 */

import { createServer } from 'node:http'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import Gun from 'gun'

const PORT = Number.parseInt(process.env.KON_GUN_PORT ?? '8765', 10)
const DATA_PATH = resolve(process.env.KON_GUN_DATA_PATH ?? './gun-data')
const PEERS = (process.env.KON_GUN_PEERS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

mkdirSync(DATA_PATH, { recursive: true })

const startedAt = Date.now()

const server = createServer((req, res) => {
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('access-control-allow-headers', '*')
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(
      JSON.stringify({
        ok: true,
        gun: '0.2020',
        uptime: Math.floor((Date.now() - startedAt) / 1000),
        data: DATA_PATH,
        peers: PEERS.length
      })
    )
    return
  }
  res.writeHead(404)
  res.end()
})

server.listen(PORT, () => {
  console.log(`[relay-gun] listening on http://0.0.0.0:${PORT}/gun`)
  console.log(`[relay-gun]   data: ${DATA_PATH}`)
  if (PEERS.length > 0) {
    console.log(`[relay-gun]   sibling peers (${PEERS.length}):`)
    for (const p of PEERS) console.log(`[relay-gun]     - ${p}`)
  } else {
    console.log('[relay-gun]   sibling peers: none (single-region mode)')
  }
})

Gun({
  web: server,
  file: DATA_PATH,
  radisk: true,
  localStorage: false,
  peers: PEERS
})

process.on('SIGINT', () => {
  console.log('\n[relay-gun] SIGINT — shutdown')
  process.exit(0)
})
process.on('SIGTERM', () => {
  console.log('\n[relay-gun] SIGTERM — shutdown')
  process.exit(0)
})

setInterval(() => {
  console.log(`[relay-gun] alive, uptime ${Math.floor((Date.now() - startedAt) / 1000)}s`)
}, 60000)
