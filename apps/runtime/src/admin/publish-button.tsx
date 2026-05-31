/** @jsxImportSource preact */
import { canonicalize } from '@konxyz/runtime-core'
import { deployment, manifest as loadedManifest } from '../state'
import { draft, isDirty, publishState, signInState, validation } from './state'

const wrapStyle: import('preact').JSX.CSSProperties = {
  position: 'sticky',
  bottom: 0,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(6px)',
  borderTop: '1px solid #eee',
  padding: '1rem',
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center'
}

const primaryStyle = (enabled: boolean): import('preact').JSX.CSSProperties => ({
  padding: '0.7rem 1.5rem',
  background: enabled ? '#1a73e8' : '#cbd5e0',
  color: 'white',
  border: 0,
  borderRadius: '8px',
  font: 'inherit',
  fontWeight: 600,
  cursor: enabled ? 'pointer' : 'not-allowed'
})

const statusStyle: import('preact').JSX.CSSProperties = {
  fontSize: '0.85rem',
  color: '#444'
}

/**
 * Phase-8 placeholder publish. The real flow runs entirely in-browser:
 *   1. canonicalize draft
 *   2. w3up-client uploadDirectory(manifest + entry + index.html)
 *   3. wallet.signTx({ to: ENS resolver, data: setContenthash(...) })
 *   4. confirm receipt, mark draft as published
 *
 * Today we only do step 1 (which is pure JS, no creds needed) and
 * stub steps 2-4. The user sees the canonical manifest + a "would
 * publish" success state — enough to validate the editor wiring and
 * the dashboard UX before wallet sign + IPFS upload are wired live.
 */
async function publish() {
  const m = draft.value
  if (!m) return
  publishState.value = { status: 'preparing' }
  try {
    const canonical = canonicalize(m)
    console.log('[publish] canonical manifest:', canonical.length, 'bytes')
    console.log(canonical)
    publishState.value = { status: 'uploading' }
    await new Promise((r) => setTimeout(r, 600))
    publishState.value = { status: 'signing' }
    await new Promise((r) => setTimeout(r, 600))
    // STUB: real flow would return CID + tx hash from the wallet sdk
    publishState.value = {
      status: 'success',
      cid: 'bafy_STUB_FROM_DASHBOARD_PUBLISH_PHASE8_PENDING'
    }
    // Pretend the published manifest is now the loaded one
    loadedManifest.value = m
  } catch (e) {
    publishState.value = { status: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

function statusMessage(): string {
  const s = publishState.value
  if (s.status === 'preparing') return 'preparing release…'
  if (s.status === 'uploading') return 'uploading to IPFS…'
  if (s.status === 'signing') return 'awaiting wallet signature…'
  if (s.status === 'success') return 'published. CID: ' + s.cid
  if (s.status === 'error') return 'publish failed: ' + s.message
  return ''
}

export function PublishButton() {
  const signIn = signInState.value
  const v = validation.value
  const dirty = isDirty.value
  const publishing =
    publishState.value.status === 'preparing' ||
    publishState.value.status === 'uploading' ||
    publishState.value.status === 'signing'
  const canPublish =
    signIn.status === 'signed' &&
    v.ok &&
    (dirty || publishState.value.status === 'idle') &&
    !publishing &&
    draft.value !== null

  return (
    <div style={wrapStyle}>
      <button
        type="button"
        style={primaryStyle(canPublish)}
        disabled={!canPublish}
        onClick={() => void publish()}
      >
        {publishing ? 'publishing…' : 'Publish (stub)'}
      </button>
      <div style={statusStyle}>
        {signIn.status !== 'signed' && <span>Sign in first.</span>}
        {signIn.status === 'signed' && !v.ok && <span>Fix validation issues to publish.</span>}
        {signIn.status === 'signed' && v.ok && !dirty && publishState.value.status === 'idle' && (
          <span>No edits to publish.</span>
        )}
        {publishState.value.status !== 'idle' && <span>{statusMessage()}</span>}
      </div>
      <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#888' }}>
        Real publish wires when Phase 8 lands — wallet.signTx + w3up upload.
      </div>
    </div>
  )
}
