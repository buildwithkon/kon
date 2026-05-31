// Pin service abstraction.
//
// The publish pipeline talks to a pin service through this interface
// instead of going directly to w3up. Default implementation is w3up.
// Self-host operators can swap to Kubo, Pinata, or a multi-pin
// strategy by adding a new implementation file and selecting it via
// the KON_PIN_SERVICE env var.
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

import { ensureClient as ensureW3upClient, readCredentialsFromEnv as readW3upCreds } from './w3up.mjs'
import {
  uploadFile as w3upUploadFile,
  uploadDirectory as w3upUploadDirectory,
  uploadDirFromDisk as w3upUploadDirFromDisk
} from './w3up.mjs'

/**
 * Build a PinService from env. Returns null when credentials for the
 * selected service are missing — callers fall back to dry-run mode.
 *
 * Selection (KON_PIN_SERVICE env, default 'w3up'):
 *   - w3up    web3.storage via @web3-storage/w3up-client (default)
 *   - kubo    self-hosted Kubo HTTP RPC at KUBO_RPC_URL (planned)
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
      }
    }
  }

  if (choice === 'kubo') {
    throw new Error(
      'KON_PIN_SERVICE=kubo is reserved for self-host; implementation lands in scripts/lib/kubo.mjs (not yet wired)'
    )
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

  throw new Error('unknown KON_PIN_SERVICE: ' + choice + '. Valid: w3up | kubo | pinata | multi')
}

/**
 * Returns a human-readable description of why a service is unavailable
 * (e.g. missing env vars). Used by publish scripts in their
 * "credentials missing" error path.
 */
export function describeMissingCredentials() {
  const choice = (process.env.KON_PIN_SERVICE || 'w3up').toLowerCase()
  if (choice === 'w3up') return 'W3_PRINCIPAL / W3_PROOF env not set'
  if (choice === 'kubo') return 'KUBO_RPC_URL env not set (self-host kubo)'
  if (choice === 'pinata') return 'PINATA_JWT env not set'
  if (choice === 'multi') return 'KON_PIN_MULTI_SERVICES env not set'
  return 'unknown service ' + choice
}
