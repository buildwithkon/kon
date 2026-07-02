/** @jsxImportSource preact */
import { ownedApps, signInState } from './state'

const wrapStyle: import('preact').JSX.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1rem'
}

const cardStyle: import('preact').JSX.CSSProperties = {
  border: '1px solid #eee',
  borderRadius: '12px',
  padding: '1.25rem',
  background: 'white',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem'
}

const titleStyle: import('preact').JSX.CSSProperties = {
  fontWeight: 600,
  fontSize: '1.05rem'
}

const subtitleStyle: import('preact').JSX.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.8rem',
  color: '#777'
}

const cidStyle: import('preact').JSX.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.75rem',
  color: '#999',
  marginTop: '0.25rem'
}

const linkStyle: import('preact').JSX.CSSProperties = {
  marginTop: '0.75rem',
  fontSize: '0.85rem',
  color: '#1a73e8',
  textDecoration: 'none'
}

const emptyStyle: import('preact').JSX.CSSProperties = {
  padding: '3rem 1rem',
  textAlign: 'center',
  color: '#888',
  border: '1px dashed #ddd',
  borderRadius: '12px',
  background: '#fafafa'
}

export function AppsList() {
  const apps = ownedApps.value
  const signIn = signInState.value
  if (signIn.status !== 'signed') return null
  if (apps.length === 0) {
    return <div style={emptyStyle}>No apps yet. Claim a subname above to create your first one.</div>
  }
  return (
    <div style={wrapStyle}>
      {apps.map((a) => {
        const adminHref = `https://${a.id}/admin`
        return (
          <div key={a.id} style={cardStyle}>
            <div style={titleStyle}>{a.name}</div>
            <div style={subtitleStyle}>{a.id}</div>
            <div style={cidStyle}>
              entry: {a.entryCid ? `${a.entryCid.slice(0, 18)}…` : '(not yet published)'}
            </div>
            <a href={adminHref} style={linkStyle} target="_blank" rel="noopener noreferrer">
              open admin →
            </a>
          </div>
        )
      })}
    </div>
  )
}
