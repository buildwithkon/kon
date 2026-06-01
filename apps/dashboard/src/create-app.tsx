/** @jsxImportSource preact */
import { signal } from '@preact/signals'
import { validateSubname } from '@konxyz/runtime-core'
import { deployment, recordNewApp, signInState } from './state'

const wrapStyle: import('preact').JSX.CSSProperties = {
  border: '1px solid #eee',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '2rem',
  background: '#fafbfc'
}

const headingStyle: import('preact').JSX.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 600,
  margin: '0 0 1rem'
}

const rowStyle: import('preact').JSX.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'stretch'
}

const inputStyle: import('preact').JSX.CSSProperties = {
  flex: '1 1 auto',
  padding: '0.6rem 0.75rem',
  border: '1px solid #ccc',
  borderRadius: '6px',
  font: 'inherit',
  fontSize: '0.95rem'
}

const suffixStyle: import('preact').JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0 0.75rem',
  background: '#f1f3f5',
  border: '1px solid #ccc',
  borderLeft: 0,
  borderRadius: '0 6px 6px 0',
  color: '#555',
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.85rem'
}

const buttonStyle = (enabled: boolean): import('preact').JSX.CSSProperties => ({
  padding: '0.6rem 1.25rem',
  background: enabled ? '#1a73e8' : '#cbd5e0',
  color: 'white',
  border: 0,
  borderRadius: '6px',
  font: 'inherit',
  fontWeight: 600,
  cursor: enabled ? 'pointer' : 'not-allowed'
})

const errorStyle: import('preact').JSX.CSSProperties = {
  marginTop: '0.75rem',
  color: '#c0392b',
  fontSize: '0.85rem'
}

const noteStyle: import('preact').JSX.CSSProperties = {
  marginTop: '0.75rem',
  fontSize: '0.8rem',
  color: '#888'
}

const subnameInput = signal('')

function onSubmit(address: `0x${string}`, ensDomain: string) {
  const raw = subnameInput.value.trim().toLowerCase()
  const v = validateSubname(raw)
  if (!v.ok || !v.normalized) {
    // Validation already surfaces inline below — no-op here so the
    // computed error stays the source of truth.
    return
  }
  const fullId = `${v.normalized}.${ensDomain}`
  recordNewApp(address, {
    id: fullId,
    name: v.normalized,
    entryCid: null,
    updatedAt: new Date().toISOString()
  })
  subnameInput.value = ''
}

export function CreateAppCard() {
  const state = signInState.value
  if (state.status !== 'signed') return null
  const d = deployment.value
  const raw = subnameInput.value.trim().toLowerCase()
  const validation = raw === '' ? null : validateSubname(raw)
  const canSubmit = validation?.ok === true
  return (
    <div style={wrapStyle}>
      <div style={headingStyle}>Create a new app</div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          type="text"
          placeholder="ethtokyo"
          value={subnameInput.value}
          onInput={(e) => {
            subnameInput.value = e.currentTarget.value
          }}
          autoComplete="off"
          spellcheck={false}
        />
        <div style={suffixStyle}>.{d.ens_domain}</div>
        <button
          type="button"
          style={buttonStyle(canSubmit)}
          disabled={!canSubmit}
          onClick={() => onSubmit(state.address, d.ens_domain)}
        >
          Claim
        </button>
      </div>
      {validation && !validation.ok && <div style={errorStyle}>{validation.reason}</div>}
      <div style={noteStyle}>
        Claiming reserves the subname locally for now. ENS provisioning + on-chain write land in Phase 8
        alongside Dashboard publish.
      </div>
    </div>
  )
}
