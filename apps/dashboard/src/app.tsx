/** @jsxImportSource preact */
import { deployment, signInState } from './state'
import { SignInPanel } from './sign-in'
import { CreateAppCard } from './create-app'
import { AppsList } from './apps-list'

const shellStyle: import('preact').JSX.CSSProperties = {
  fontFamily: 'system-ui, sans-serif',
  background: '#f7f8fa',
  minHeight: '100vh',
  color: '#222'
}

const containerStyle: import('preact').JSX.CSSProperties = {
  maxWidth: '880px',
  margin: '0 auto',
  padding: '2rem 1.5rem'
}

const headerStyle: import('preact').JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginBottom: '2rem',
  gap: '1rem'
}

const brandStyle: import('preact').JSX.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  letterSpacing: '-0.01em'
}

const taglineStyle: import('preact').JSX.CSSProperties = {
  fontSize: '0.85rem',
  color: '#888'
}

const sectionHeadingStyle: import('preact').JSX.CSSProperties = {
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#666',
  margin: '0 0 0.75rem',
  fontWeight: 600
}

const signOutStyle: import('preact').JSX.CSSProperties = {
  background: 'transparent',
  border: '1px solid #ddd',
  color: '#666',
  borderRadius: '6px',
  padding: '0.35rem 0.75rem',
  fontSize: '0.8rem',
  fontFamily: 'inherit',
  cursor: 'pointer'
}

export function App() {
  const signIn = signInState.value
  const d = deployment.value

  return (
    <div style={shellStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <div style={brandStyle}>KON</div>
            <div style={taglineStyle}>my.{d.ens_domain} — your apps, your community</div>
          </div>
          {signIn.status === 'signed' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem', color: '#666' }}>
                {signIn.address.slice(0, 8)}…{signIn.address.slice(-6)}
                {signIn.ens && (
                  <>
                    {' · '}
                    <code>{signIn.ens}</code>
                  </>
                )}
              </div>
              <button
                type="button"
                style={signOutStyle}
                onClick={() => {
                  signInState.value = { status: 'idle' }
                }}
              >
                sign out
              </button>
            </div>
          )}
        </header>

        {signIn.status !== 'signed' ? (
          <SignInPanel />
        ) : (
          <>
            <CreateAppCard />
            <div style={sectionHeadingStyle}>Your apps</div>
            <AppsList />
          </>
        )}
      </div>
    </div>
  )
}
