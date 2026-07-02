/** @jsxImportSource preact */
import { signal } from '@preact/signals'
import { encodeSetSubnodeOwner, ENS_REGISTRY_ADDRESS, validateSubname } from '@konxyz/runtime-core'
import { AccountSDK } from '@konxyz/account-sdk'
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
const claimState = signal<
  | { status: 'idle' }
  | { status: 'signing' }
  | { status: 'success'; txHash: `0x${string}` }
  | { status: 'error'; message: string }
>({ status: 'idle' })

async function onSubmit(address: `0x${string}`, ensDomain: string, walletOrigin: string) {
  const raw = subnameInput.value.trim().toLowerCase()
  const v = validateSubname(raw)
  if (!v.ok || !v.normalized) return
  const label = v.normalized
  const fullId = `${label}.${ensDomain}`

  claimState.value = { status: 'signing' }
  try {
    // Build the on-chain claim: `ENS.setSubnodeOwner(namehash(ensDomain),
    // keccak(label), userAddress)`. This is the same call the CLI publish
    // pipeline would issue for KON-managed claims; the difference is the
    // signer (here it's the organizer's Safe, there it's KON_DEPLOY_KEY).
    //
    // The kon.xyz parent node must be controlled by the registrar contract
    // that authorizes the Safe to write. For Stage 1, organizers paying
    // the KON-team registrar fee delegate to a contract that wraps this
    // call. For self-host (where the organizer owns the parent node
    // outright), this single tx is sufficient.
    const calldata = encodeSetSubnodeOwner(ensDomain, label, address)
    const sdk = new AccountSDK({ walletOrigin })
    const { userOpHash } = await sdk.signTx({
      chainId: 8453, // Base mainnet — ENS Registry lives at the same address on every L1/L2 that has ENS
      to: ENS_REGISTRY_ADDRESS,
      data: calldata,
      description: `Claim ${fullId}`
    })

    recordNewApp(address, {
      id: fullId,
      name: label,
      entryCid: null,
      updatedAt: new Date().toISOString()
    })
    claimState.value = { status: 'success', txHash: userOpHash }
    subnameInput.value = ''
  } catch (e) {
    claimState.value = { status: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

export function CreateAppCard() {
  const state = signInState.value
  if (state.status !== 'signed') return null
  const d = deployment.value
  const raw = subnameInput.value.trim().toLowerCase()
  const validation = raw === '' ? null : validateSubname(raw)
  const claim = claimState.value
  const claiming = claim.status === 'signing'
  const canSubmit = validation?.ok === true && !claiming
  return (
    <div style={wrapStyle}>
      <div style={headingStyle}>Create a new app</div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          type="text"
          placeholder="ethtokyo"
          value={subnameInput.value}
          disabled={claiming}
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
          onClick={() => void onSubmit(state.address, d.ens_domain, d.wallet_origin)}
        >
          {claiming ? 'claiming…' : 'Claim'}
        </button>
      </div>
      {validation && !validation.ok && <div style={errorStyle}>{validation.reason}</div>}
      {claim.status === 'error' && <div style={errorStyle}>{claim.message}</div>}
      {claim.status === 'success' && (
        <div
          // oxlint-disable-next-line typescript/no-misused-spread -- spreading typed CSSProperties
          style={{ ...noteStyle, color: '#0c7a3e' }}
        >
          ✓ Claimed. tx: <code>{claim.txHash.slice(0, 10)}…</code>
        </div>
      )}
      <div style={noteStyle}>
        Claiming opens the wallet popup to sign{' '}
        <code>setSubnodeOwner(namehash({d.ens_domain}), keccak(label), you)</code> on the ENS Registry. The
        bundler returns a userOpHash; on-chain finality follows once the bundler submits — Pimlico integration
        is the current open item.
      </div>
    </div>
  )
}
