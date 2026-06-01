/** @jsxImportSource preact */
import { WalletSdk } from '@konxyz/wallet-sdk'
import { deployment, loadOwnedApps, signInState } from './state'

const cardStyle: import('preact').JSX.CSSProperties = {
  maxWidth: '440px',
  margin: '4rem auto',
  padding: '2.5rem 2rem',
  border: '1px solid #eee',
  borderRadius: '12px',
  textAlign: 'center',
  background: 'white'
}

const headingStyle: import('preact').JSX.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  margin: '0 0 0.5rem'
}

const subStyle: import('preact').JSX.CSSProperties = {
  color: '#666',
  marginBottom: '2rem',
  lineHeight: 1.5
}

const buttonStyle: import('preact').JSX.CSSProperties = {
  padding: '0.85rem 1.75rem',
  background: '#1a73e8',
  color: 'white',
  border: 0,
  borderRadius: '8px',
  font: 'inherit',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer'
}

const errorStyle: import('preact').JSX.CSSProperties = {
  marginTop: '1rem',
  color: '#c0392b',
  fontSize: '0.85rem'
}

const footnoteStyle: import('preact').JSX.CSSProperties = {
  marginTop: '1.5rem',
  fontSize: '0.75rem',
  color: '#999',
  fontFamily: 'ui-monospace, monospace'
}

async function signIn() {
  signInState.value = { status: 'signing' }
  try {
    const sdk = new WalletSdk({ walletOrigin: deployment.value.wallet_origin })
    const result = await sdk.openSignIn()
    signInState.value = { status: 'signed', address: result.address, ens: result.ens }
    loadOwnedApps(result.address)
  } catch (e) {
    signInState.value = { status: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

export function SignInPanel() {
  const state = signInState.value
  const d = deployment.value
  return (
    <div style={cardStyle}>
      <div style={headingStyle}>Sign in to KON</div>
      <div style={subStyle}>
        Manage the apps your community owns. Sign-in opens a popup on the wallet origin; your passkey and Safe
        smart-account stay scoped to that origin.
      </div>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => void signIn()}
        disabled={state.status === 'signing'}
      >
        {state.status === 'signing' ? 'opening wallet…' : 'Sign in with KON wallet'}
      </button>
      {state.status === 'error' && <div style={errorStyle}>{state.message}</div>}
      <div style={footnoteStyle}>wallet origin: {d.wallet_origin}</div>
    </div>
  )
}
