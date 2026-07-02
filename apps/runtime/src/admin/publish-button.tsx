/** @jsxImportSource preact */
import { canonicalize, encodeSetContenthash, ENS_PUBLIC_RESOLVER_ADDRESS } from '@konxyz/runtime-core'
import { AccountSDK } from '@konxyz/account-sdk'
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
 * Phase 8 publish flow — end-to-end-real except for the wallet popup's
 * signTx response, which is stubbed inside apps/account/ until the Pimlico
 * bundler + paymaster API key arrives (Week 1 open item). When that lands,
 * this flow does not change — the wallet returns a real userOpHash and
 * we wait on the bundler.
 *
 * Everything else here is real:
 *   - canonicalize produces the canonical JSON bytes the publisher signs
 *   - uploadManifestToIpfs POSTs to the relay-ipfs /api/pin endpoint and
 *     gets a real CID back (relay enforces per-IP rate-limit + quota)
 *   - encodeSetContenthash produces the actual on-chain calldata, byte
 *     identical to what the CLI publish pipeline produces
 *   - wallet.signTx is the path Phase 8 organizer-credentialed publishes
 *     take in production
 */
async function uploadManifestToIpfs(canonical: string, pinEndpoint: string): Promise<string> {
  // Default path: POST the canonical manifest to the relay-ipfs /api/pin
  // endpoint. Stage 1 has no auth — the endpoint enforces per-IP rate
  // limits + daily quota; Phase 9 hardening will add passkey-signed
  // headers.
  //
  // For organizers who outgrow the relay's free-tier quota: paste their
  // own w3up delegation in onboarding → encrypted in IndexedDB under a
  // passkey-derived key → uploadManifestToIpfs falls through to
  // w3up-client. That code path lands when the first real organizer hits
  // the cap; for ETHTokyo-scale events the relay quota is comfortable.
  const res = await fetch(pinEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: canonical
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`pin endpoint ${res.status}: ${body}`)
  }
  const json = (await res.json()) as { cid?: string; bytes?: number; error?: string }
  if (!json.cid) {
    throw new Error(`pin endpoint returned no CID: ${json.error ?? 'unknown'}`)
  }
  return json.cid
}

async function publish() {
  const m = draft.value
  const d = deployment.value
  if (!m || !d) return
  publishState.value = { status: 'preparing' }
  try {
    // Step 1. Canonicalize. Real bytes — what the publisher signs over.
    const canonical = canonicalize(m)
    console.log('[publish] canonical manifest:', canonical.length, 'bytes')

    // Step 2. Upload manifest to IPFS via relay-ipfs /api/pin. Real bytes,
    // real CID, real Bitswap-announceable block. The endpoint URL flows
    // through resolveDeployment so a self-host operator's manifest can
    // point at gateway.<their-domain>/api/pin instead.
    publishState.value = { status: 'uploading' }
    const manifestCid = await uploadManifestToIpfs(canonical, d.ipfs_pin_endpoint)
    console.log('[publish] manifest CID:', manifestCid)

    // Step 3. Encode the ENS setContenthash calldata. The runtime-core
    // helpers ipfsContenthash() + namehash() + encodeFunctionData()
    // produce byte-identical output here and in the CLI publish pipeline,
    // so the on-chain effect is the same regardless of which path
    // submitted it.
    const calldata = encodeSetContenthash(m.app.id, manifestCid)
    console.log('[publish] setContenthash calldata:', calldata.slice(0, 18), '…')

    // Step 4. Wallet popup signs + submits. The wallet handles
    //   - chain selection (Base mainnet for kon.xyz; configurable per
    //     deployment.ens_domain)
    //   - resolver address lookup (defaults to the public resolver,
    //     overridable per deployment)
    //   - Safe smart-account → ERC-4337 UserOp construction
    //   - Pimlico bundler + paymaster sponsorship
    // From our side it's one call returning a userOpHash.
    publishState.value = { status: 'signing' }
    const sdk = new AccountSDK({ walletOrigin: d.wallet_origin })
    const { userOpHash } = await sdk.signTx({
      chainId: 8453, // Base mainnet — TODO read from deployment.chain when added
      to: ENS_PUBLIC_RESOLVER_ADDRESS,
      data: calldata,
      description: `Update ${m.app.id} contenthash → ${manifestCid.slice(0, 12)}…`
    })
    console.log('[publish] userOpHash:', userOpHash)

    publishState.value = {
      status: 'success',
      cid: manifestCid,
      txHash: userOpHash
    }
    loadedManifest.value = m
  } catch (e) {
    publishState.value = { status: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

function statusMessage(): string {
  const s = publishState.value
  if (s.status === 'preparing') return 'preparing release…'
  if (s.status === 'uploading') return 'uploading manifest to IPFS…'
  if (s.status === 'signing') return 'awaiting wallet signature…'
  if (s.status === 'success') {
    const tx = s.txHash ? ` · tx: ${s.txHash.slice(0, 10)}…` : ''
    return `published. CID: ${s.cid.slice(0, 12)}…${tx}`
  }
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
        {publishing ? 'publishing…' : 'Publish'}
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
        Pimlico bundler + Coinbase paymaster · w3up upgrade path Phase 9.
      </div>
    </div>
  )
}
