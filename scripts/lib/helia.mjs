// Self-hosted IPFS pin service: writes UnixFS blocks to a local
// filesystem blockstore using ipfs-unixfs-importer directly. Skips the
// full Helia + libp2p stack to avoid pulling in WebRTC's native binding
// (node-datachannel) which fails to build on machines without
// C++ toolchains. The resulting CIDs are the same UnixFS CIDv1
// (dag-pb / sha2-256) that Helia, Kubo, and web3.storage all produce
// — fully interoperable.
//
// IMPORTANT operational note:
//
//   This service computes CIDs and persists blocks to disk, but does
//   NOT publish them to the IPFS network by itself. Public gateways
//   (w3s.link, ipfs.io, .limo) cannot fetch your locally-pinned
//   blocks until you also run a libp2p daemon (e.g. Kubo, or a
//   future "kon-relay" project) that exposes the blockstore.
//
//   For day-1 self-host with public reachability, use the (planned)
//   MultiPinService to push to BOTH local-helia AND w3up — w3up makes
//   the CID immediately fetchable by public gateways while the local
//   pin acts as your own redundant copy.
//
// Env vars:
//   HELIA_BLOCKSTORE_PATH  on-disk directory for blocks. Defaults to
//                          .kon/blockstore in the repo root.

const DEFAULT_BLOCKSTORE_PATH = '.kon/blockstore'

export function readConfigFromEnv() {
  return {
    blockstorePath: process.env.HELIA_BLOCKSTORE_PATH || DEFAULT_BLOCKSTORE_PATH
  }
}

let _blockstoreSingleton = null

async function ensureBlockstore(config) {
  if (_blockstoreSingleton) return _blockstoreSingleton
  const { mkdir } = await import('node:fs/promises')
  await mkdir(config.blockstorePath, { recursive: true })

  const { FsBlockstore } = await import('blockstore-fs')
  const blockstore = new FsBlockstore(config.blockstorePath)
  await blockstore.open()
  _blockstoreSingleton = blockstore
  return blockstore
}

/** Best-effort close for short-lived scripts. publish:* call this on success. */
export async function stopHelia() {
  if (_blockstoreSingleton) {
    try {
      await _blockstoreSingleton.close()
    } catch {
      // ignore — the script is exiting anyway
    }
    _blockstoreSingleton = null
  }
}

function toBytes(content) {
  return typeof content === 'string' ? new TextEncoder().encode(content) : content
}

/**
 * Common importer invocation. Wraps everything under a synthetic
 * `release/` directory so the importer always emits a wrapping-directory
 * entry; the caller picks the right CID from the entry stream.
 */
async function importerRun(config, files) {
  const blockstore = await ensureBlockstore(config)
  const { importer } = await import('ipfs-unixfs-importer')
  const WRAP = 'release'

  const candidates = (async function* () {
    for (const f of files) {
      yield { path: WRAP + '/' + f.name, content: toBytes(f.content) }
    }
  })()

  let rootCid = null
  let lastFileCid = null
  for await (const entry of importer(candidates, blockstore, { cidVersion: 1 })) {
    if (entry.path === WRAP) rootCid = entry.cid
    else lastFileCid = entry.cid
  }
  return { rootCid, fileCid: lastFileCid }
}

export async function uploadFile(config, name, content) {
  const { fileCid } = await importerRun(config, [{ name, content }])
  if (!fileCid) throw new Error('helia: importer emitted no file CID for ' + name)
  return { cid: fileCid.toString() }
}

export async function uploadDirectory(config, entries) {
  const { rootCid } = await importerRun(config, entries)
  if (!rootCid) throw new Error('helia: importer emitted no wrapping directory CID')
  return { cid: rootCid.toString() }
}

export async function uploadDirFromDisk(config, dirPath) {
  // oxlint-disable-next-line typescript/unbound-method -- destructuring stateless node:* exports, not class methods
  const { readdir, readFile } = await import('node:fs/promises')
  // oxlint-disable-next-line typescript/unbound-method -- destructuring stateless node:* exports, not class methods
  const { join, relative } = await import('node:path')

  async function* walk(dir) {
    const items = await readdir(dir, { withFileTypes: true })
    for (const item of items) {
      const full = join(dir, item.name)
      if (item.isDirectory()) yield* walk(full)
      else if (item.isFile()) yield full
    }
  }

  const files = []
  for await (const full of walk(dirPath)) {
    const bytes = await readFile(full)
    const rel = relative(dirPath, full).split('\\').join('/')
    files.push({ name: rel, content: bytes })
  }
  if (files.length === 0) throw new Error('uploadDirFromDisk: no files found under ' + dirPath)
  const { cid } = await uploadDirectory(config, files)
  return { cid, count: files.length }
}
