/**
 * Passkey (WebAuthn) primitives for the central wallet origin.
 *
 * - rpId is bound to the current page hostname so the same code works for
 *   the default id.kon.xyz deployment AND every self-hosted id.<domain>.
 *   Never hardcode the rpId here.
 * - Credential metadata (id + publicKey + rpId) persists in localStorage.
 *   The browser's authenticator stores the actual key material.
 * - Uses viem 2.51+ `createWebAuthnCredential` / `toWebAuthnAccount` so we
 *   inherit their CBOR + COSE parsing instead of writing it ourselves.
 * - Returns viem's P256Credential shape which feeds directly into
 *   permissionless.js Safe smart-account creation in safe.ts.
 */

import {
  createWebAuthnCredential,
  toWebAuthnAccount,
  type P256Credential,
  type WebAuthnAccount
} from 'viem/account-abstraction'

const STORAGE_KEY = 'kon:passkey:credential:v1'

function currentRpId(): string {
  return window.location.hostname
}

interface StoredCredential {
  id: string
  publicKey: `0x${string}`
  rpId: string
  createdAt: number
  /** Optional display label so users can tell devices apart. */
  label?: string
}

function readStoredCredential(): StoredCredential | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const obj = JSON.parse(raw) as StoredCredential
    if (!obj.id || !obj.publicKey || !obj.rpId) return null
    return obj
  } catch {
    return null
  }
}

function writeStoredCredential(c: StoredCredential): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
}

/**
 * Returns the stored credential metadata if rpId matches the current hostname.
 * A mismatch means the user moved between deployments (id.kon.xyz vs
 * id.myfestival.com); the stored credential cannot be used at this origin.
 */
export function loadStoredCredential(): StoredCredential | null {
  const stored = readStoredCredential()
  if (!stored) return null
  if (stored.rpId !== currentRpId()) return null
  return stored
}

/**
 * Create a new passkey credential at this origin. The browser will prompt
 * for biometric / PIN verification. The created credential is persisted to
 * localStorage and also returned for immediate use.
 */
export async function createPasskey(opts: { userName: string; label?: string }): Promise<P256Credential> {
  const credential = await createWebAuthnCredential({
    name: opts.userName,
    rp: { id: currentRpId(), name: 'KON' },
    authenticatorSelection: {
      // 'preferred' = use a synced platform passkey when available so the
      // credential travels via iCloud / Google Password Manager.
      authenticatorAttachment: 'platform',
      residentKey: 'preferred',
      userVerification: 'preferred'
    }
  })

  writeStoredCredential({
    id: credential.id,
    publicKey: credential.publicKey,
    rpId: currentRpId(),
    createdAt: Date.now(),
    label: opts.label
  })

  return credential
}

/**
 * Restore a usable WebAuthn account from the stored credential. Throws if no
 * credential exists for this origin — caller should fall back to createPasskey
 * in that case.
 */
export function loadAccount(): WebAuthnAccount {
  const stored = loadStoredCredential()
  if (!stored) throw new Error('no passkey stored for this origin — call createPasskey first')
  return toWebAuthnAccount({
    credential: {
      id: stored.id,
      publicKey: stored.publicKey
    }
  })
}

/** Diagnostic: returns the current passkey state without prompting the user. */
export function describePasskey(): {
  present: boolean
  rpId: string
  matchesOrigin: boolean
  createdAt?: number
} {
  const stored = readStoredCredential()
  const rpId = currentRpId()
  if (!stored) return { present: false, rpId, matchesOrigin: false }
  return {
    present: true,
    rpId: stored.rpId,
    matchesOrigin: stored.rpId === rpId,
    createdAt: stored.createdAt
  }
}

/**
 * Remove the stored credential from this origin. The browser-side
 * authenticator credential persists (we cannot delete it from JS); this
 * just unlinks it from our app so the next createPasskey makes a fresh
 * pair. Useful for "switch account" flows.
 */
export function forgetPasskey(): void {
  localStorage.removeItem(STORAGE_KEY)
}
