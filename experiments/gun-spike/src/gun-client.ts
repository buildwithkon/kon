import Gun from 'gun'
import 'gun/sea'

// SEA is attached to Gun globally as Gun.SEA after the side-effect import.
type SEAType = {
  pair: () => Promise<{ pub: string; priv: string; epub: string; epriv: string }>
  sign: (data: unknown, pair: { pub: string; priv: string }) => Promise<string>
  verify: (signed: string, pub: string) => Promise<unknown>
}

// biome-ignore lint/suspicious/noExplicitAny: Gun does not ship types
const SEA: SEAType = (Gun as any).SEA

// Peers list — read from URL query (?peer=) for ad-hoc testing.
// Default: local relay first (started via `pnpm relay`), public fallback.
// In production these come from `manifest.deployment.gun_peers`.
function resolvePeers(): string[] {
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.getAll('peer')
  if (fromQuery.length > 0) return fromQuery

  return [
    'http://localhost:8765/gun', // local relay (run `pnpm relay` in another terminal)
    'https://relay.peer.ooo/gun' // public fallback
  ]
}

export type PeerEvent = {
  ts: number
  event: 'hi' | 'bye' | 'error' | 'put' | 'in'
  url?: string
  detail?: string
}

export type DiagnosticListener = (event: PeerEvent) => void

export type SignedMessage = {
  pub: string
  payload: string
  preview: {
    text: string
    ts: number
  }
}

export type VerifiedMessage = {
  pub: string
  text: string
  ts: number
  verified: boolean
}

export function createGun(roomId: string, onEvent: DiagnosticListener) {
  const peers = resolvePeers()
  const start = performance.now()

  const gun = Gun({ peers, localStorage: false, radisk: false })
  const room = gun.get(`kon-spike-${roomId}`)

  // biome-ignore lint/suspicious/noExplicitAny: Gun internals are untyped
  const peerHandlers = (gun as any)._.opt.peers
  // Initial event so the UI knows which peers were attempted
  for (const url of peers) {
    onEvent({ ts: Date.now(), event: 'put', detail: `attempting peer: ${url}`, url })
  }

  // biome-ignore lint/suspicious/noExplicitAny: Gun internals
  gun.on('hi', (peer: any) => {
    onEvent({ ts: Date.now(), event: 'hi', url: peer?.url || '(unknown)' })
  })
  // biome-ignore lint/suspicious/noExplicitAny: Gun internals
  gun.on('bye', (peer: any) => {
    onEvent({ ts: Date.now(), event: 'bye', url: peer?.url || '(unknown)' })
  })

  return { gun, room, peers, peerHandlers, connectedAt: start }
}

export async function makeIdentity() {
  return SEA.pair()
}

export async function signMessage(text: string, pair: { pub: string; priv: string }): Promise<SignedMessage> {
  const ts = Date.now()
  const envelope = { text, ts }
  const payload = await SEA.sign(JSON.stringify(envelope), pair)
  return {
    pub: pair.pub,
    payload,
    preview: { text, ts }
  }
}

export async function verifyMessage(signed: SignedMessage): Promise<VerifiedMessage> {
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
