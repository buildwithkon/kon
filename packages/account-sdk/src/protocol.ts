/**
 * postMessage protocol between an app and the central wallet origin.
 *
 * Both sides exchange JSON-serializable messages with a `kind` discriminator
 * and a `requestId` for matching responses to requests. Every message carries
 * an explicit `origin` allowlist check at the receiver — we never trust the
 * `event.origin` blindly.
 *
 * This file is the single source of truth for the wire format. The app
 * imports request/response types via @konxyz/account-sdk; the wallet origin
 * imports them via @konxyz/account-sdk/protocol directly.
 */

export type ChainId = number

export interface SignInRequest {
  kind: 'kon.signIn'
  requestId: string
  /** Apps may request specific chains the wallet should be prepared for. */
  preferredChainId?: ChainId
}

export interface SignInResponse {
  kind: 'kon.signIn.ok'
  requestId: string
  /** Safe smart account address (same across chains via Safe{Core} predeterministic deploy). */
  address: `0x${string}`
  /** Resolved ENS name (e.g. 'yuji.kon.xyz'), if any. */
  ens?: string
  /** Caller-derived key (PRF or wallet-sig fallback) for GUN/SEA identity. */
  derivedKey?: string
}

export interface SignTxRequest {
  kind: 'kon.signTx'
  requestId: string
  chainId: ChainId
  to: `0x${string}`
  data: `0x${string}`
  value?: `0x${string}`
  /** Human-readable description shown in the wallet confirmation modal. */
  description?: string
}

export interface SignTxResponse {
  kind: 'kon.signTx.ok'
  requestId: string
  /** Signed UserOperation hash from ERC-4337 bundler. */
  userOpHash: `0x${string}`
}

export interface KeyDerivationRequest {
  kind: 'kon.deriveKey'
  requestId: string
  /** Label scoping the derived key (e.g. 'gun-sea', 'e2ee-room-X'). */
  label: string
}

export interface KeyDerivationResponse {
  kind: 'kon.deriveKey.ok'
  requestId: string
  /** 32-byte key as hex. */
  key: `0x${string}`
}

export interface ErrorResponse {
  kind: 'kon.error'
  requestId: string
  code:
    | 'user_cancelled'
    | 'unsupported_chain'
    | 'passkey_unavailable'
    | 'paymaster_rejected'
    | 'internal_error'
  message: string
}

export interface CancelMessage {
  kind: 'kon.cancel'
  requestId: string
}

export type WalletRequest = SignInRequest | SignTxRequest | KeyDerivationRequest | CancelMessage
export type WalletResponse = SignInResponse | SignTxResponse | KeyDerivationResponse | ErrorResponse

export function generateRequestId(): string {
  return crypto.randomUUID()
}
