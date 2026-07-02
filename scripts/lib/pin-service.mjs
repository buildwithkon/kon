// Pin service abstraction.
//
// The publish pipeline talks to a pin service through this interface
// instead of going directly to w3up. Default implementation is w3up.
// Self-host operators can swap to Helia, Pinata, or a multi-pin
// strategy by selecting via the KON_PIN_SERVICE env var.
//
// Contract (all methods async):
//   uploadFile(name: string, content: Uint8Array | string) -> { cid: string }
//   uploadDirectory(entries: Array<{ name, content }>)     -> { cid: string }
//   uploadDirFromDisk(dirPath: string)                     -> { cid: string, count: number }
//
// The PinService is a value object — `createPinService()` returns one,
// publish scripts pass it through. Authentication / state is
// encapsulated inside the implementation; the publish scripts do not
// see credentials.

import {
  ensureClient as ensureW3upClient,
  readCredentialsFromEnv as readW3upCreds,
  uploadFile as w3upUploadFile,
  uploadDirectory as w3upUploadDirectory,
  uploadDirFromDisk as w3upUploadDirFromDisk
} from './w3up.mjs'

import {
  readConfigFromEnv as readHeliaConfig,
  uploadFile as heliaUploadFile,
  uploadDirectory as heliaUploadDirectory,
  uploadDirFromDisk as heliaUploadDirFromDisk,
  stopHelia
} from './helia.mjs'

/**
 * Build a PinService from env. Returns null when credentials for the
 * selected service are missing — callers fall back to dry-run mode.
 *
 * Selection (KON_PIN_SERVICE env, default 'w3up'):
 *   - w3up    web3.storage via @web3-storage/w3up-client (default)
 *   - helia   self-hosted Helia (JS-native IPFS, no daemon)
 *   - pinata  Pinata REST API at PINATA_JWT (planned)
 *   - multi   pin to several services in parallel (planned)
 */
export async function createPinService() {
  const choice = (process.env.KON_PIN_SERVICE || 'w3up').toLowerCase()

  if (choice === 'w3up') {
    const creds = readW3upCreds()
    if (!creds) return null
    const client = await ensureW3upClient(creds)
    return {
      kind: 'w3up',
      async uploadFile(name, content) {
        const cid = await w3upUploadFile(client, name, content)
        return { cid }
      },
      async uploadDirectory(entries) {
        const cid = await w3upUploadDirectory(client, entries)
        return { cid }
      },
      async uploadDirFromDisk(dirPath) {
        return await w3upUploadDirFromDisk(client, dirPath)
      },
      async close() {
        // w3up client has no explicit close; the Node process exiting is enough
      }
    }
  }

  if (choice === 'helia') {
    const config = readHeliaConfig()
    return {
      kind: 'helia',
      async uploadFile(name, content) {
        return await heliaUploadFile(config, name, content)
      },
      async uploadDirectory(entries) {
        return await heliaUploadDirectory(config, entries)
      },
      async uploadDirFromDisk(dirPath) {
        return await heliaUploadDirFromDisk(config, dirPath)
      },
      async close() {
        await stopHelia()
      }
    }
  }

  if (choice === 'pinata') {
    throw new Error(
      'KON_PIN_SERVICE=pinata is reserved; implementation lands in scripts/lib/pinata.mjs (not yet wired)'
    )
  }
  if (choice === 'multi') {
    throw new Error(
      'KON_PIN_SERVICE=multi pins to several services in parallel; not yet wired (planned for defensive deployments)'
    )
  }

  throw new Error('unknown KON_PIN_SERVICE: ' + choice + '. Valid: w3up | helia | pinata | multi')
}

/**
 * Returns a human-readable description of why a service is unavailable
 * (e.g. missing env vars). Used by publish scripts in their
 * "credentials missing" error path.
 */
export function describeMissingCredentials() {
  const choice = (process.env.KON_PIN_SERVICE || 'w3up').toLowerCase()
  if (choice === 'w3up') return 'W3_PRINCIPAL / W3_PROOF env not set'
  if (choice === 'helia') return '(no credentials needed for helia — this is a bug)'
  if (choice === 'pinata') return 'PINATA_JWT env not set'
  if (choice === 'multi') return 'KON_PIN_MULTI_SERVICES env not set'
  return 'unknown service ' + choice
}
