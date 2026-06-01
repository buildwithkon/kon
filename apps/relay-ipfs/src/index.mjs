#!/usr/bin/env tsx
/**
 * relay-ipfs — Helia daemon that publishes the local KON blockstore to the
 * public IPFS network.
 *
 * Why this exists: publish:* writes UnixFS blocks to .kon/blockstore/
 * via ipfs-unixfs-importer. Those blocks live only on disk; public
 * gateways (w3s.link, ipfs.io, .limo) cannot fetch them without a
 * libp2p endpoint announcing they're available. relay-ipfs is that
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
import { createRateLimiter, guessContentType, ipOf, parseIpfsUrl } from './lib.mjs'

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

async function startRelay() {
  console.log('[relay-ipfs] starting...')
  console.log('[relay-ipfs]   blockstore: ' + BLOCKSTORE_PATH)

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

  console.log('[relay-ipfs] libp2p ready')
  console.log('[relay-ipfs]   peerId: ' + libp2p.peerId.toString())
  const addrs = libp2p.getMultiaddrs().map((ma) => ma.toString())
  for (const a of addrs) {
    console.log('[relay-ipfs]   addr: ' + a)
  }

  if (HTTP_PORT !== null && !Number.isNaN(HTTP_PORT)) {
    const fs = unixfs(helia)

    // Per-IP rate limiter for /api/pin. Naive token-bucket + daily byte
    // quota (both in lib.mjs createRateLimiter so they're testable
    // without spinning up libp2p). State is in-memory, process-local —
    // swap for Redis if running multi-instance behind a load balancer.
    const PIN_REQUESTS_PER_MIN = Number(process.env.KON_PIN_RPM ?? '10')
    const PIN_BYTES_PER_DAY = Number(process.env.KON_PIN_BYTES_PER_DAY ?? String(100 * 1024 * 1024))
    const PIN_MAX_BODY_BYTES = Number(process.env.KON_PIN_MAX_BODY ?? String(10 * 1024 * 1024))
    const { check: checkLimit } = createRateLimiter({
      requestsPerMin: PIN_REQUESTS_PER_MIN,
      bytesPerDay: PIN_BYTES_PER_DAY
    })

    async function readBody(req) {
      const chunks = []
      let total = 0
      for await (const chunk of req) {
        total += chunk.length
        if (total > PIN_MAX_BODY_BYTES) throw new Error('body too large')
        chunks.push(chunk)
      }
      return Buffer.concat(chunks)
    }

    const server = createServer(async (req, res) => {
      try {
        const url = req.url ?? '/'

        // ----- POST /api/pin -----
        // Accept raw body, write to Helia UnixFS, return { cid }.
        //
        // Stage 1 has no auth — relies on the rate-limiter to bound abuse.
        // Phase 9 hardening: require a passkey-signed header containing
        // (timestamp, body sha256, signer pubkey) and verify against the
        // signer's claimed Safe address. The per-signer quota then layers
        // on top of the per-IP one.
        if (req.method === 'POST' && url === '/api/pin') {
          const ip = ipOf(req)
          const declared = Number(req.headers['content-length'] ?? '0')
          if (!declared || declared > PIN_MAX_BODY_BYTES) {
            res.writeHead(413, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ error: 'body too large or unspecified' }))
            return
          }
          const verdict = checkLimit(ip, declared)
          if (!verdict.ok) {
            res.writeHead(429, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ error: verdict.reason }))
            return
          }
          const body = await readBody(req)
          const cid = await fs.addBytes(body)
          console.log('[relay-ipfs] /api/pin ' + ip + ' ' + body.length + 'B → ' + cid.toString())
          res.writeHead(200, {
            'content-type': 'application/json',
            'access-control-allow-origin': '*'
          })
          res.end(JSON.stringify({ cid: cid.toString(), bytes: body.length }))
          return
        }

        // ----- OPTIONS /api/pin (CORS preflight) -----
        if (req.method === 'OPTIONS' && url === '/api/pin') {
          res.writeHead(204, {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'POST, OPTIONS',
            'access-control-allow-headers': 'content-type, x-kon-auth'
          })
          res.end()
          return
        }

        // ----- GET /ipfs/<cid>[/<path>] -----
        // Supports arbitrary-depth subpaths via @helia/unixfs cat() with the
        // `path` option, so nested assets like /ipfs/<CID>/assets/index-abc.js
        // resolve correctly. Required for serving multi-file SPA bundles
        // (apps/account, apps/dashboard, apps/site) via Caddy vhosts that
        // proxy this gateway.
        if (!url.startsWith('/ipfs/')) {
          res.writeHead(404)
          res.end('not found (POST /api/pin or GET /ipfs/<cid>/<path> only)')
          return
        }
        const { cid: cidStr, subPath } = parseIpfsUrl(url)
        const root = CID.parse(cidStr)

        const chunks = []
        const catOpts = subPath && subPath !== '/' ? { path: subPath } : undefined
        try {
          for await (const chunk of fs.cat(root, catOpts)) {
            chunks.push(chunk)
          }
        } catch {
          // If the path resolves to a directory (common for trailing slash or
          // SPA root), try the directory's index.html. This matches Kubo's
          // gateway behavior for UnixFS directory CIDs.
          const fallbackPath = subPath && subPath !== '/' ? subPath + '/index.html' : '/index.html'
          for await (const chunk of fs.cat(root, { path: fallbackPath })) {
            chunks.push(chunk)
          }
        }
        const buf = Buffer.concat(chunks)
        // Strip the leading slash from subPath for content-type guessing
        const filePath = subPath.replace(/^\//, '') || 'index.html'
        res.writeHead(200, { 'content-type': guessContentType(filePath) })
        res.end(buf)
      } catch (e) {
        res.writeHead(500)
        res.end('relay error: ' + (e instanceof Error ? e.message : String(e)))
      }
    })
    server.listen(HTTP_PORT, () => {
      console.log('[relay-ipfs] HTTP gateway on http://0.0.0.0:' + HTTP_PORT + '/ipfs/<cid>')
      console.log('[relay-ipfs] pin endpoint on  http://0.0.0.0:' + HTTP_PORT + '/api/pin')
      console.log(
        '[relay-ipfs]   limit: ' +
          PIN_REQUESTS_PER_MIN +
          ' req/min/IP, ' +
          (PIN_BYTES_PER_DAY / 1024 / 1024).toFixed(0) +
          'MB/day/IP, ' +
          (PIN_MAX_BODY_BYTES / 1024 / 1024).toFixed(0) +
          'MB max body'
      )
    })
  }

  // Graceful shutdown
  let shuttingDown = false
  const shutdown = async (sig) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log('\n[relay-ipfs] ' + sig + ' received, shutting down...')
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

  console.log('[relay-ipfs] ready. press Ctrl+C to stop.')
}

startRelay().catch((e) => {
  console.error('[relay-ipfs] x', e instanceof Error ? e.stack || e.message : String(e))
  process.exit(1)
})
