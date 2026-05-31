#!/usr/bin/env tsx
/**
 * kon-relay — Helia daemon that publishes the local KON blockstore to the
 * public IPFS network.
 *
 * Why this exists: publish:* writes UnixFS blocks to .kon/blockstore/
 * via ipfs-unixfs-importer. Those blocks live only on disk; public
 * gateways (w3s.link, ipfs.io, .limo) cannot fetch them without a
 * libp2p endpoint announcing they're available. kon-relay is that
 * endpoint.
 *
 * What it runs:
 *   - libp2p with TCP transport (no WebRTC — avoids node-datachannel
 *     native build), noise+yamux, kad-DHT for content discovery,
 *     bootstrap peer list.
 *   - Helia using the same FsBlockstore as the publish scripts so it
 *     serves the very CIDs that publish:* writes.
 *   - @helia/http-gateway on port 8080 for direct HTTP access from
 *     browsers (an alternative to public gateways).
 *
 * Operational pattern:
 *   - Run on a small VPS with port 4001 open (libp2p) and optionally
 *     8080 (HTTP gateway, behind a reverse proxy for HTTPS).
 *   - Point KON publish scripts at .kon/blockstore/ on the same host
 *     (or sync the directory). Day-to-day publish writes locally;
 *     this daemon serves to the world.
 *
 * Env vars:
 *   HELIA_BLOCKSTORE_PATH   .kon/blockstore by default
 *   KON_RELAY_TCP_PORT      4001 by default
 *   KON_RELAY_HTTP_PORT     8080 by default; set to '' to disable gateway
 *   KON_RELAY_ANNOUNCE      comma-separated multiaddrs to announce externally
 *                           (e.g. /dns4/relay.kon.xyz/tcp/4001 — required when
 *                           behind NAT for full DHT participation)
 */

import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { kadDHT } from '@libp2p/kad-dht'
import { ping } from '@libp2p/ping'
import { bootstrap } from '@libp2p/bootstrap'
import { FsBlockstore } from 'blockstore-fs'
import { unixfs } from '@helia/unixfs'
import { CID } from 'multiformats/cid'
import { createServer } from 'node:http'

const BLOCKSTORE_PATH = process.env.HELIA_BLOCKSTORE_PATH || '.kon/blockstore'
const TCP_PORT = Number(process.env.KON_RELAY_TCP_PORT || 4001)
const HTTP_PORT_RAW = process.env.KON_RELAY_HTTP_PORT
const HTTP_PORT = HTTP_PORT_RAW === '' ? null : Number(HTTP_PORT_RAW || 8080)
const ANNOUNCE = (process.env.KON_RELAY_ANNOUNCE || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

// Public bootstrap nodes — entry points to the libp2p DHT. Same list the
// reference IPFS stack uses; standard for any non-private IPFS node.
const BOOTSTRAP_NODES = [
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoCPnTcQu6CqQTGdMA3oXh4EFhVUVjP3eUcLwun',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
]

function guessContentType(path) {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8'
  if (path.endsWith('.json')) return 'application/json'
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'application/javascript'
  if (path.endsWith('.css')) return 'text/css'
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.svg')) return 'image/svg+xml'
  return 'application/octet-stream'
}

async function startRelay() {
  console.log('[kon-relay] starting...')
  console.log('[kon-relay]   blockstore: ' + BLOCKSTORE_PATH)

  const blockstore = new FsBlockstore(BLOCKSTORE_PATH)
  await blockstore.open()

  const libp2p = await createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/' + TCP_PORT],
      ...(ANNOUNCE.length > 0 ? { announce: ANNOUNCE } : {})
    },
    transports: [tcp()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [bootstrap({ list: BOOTSTRAP_NODES })],
    services: {
      identify: identify(),
      ping: ping(),
      dht: kadDHT({ clientMode: false })
    }
  })

  const helia = await createHelia({ libp2p, blockstore })

  console.log('[kon-relay] libp2p ready')
  console.log('[kon-relay]   peerId: ' + libp2p.peerId.toString())
  const addrs = libp2p.getMultiaddrs().map((ma) => ma.toString())
  for (const a of addrs) {
    console.log('[kon-relay]   addr: ' + a)
  }

  if (HTTP_PORT !== null && !Number.isNaN(HTTP_PORT)) {
    const fs = unixfs(helia)
    const server = createServer(async (req, res) => {
      try {
        const url = req.url ?? '/'
        if (!url.startsWith('/ipfs/')) {
          res.writeHead(404)
          res.end('not found (only /ipfs/ supported in this PoC)')
          return
        }
        const rest = url.slice('/ipfs/'.length).split('?')[0]
        const parts = rest.split('/')
        const root = CID.parse(parts[0])
        const subPath = parts.slice(1).join('/')

        const chunks = []
        const target = subPath ? root : root
        // Walk into the subpath if any
        let currentCid = root
        if (subPath) {
          for await (const _ of fs.ls(currentCid)) {
            if (_.name === subPath || _.path?.endsWith('/' + subPath)) {
              currentCid = _.cid
              break
            }
          }
        }
        for await (const chunk of fs.cat(currentCid)) {
          chunks.push(chunk)
        }
        const buf = Buffer.concat(chunks)
        res.writeHead(200, { 'content-type': guessContentType(subPath) })
        res.end(buf)
      } catch (e) {
        res.writeHead(500)
        res.end('relay error: ' + (e instanceof Error ? e.message : String(e)))
      }
    })
    server.listen(HTTP_PORT, () => {
      console.log('[kon-relay] HTTP gateway on http://0.0.0.0:' + HTTP_PORT + '/ipfs/<cid>')
    })
  }

  // Graceful shutdown
  let shuttingDown = false
  const shutdown = async (sig) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log('\n[kon-relay] ' + sig + ' received, shutting down...')
    try {
      await helia.stop()
    } catch {}
    try {
      await libp2p.stop()
    } catch {}
    try {
      await blockstore.close()
    } catch {}
    process.exit(0)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  console.log('[kon-relay] ready. press Ctrl+C to stop.')
}

startRelay().catch((e) => {
  console.error('[kon-relay] x', e instanceof Error ? e.stack || e.message : String(e))
  process.exit(1)
})
