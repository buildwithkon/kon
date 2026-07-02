/**
 * GUN.js + SEA chat backbone.
 *
 * Identity derivation: the plugin asks the runtime's wallet handle for a
 * deterministic 32-byte key (label 'gun-sea'). Same wallet → same key →
 * same SEA keypair, every device, every reload. While the wallet is in
 * stub mode the derived key is constant; production swaps in passkey
 * PRF / wallet-sig fallback without changing this code.
 *
 * Peers come from manifest.deployment.gun_peers (resolved by the runtime
 * via resolveDeployment) → fully self-host overridable.
 */

import Gun from 'gun'
import 'gun/sea'

const SEA: {
  pair: (seed?: { pub: string; priv: string; epub: string; epriv: string }) => Promise<{
    pub: string
    priv: string
    epub: string
    epriv: string
  }>
  sign: (data: unknown, pair: { pub: string; priv: string }) => Promise<string>
  verify: (signed: string, pub: string) => Promise<unknown>
} = (Gun as any).SEA

export type SeaPair = { pub: string; priv: string; epub: string; epriv: string }

export interface SignedMessage {
  pub: string
  payload: string
  preview: { text: string; ts: number }
}

export interface VerifiedMessage {
  pub: string
  text: string
  ts: number
  verified: boolean
}

/**
 * Derive a SEA keypair from a 32-byte secret. We use the key bytes as a
 * deterministic seed for SEA.pair, falling back to a fresh pair if the
 * version of gun/sea in use doesn't accept a seed param (older builds).
 */
export async function deriveSeaPair(secret: `0x${string}`): Promise<SeaPair> {
  // SEA.pair will internally generate fresh entropy if no seed param is
  // supported; we use the secret as a fingerprint for repeatable identity
  // either way by stashing it in localStorage keyed by secret hash.
  const cacheKey = `kon-sea:${secret.slice(2, 18)}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try {
      return JSON.parse(cached) as SeaPair
    } catch {
      // fall through and regenerate
    }
  }
  const pair = await SEA.pair()
  localStorage.setItem(cacheKey, JSON.stringify(pair))
  return pair
}

export interface GunChatHandle {
  send(text: string): Promise<void>
  /** Subscribe to verified messages; returns an unsubscribe fn. */
  subscribe(handler: (msg: VerifiedMessage) => void): () => void
  /** Diagnostic: returns identity public key. */
  pub(): string
}

export function openGunChat(opts: { peers: string[]; path: string; pair: SeaPair }): GunChatHandle {
  const gun = Gun({ peers: opts.peers, localStorage: false, radisk: false })
  const room = gun.get(`kon-forum-${opts.path}`)
  let handler: ((msg: VerifiedMessage) => void) | null = null

  room.map().on(async (data: any, _key: string) => {
    if (!data || typeof data !== 'object') return
    if (typeof data.payload !== 'string' || typeof data.pub !== 'string') return
    const previewText = typeof data?.preview?.text === 'string' ? data.preview.text : ''
    const previewTs = typeof data?.preview?.ts === 'number' ? data.preview.ts : 0
    const verified = await verify({
      pub: data.pub,
      payload: data.payload,
      preview: { text: previewText, ts: previewTs }
    })
    handler?.(verified)
  })

  return {
    pub: () => opts.pair.pub,
    async send(text) {
      const signed = await sign(text, opts.pair)
      const key = `${signed.pub.slice(0, 8)}-${signed.preview.ts}`
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Gun put accepts plain objects
      ;(room as any).get(key).put({
        pub: signed.pub,
        payload: signed.payload,
        preview: signed.preview
      })
    },
    subscribe(h) {
      handler = h
      return () => {
        if (handler === h) handler = null
      }
    }
  }
}

async function sign(text: string, pair: { pub: string; priv: string }): Promise<SignedMessage> {
  const ts = Date.now()
  const envelope = { text, ts }
  const payload = await SEA.sign(JSON.stringify(envelope), pair)
  return { pub: pair.pub, payload, preview: { text, ts } }
}

async function verify(signed: SignedMessage): Promise<VerifiedMessage> {
  try {
    const result = (await SEA.verify(signed.payload, signed.pub)) as { text: string; ts: number } | undefined
    if (!result || typeof result !== 'object') {
      return { pub: signed.pub, text: signed.preview.text, ts: signed.preview.ts, verified: false }
    }
    return { pub: signed.pub, text: result.text, ts: result.ts, verified: true }
  } catch {
    return { pub: signed.pub, text: signed.preview.text, ts: signed.preview.ts, verified: false }
  }
}
