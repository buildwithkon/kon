/** @jsxImportSource preact */
import { manifest as loadedManifest } from '../state'
import { signInState } from './state'
import { SignInPanel } from './sign-in'
import { ManifestEditor } from './editor'
import { PublishButton } from './publish-button'

const wrapStyle: import('preact').JSX.CSSProperties = {
  maxWidth: '720px',
  margin: '0 auto',
  padding: '2rem 1rem 0',
  paddingBottom: '6rem'
}

const navBackStyle: import('preact').JSX.CSSProperties = {
  fontSize: '0.85rem',
  color: '#888',
  textDecoration: 'none',
  marginBottom: '1.5rem',
  display: 'inline-block'
}

export function AdminApp() {
  const m = loadedManifest.value
  const signIn = signInState.value

  if (!m) {
    return <div style={{ padding: '2rem', color: '#888' }}>Loading manifest…</div>
  }

  return (
    <div>
      <div style={wrapStyle}>
        <a href="/" style={navBackStyle}>
          ← Back to {m.app.name}
        </a>
        {signIn.status !== 'signed' ? (
          <SignInPanel />
        ) : (
          <>
            <div
              style={{
                fontSize: '0.85rem',
                color: '#666',
                marginBottom: '1.5rem',
                fontFamily: 'ui-monospace, monospace'
              }}
            >
              Signed in as{' '}
              <strong>
                {signIn.address.slice(0, 10)}…{signIn.address.slice(-6)}
              </strong>
              {signIn.ens && (
                <>
                  {' '}
                  · <code>{signIn.ens}</code>
                </>
              )}
            </div>
            <ManifestEditor />
          </>
        )}
      </div>
      {signIn.status === 'signed' && <PublishButton />}
    </div>
  )
}
