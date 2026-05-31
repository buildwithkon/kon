/** @jsxImportSource preact */
import { deployment } from '../state'
import { signInState } from './state'
import { ensureWallet } from '../wallet-singleton'

const cardStyle: import('preact').JSX.CSSProperties = {
  padding: '2rem',
  border: '1px solid #eee',
  borderRadius: '12px',
  textAlign: 'center'
}

const headingStyle: import('preact').JSX.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  margin: '0 0 0.5rem'
}

const subStyle: import('preact').JSX.CSSProperties = {
  color: '#666',
  marginBottom: '1.5rem'
}

const buttonStyle: import('preact').JSX.CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: '#1a73e8',
  color: 'white',
  border: 0,
  borderRadius: '8px',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer'
}

const errorStyle: import('preact').JSX.CSSProperties = {
  marginTop: '0.75rem',
  color: '#c0392b',
  fontSize: '0.85rem'
}

async function signIn() {
  const d = deployment.value
  if (!d) {
    signInState.value = { status: 'error', message: 'deployment not resolved yet' }
    return
  }
  signInState.value = { status: 'signing' }
  try {
    // The wallet handle exposed through KonPluginWallet is the narrow plugin
    // surface; for the dashboard we go through the underlying SDK directly
    // so we get signTx + the full SignInResponse fields. ensureWallet builds
    // both when called; we reach into the SDK via a fresh new instance
    // here intentionally to keep the plugin handle abstraction intact.
    const { WalletSdk } = await import('@konxyz/wallet-sdk')
    const sdk = new WalletSdk({ walletOrigin: d.wallet_origin })
    const result = await sdk.openSignIn()
    signInState.value = {
      status: 'signed',
      address: result.address,
      ens: result.ens
    }
  } catch (e) {
    signInState.value = { status: 'error', message: e instanceof Error ? e.message : String(e) }
  }
  // Ensure the plugin-context wallet singleton is also constructed for the
  // current origin so any plugins rendered after sign-in see the same sdk.
  if (d) ensureWallet(d.wallet_origin)
}

export function SignInPanel() {
  const state = signInState.value
  return (
    <div style={cardStyle}>
      <div style={headingStyle}>Sign in to edit</div>
      <div style={subStyle}>
        Connect your KON wallet to edit this app. Edits are local until you click Publish.
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
    </div>
  )
}
