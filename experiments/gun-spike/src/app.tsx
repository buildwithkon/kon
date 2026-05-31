import { signal, computed } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import {
  createGun,
  makeIdentity,
  signMessage,
  verifyMessage,
  type PeerEvent,
  type VerifiedMessage
} from './gun-client'

const ROOM_ID = 'phase0-spike'

const ready = signal(false)
const identityPub = signal<string | null>(null)
const draft = signal('')
const messages = signal<VerifiedMessage[]>([])
const peerEvents = signal<PeerEvent[]>([])
const peerUrls = signal<string[]>([])
const connectStartMs = signal<number | null>(null)
const firstHiDelayMs = signal<number | null>(null)
const firstMessageDelayMs = signal<number | null>(null)
const errorMsg = signal<string | null>(null)

type RoomHandle = ReturnType<typeof createGun>['room']
let roomHandle: RoomHandle | null = null
let identityPair: { pub: string; priv: string } | null = null
let firstMessageMarked = false
let firstHiMarked = false

function logEvent(ev: PeerEvent) {
  peerEvents.value = [ev, ...peerEvents.value].slice(0, 40)
  console.debug('[gun]', ev)
  if (ev.event === 'hi' && !firstHiMarked && connectStartMs.value !== null) {
    firstHiMarked = true
    firstHiDelayMs.value = performance.now() - connectStartMs.value
  }
}

async function init() {
  try {
    const t0 = performance.now()
    connectStartMs.value = t0

    const { room, peers } = createGun(ROOM_ID, logEvent)
    roomHandle = room
    peerUrls.value = peers

    const pair = await makeIdentity()
    identityPair = pair
    identityPub.value = pair.pub

    // biome-ignore lint/suspicious/noExplicitAny: Gun callback shape
    room.map().on(async (data: any, _key: string) => {
      if (!data || typeof data !== 'object') return
      if (typeof data.payload !== 'string' || typeof data.pub !== 'string') return

      logEvent({ ts: Date.now(), event: 'in', detail: `payload from ${data.pub.slice(0, 12)}…` })

      const previewText = typeof data?.preview?.text === 'string' ? data.preview.text : ''
      const previewTs = typeof data?.preview?.ts === 'number' ? data.preview.ts : 0

      const verified = await verifyMessage({
        pub: data.pub,
        payload: data.payload,
        preview: { text: previewText, ts: previewTs }
      })

      if (!firstMessageMarked && connectStartMs.value !== null) {
        firstMessageMarked = true
        firstMessageDelayMs.value = performance.now() - connectStartMs.value
      }

      const existingIndex = messages.value.findIndex(
        (m) => m.pub === verified.pub && m.ts === verified.ts
      )
      if (existingIndex === -1) {
        messages.value = [...messages.value, verified].sort((a, b) => a.ts - b.ts)
      }
    })

    ready.value = true
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : String(e)
  }
}

async function send() {
  if (!identityPair || !roomHandle || !draft.value.trim()) return
  const signed = await signMessage(draft.value.trim(), identityPair)
  const key = `${signed.pub.slice(0, 8)}-${signed.preview.ts}`
  logEvent({ ts: Date.now(), event: 'put', detail: `sending key=${key}` })
  // biome-ignore lint/suspicious/noExplicitAny: Gun put accepts plain objects
  ;(roomHandle as any).get(key).put({
    pub: signed.pub,
    payload: signed.payload,
    preview: signed.preview
  })
  draft.value = ''
}

async function selfEcho() {
  if (!identityPair) return
  const signed = await signMessage('local SEA test', identityPair)
  const verified = await verifyMessage(signed)
  messages.value = [
    ...messages.value,
    { ...verified, text: `[local-only] ${verified.text}` }
  ].sort((a, b) => a.ts - b.ts)
  logEvent({
    ts: Date.now(),
    event: 'put',
    detail: `self-echo verify=${verified.verified ? 'OK' : 'FAIL'}`
  })
}

const verifiedCount = computed(() => messages.value.filter((m) => m.verified).length)
const unverifiedCount = computed(() => messages.value.filter((m) => !m.verified).length)
const hiCount = computed(() => peerEvents.value.filter((e) => e.event === 'hi').length)
const byeCount = computed(() => peerEvents.value.filter((e) => e.event === 'bye').length)

