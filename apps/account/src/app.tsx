/** @jsxImportSource preact */
import { signal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import type {
  KeyDerivationRequest,
  SignInRequest,
  SignTxRequest,
  WalletRequest,
  WalletResponse
} from '@konxyz/account-sdk/protocol'
import { isAllowedAppOrigin } from './origin-allowlist'
import { createPasskey, describePasskey, loadAccount, loadStoredCredential } from './passkey'
import { safeAddressFromAccount, verifyAddressAcrossChains } from './safe'
import { listChains, PIMLICO_CONFIGURED } from './chains'
import { submitUserOp } from './submit-user-op'

type PendingRequest =
  | { kind: 'signIn'; req: SignInRequest; openerOrigin: string }
  | { kind: 'signTx'; req: SignTxRequest; openerOrigin: string }
  | { kind: 'deriveKey'; req: KeyDerivationRequest; openerOrigin: string }

const pending = signal<PendingRequest | null>(null)
const status = signal<string>('waiting for app to send a request')

function postToOpener(message: WalletResponse, targetOrigin: string) {
  if (!window.opener) {
    status.value = 'no opener window (open this from an app, not directly)'
    return
  }
  window.opener.postMessage(message, targetOrigin)
}

function handleAppMessage(ev: MessageEvent) {
  if (!isAllowedAppOrigin(ev.origin)) {
    status.value = `rejected message from disallowed origin: ${ev.origin}`
    return
  }
  const data = ev.data as WalletRequest | undefined
  if (!data || typeof data !== 'object' || typeof data.kind !== 'string') return

  if (data.kind === 'kon.signIn') {
    pending.value = { kind: 'signIn', req: data, openerOrigin: ev.origin }
    status.value = `sign-in request from ${ev.origin}`
    return
  }
  if (data.kind === 'kon.signTx') {
    pending.value = { kind: 'signTx', req: data, openerOrigin: ev.origin }
    status.value = `tx-sign request from ${ev.origin}`
    return
  }
  if (data.kind === 'kon.deriveKey') {
    pending.value = { kind: 'deriveKey', req: data, openerOrigin: ev.origin }
    status.value = `key-derivation request from ${ev.origin}`
    return
  }
  if (data.kind === 'kon.cancel') {
    pending.value = null
    window.close()
  }
}

const passkeyState = signal(describePasskey())
const busy = signal(false)
const passkeyError = signal<string | null>(null)
const cachedSafeAddress = signal<`0x${string}` | null>(null)

async function ensureSafeAddress(): Promise<`0x${string}`> {
  if (cachedSafeAddress.value) return cachedSafeAddress.value
  const account = loadAccount()
  // If multiple chains are configured, verify the invariant that the address
  // is identical across all of them (Safe v1.4.1 predeterministic deploy).
  // With a single chain, fall through to the cheap path.
  if (listChains().length > 1) {
    const { address } = await verifyAddressAcrossChains(account)
    cachedSafeAddress.value = address
    return address
  }
  const address = await safeAddressFromAccount(account)
  cachedSafeAddress.value = address
  return address
}

async function ensurePasskey(openerOrigin: string) {
  if (loadStoredCredential()) return
  busy.value = true
  passkeyError.value = null
  try {
    // Use the opener origin's hostname as the human-readable user name so the
    // OS password manager labels the credential informatively
    // ("yuji@matsuri.kon.xyz" style).
    const host = new URL(openerOrigin).hostname
    await createPasskey({ userName: host, label: host })
    passkeyState.value = describePasskey()
  } catch (e) {
    passkeyError.value = e instanceof Error ? e.message : String(e)
    throw e
  } finally {
    busy.value = false
  }
}

async function approveSignIn() {
  const p = pending.value
  if (!p || p.kind !== 'signIn') return
  try {
    await ensurePasskey(p.openerOrigin)
  } catch {
    reject('passkey_unavailable', passkeyError.value ?? 'passkey creation failed')
    return
  }
  let address: `0x${string}`
  try {
    address = await ensureSafeAddress()
  } catch (e) {
    reject('internal_error', e instanceof Error ? e.message : String(e))
    return
  }
  postToOpener(
    {
      kind: 'kon.signIn.ok',
      requestId: p.req.requestId,
      address
    },
    p.openerOrigin
  )
  setTimeout(() => window.close(), 100)
}

async function approveSignTx() {
  const p = pending.value
  if (!p || p.kind !== 'signTx') return

  // Dev fallback: when neither bundler nor paymaster env is set in the
  // build, we can't talk to a real ERC-4337 stack. Return a stub so the
  // dashboard publish flow exercises every step except the on-chain
  // submission. Production builds always have PIMLICO_CONFIGURED true.
  if (!PIMLICO_CONFIGURED) {
    postToOpener(
      {
        kind: 'kon.signTx.ok',
        requestId: p.req.requestId,
        userOpHash: '0xSTUB_USEROPHASH_REPLACED_WHEN_PIMLICO_IS_WIRED' as `0x${string}`
      },
      p.openerOrigin
    )
    setTimeout(() => window.close(), 100)
    return
  }

  // Real submission. The viem WebAuthn account is loaded from the stored
  // passkey credential (already created via the sign-in flow before any
  // signTx popup can open), then submit-user-op.ts:
  //   - builds the Safe smart-account client (same address as sign-in)
  //   - asks the configured paymaster for `paymasterAndData`
  //   - sends the UserOp through Pimlico's bundler
  //   - returns the bundler's userOpHash
  try {
    const account = loadAccount()
    const result = await submitUserOp(account, {
      chainId: p.req.chainId,
      to: p.req.to,
      data: p.req.data,
      value: p.req.value
    })
    console.log(`[account] signTx sent via ${result.paymasterVendor} paymaster:`, result.userOpHash)
    postToOpener(
      {
        kind: 'kon.signTx.ok',
        requestId: p.req.requestId,
        userOpHash: result.userOpHash
      },
      p.openerOrigin
    )
    setTimeout(() => window.close(), 100)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[account] signTx failed:', msg)
    // Categorize common failure modes so the dashboard UI can render
    // a more specific error than "internal_error".
    const code: 'user_cancelled' | 'paymaster_rejected' | 'passkey_unavailable' | 'internal_error' =
      /not allowed|cancelled|abort/i.test(msg)
        ? 'user_cancelled'
        : /paymaster|sponsor/i.test(msg)
          ? 'paymaster_rejected'
          : /passkey|webauthn|credential/i.test(msg)
            ? 'passkey_unavailable'
            : 'internal_error'
    postToOpener(
      {
        kind: 'kon.error',
        requestId: p.req.requestId,
        code,
        message: msg
      },
      p.openerOrigin
    )
    setTimeout(() => window.close(), 100)
  }
}

function approveDeriveKey() {
  const p = pending.value
  if (!p || p.kind !== 'deriveKey') return
  postToOpener(
    {
      kind: 'kon.deriveKey.ok',
      requestId: p.req.requestId,
      key: '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`
    },
    p.openerOrigin
  )
  setTimeout(() => window.close(), 100)
}

function reject(
  code:
    | 'user_cancelled'
    | 'unsupported_chain'
    | 'passkey_unavailable'
    | 'paymaster_rejected'
    | 'internal_error',
  message: string
) {
  const p = pending.value
  if (!p) return
  postToOpener(
    {
      kind: 'kon.error',
      requestId: p.req.requestId,
      code,
      message
    },
    p.openerOrigin
  )
  setTimeout(() => window.close(), 100)
}

const panelStyle = {
  fontFamily: 'system-ui, sans-serif',
  maxWidth: '380px',
  margin: '0 auto',
  padding: '1.5rem'
}

const heroStyle = {
  fontSize: '1.25rem',
  fontWeight: 700,
  marginBottom: '0.25rem'
}

const subStyle = {
  color: '#666',
  fontSize: '0.85rem',
  marginBottom: '1.5rem'
}

const buttonStyle = (variant: 'primary' | 'ghost') => ({
  display: 'block',
  width: '100%',
  padding: '0.7rem 1rem',
  borderRadius: '8px',
  border: variant === 'primary' ? '1px solid #1a73e8' : '1px solid #ddd',
  background: variant === 'primary' ? '#1a73e8' : 'white',
  color: variant === 'primary' ? 'white' : '#333',
  cursor: 'pointer',
  font: 'inherit',
  marginTop: '0.5rem'
})

export function App() {
  useEffect(() => {
    window.addEventListener('message', handleAppMessage)
    return () => window.removeEventListener('message', handleAppMessage)
  }, [])

  const p = pending.value

  if (!p) {
    return (
      <div style={panelStyle}>
        <div style={heroStyle}>KON wallet (stub)</div>
        <div style={subStyle}>{status.value}</div>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>
          Phase 2.6 placeholder. Real passkey + Safe + paymaster integration follows once the Pimlico / CDP
          paymaster choice and Safe{`{Core}`} v1.4+ predeterministic deploy are wired.
        </p>
      </div>
    )
  }

  if (p.kind === 'signIn') {
    const pk = passkeyState.value
    const action = pk.present && pk.matchesOrigin ? 'Sign in' : 'Create passkey & sign in'
    return (
      <div style={panelStyle}>
        <div style={heroStyle}>Sign in</div>
        <div style={subStyle}>{p.openerOrigin} wants to sign in</div>
        <div
          style={{
            color: '#888',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            fontFamily: 'ui-monospace, monospace'
          }}
        >
          passkey:{' '}
          {pk.present
            ? pk.matchesOrigin
              ? `✓ stored on ${pk.rpId}`
              : `! stored on ${pk.rpId} (origin mismatch)`
            : '(none — will create)'}
          <br />
          Safe address:{' '}
          {cachedSafeAddress.value
            ? `${cachedSafeAddress.value.slice(0, 10)}…${cachedSafeAddress.value.slice(-6)}`
            : '(derived after passkey)'}
        </div>
        {passkeyError.value && (
          <div style={{ color: '#c0392b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            passkey error: {passkeyError.value}
          </div>
        )}
        <button
          type="button"
          style={buttonStyle('primary')}
          onClick={() => void approveSignIn()}
          disabled={busy.value}
        >
          {busy.value ? 'creating passkey…' : action}
        </button>
        <button
          type="button"
          style={buttonStyle('ghost')}
          onClick={() => reject('user_cancelled', 'rejected by user')}
        >
          Cancel
        </button>
      </div>
    )
  }

  if (p.kind === 'signTx') {
    return (
      <div style={panelStyle}>
        <div style={heroStyle}>Confirm transaction</div>
        <div style={subStyle}>{p.openerOrigin}</div>
        <dl style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
          <dt style={{ color: '#888' }}>chain</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{p.req.chainId}</dd>
          <dt style={{ color: '#888' }}>to</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{p.req.to}</dd>
          <dt style={{ color: '#888' }}>value</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem' }}>{p.req.value ?? '0x0'}</dd>
          <dt style={{ color: '#888' }}>data</dt>
          <dd style={{ margin: '0 0 0.5rem 1rem', wordBreak: 'break-all' }}>{p.req.data}</dd>
          {p.req.description && (
            <>
              <dt style={{ color: '#888' }}>description</dt>
              <dd style={{ margin: '0 0 0.5rem 1rem' }}>{p.req.description}</dd>
            </>
          )}
        </dl>
        <button type="button" style={buttonStyle('primary')} onClick={approveSignTx}>
          Approve (stub sign-tx)
        </button>
        <button
          type="button"
          style={buttonStyle('ghost')}
          onClick={() => reject('user_cancelled', 'rejected by user')}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      <div style={heroStyle}>Derive key</div>
      <div style={subStyle}>
        {p.openerOrigin} requests label: <code>{p.req.label}</code>
      </div>
      <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
        STUB: returns a fixed 32-byte key. Real flow: passkey PRF extension or wallet-sig fallback.
      </div>
      <button type="button" style={buttonStyle('primary')} onClick={approveDeriveKey}>
        Approve (stub derive)
      </button>
      <button
        type="button"
        style={buttonStyle('ghost')}
        onClick={() => reject('user_cancelled', 'rejected by user')}
      >
        Cancel
      </button>
    </div>
  )
}
