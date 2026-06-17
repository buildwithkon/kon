/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks'
import type { KonPluginComponent } from '@konxyz/runtime-core'
import { deriveSeaPair, openGunChat, type GunChatHandle, type VerifiedMessage } from './gun-chat'

export interface ForumPluginProps {
  /** GUN graph path scoping this forum (e.g. 'ethtokyo-2026-main'). */
  gunPath: string
  /** Optional fallback link shown if GUN cannot connect (Telegram / Element / etc). */
  fallbackUrl?: string
  /** Optional title shown above the chat. */
  title?: string
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  height: 'calc(100dvh - 12rem)',
  border: '1px solid #ddd',
  borderRadius: '12px',
  overflow: 'hidden' as const
}

const headerStyle = {
  padding: '0.75rem 1rem',
  borderBottom: '1px solid #eee',
  fontSize: '0.85rem',
  color: '#666',
  fontFamily: 'ui-monospace, monospace'
}

const messagesStyle = {
  flex: 1,
  overflowY: 'auto' as const,
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.5rem'
}

const msgStyle = (verified: boolean) => ({
  padding: '0.6rem 0.8rem',
  borderRadius: '10px',
  background: verified ? '#f5f5f5' : '#fef0f0',
  borderLeft: `3px solid ${verified ? '#0c7a3e' : '#c0392b'}`
})

const inputRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  padding: '0.75rem',
  borderTop: '1px solid #eee',
  background: '#fafafa'
}

const inputStyle = {
  flex: 1,
  padding: '0.6rem 0.95rem',
  borderRadius: '999px',
  border: '1px solid rgba(20,18,30,0.12)',
  background: '#fff',
  font: 'inherit'
}

const buttonStyle = {
  padding: '0.6rem 1.2rem',
  borderRadius: '999px',
  border: 0,
  background: 'var(--kon-accent, #1a73e8)',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600,
  font: 'inherit'
}

const Forum: KonPluginComponent<ForumPluginProps> = ({ props, context }) => {
  const [handle, setHandle] = useState<GunChatHandle | null>(null)
  const [messages, setMessages] = useState<VerifiedMessage[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [myPub, setMyPub] = useState<string | null>(null)

  useEffect(() => {
    if (!props?.gunPath) {
      setError('Forum plugin: gunPath prop is required')
      return
    }
    let cancelled = false
    let unsub: (() => void) | null = null

    void (async () => {
      try {
        const { key } = await context.wallet.requestKeyDerivation('gun-sea')
        if (cancelled) return
        const pair = await deriveSeaPair(key)
        if (cancelled) return
        const chat = openGunChat({
          peers: context.deployment.gun_peers,
          path: props.gunPath,
          pair
        })
        setHandle(chat)
        setMyPub(chat.pub())
        unsub = chat.subscribe((msg) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.pub === msg.pub && m.ts === msg.ts)
            if (exists) return prev
            return [...prev, msg].toSorted((a, b) => a.ts - b.ts)
          })
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })()

    return () => {
      cancelled = true
      unsub?.()
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: context object identity intentionally stable
  }, [props?.gunPath])

  if (error) {
    return (
      <div style={{ padding: '1rem', background: '#fef0f0', borderRadius: '8px' }}>
        <strong>Forum unavailable.</strong> {error}
        {props?.fallbackUrl && (
          <div style={{ marginTop: '0.5rem' }}>
            Use the fallback chat:{' '}
            <a href={props.fallbackUrl} target="_blank" rel="noreferrer">
              {props.fallbackUrl}
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        {props?.title ?? 'forum'} · path: <code>{props?.gunPath ?? '?'}</code>
        {myPub && (
          <>
            {' '}
            · me: <code>{myPub.slice(0, 12)}…</code>
          </>
        )}
      </div>
      <div style={messagesStyle}>
        {messages.length === 0 && (
          <div style={{ color: '#888', fontStyle: 'italic' }}>
            No messages yet. Open in another tab / device to test peer exchange.
          </div>
        )}
        {messages.map((m) => (
          <div key={`${m.pub}-${m.ts}`} style={msgStyle(m.verified)}>
            <div>{m.text}</div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.2rem' }}>
              {m.verified ? '✓' : '✗'} {m.pub.slice(0, 10)}… · {new Date(m.ts).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      <div style={inputRowStyle}>
        <input
          type="text"
          value={draft}
          disabled={!handle}
          placeholder={handle ? 'Type a message…' : 'Connecting…'}
          style={inputStyle}
          onInput={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && handle && draft.trim()) {
              void handle.send(draft.trim())
              setDraft('')
            }
          }}
        />
        <button
          type="button"
          style={buttonStyle}
          disabled={!handle || !draft.trim()}
          onClick={() => {
            if (handle && draft.trim()) {
              void handle.send(draft.trim())
              setDraft('')
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default Forum