function fmtMs(ms: number | null): string {
  if (ms === null) return '(not yet)'
  return `${Math.round(ms)} ms`
}

export function App() {
  useEffect(() => {
    void init()
  }, [])

  return (
    <div>
      <div class="panel">
        <h2>Status</h2>
        <dl class="stats">
          <dt>Ready</dt>
          <dd>{ready.value ? 'yes' : 'connecting…'}</dd>
          <dt>My identity (pub)</dt>
          <dd>{identityPub.value ? `${identityPub.value.slice(0, 24)}…` : '(generating)'}</dd>
          <dt>Configured peers</dt>
          <dd>
            <ul style={{ margin: 0, paddingLeft: '1rem' }}>
              {peerUrls.value.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </dd>
          <dt>Connections (hi / bye)</dt>
          <dd>
            {hiCount.value} / {byeCount.value}
          </dd>
          <dt>Time to first 'hi'</dt>
          <dd>{fmtMs(firstHiDelayMs.value)}</dd>
          <dt>Time to first inbound message</dt>
          <dd>{fmtMs(firstMessageDelayMs.value)}</dd>
          <dt>Verified / unverified</dt>
          <dd>
            {verifiedCount.value} / {unverifiedCount.value}
          </dd>
          {errorMsg.value && (
            <>
              <dt>Error</dt>
              <dd style={{ color: '#c0392b' }}>{errorMsg.value}</dd>
            </>
          )}
        </dl>
      </div>

      <div class="panel">
        <h2>Chat (room: {ROOM_ID})</h2>
        <div class="messages">
          {messages.value.length === 0 && (
            <div class="meta">
              No messages yet. Open a second tab to test peer exchange. Use the "Self-echo" button below to verify SEA
              signing works locally without peers.
            </div>
          )}
          {messages.value.map((m) => (
            <div class={`msg ${m.verified ? 'verified' : 'unverified'}`} key={`${m.pub}-${m.ts}`}>
              <div>{m.text}</div>
              <div class="meta">
                {m.verified ? '✓ signature verified' : '✗ signature INVALID'} ·{' '}
                {new Date(m.ts).toLocaleTimeString()} · {m.pub.slice(0, 12)}…
              </div>
            </div>
          ))}
        </div>
        <div class="row" style={{ marginTop: '0.75rem' }}>
          <input
            type="text"
            value={draft.value}
            disabled={!ready.value}
            placeholder="Type a message and press Send"
            onInput={(e) => {
              draft.value = (e.currentTarget as HTMLInputElement).value
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void send()
            }}
          />
          <button type="button" onClick={() => void send()} disabled={!ready.value || !draft.value.trim()}>
            Send
          </button>
          <button type="button" onClick={() => void selfEcho()} disabled={!ready.value}>
            Self-echo (no peer)
          </button>
        </div>
      </div>

      <div class="panel">
        <h2>Peer event log</h2>
        <div class="messages">
          {peerEvents.value.length === 0 && <div class="meta">(no events yet)</div>}
          {peerEvents.value.map((e, i) => (
            <div class="msg" key={`${e.ts}-${i}`}>
              <div class="meta">
                {new Date(e.ts).toLocaleTimeString()} · <strong>{e.event}</strong>
                {e.url && <> · {e.url}</>}
                {e.detail && <> · {e.detail}</>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div class="panel">
        <h2>Troubleshooting</h2>
        <p>
          If the "Connections (hi / bye)" counter stays at 0/0 after a few seconds, no GUN peer is reachable. Most likely
          cause: the default public peer is down. Fix:
        </p>
        <ol>
          <li>
            Open a second terminal and run <code>pnpm relay</code> in the spike directory.
          </li>
          <li>
            Reload this page. You should see a "hi" event with <code>http://localhost:8765/gun</code>.
          </li>
        </ol>
        <p>
          You can also override peers via URL: <code>?peer=http://localhost:8765/gun</code> (repeat the param for multiple
          peers).
        </p>
        <p>
          <strong>Self-echo</strong> button signs and verifies locally without any peer — use it to confirm SEA works
          even if no peer is reachable.
        </p>
      </div>
    </div>
  )
}
