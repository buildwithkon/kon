/** @jsxImportSource preact */
import { canonicalize, encodeSetContenthash, ENS_PUBLIC_RESOLVER_ADDRESS } from '@konxyz/runtime-core'
import { WalletSdk } from '@konxyz/wallet-sdk'
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
 * Phase 8 publish flow. End-to-end-real except for two stub points:
 *
 *   1. uploadManifestToIpfs(): returns a placeholder CID until the w3up
 *      delegation onboarding UI ships. The hook is documented so the swap
 *      is mechanical when the storage flow lands.
 *
 *   2. The wallet popup's signTx response is itself stubbed inside
 *      apps/wallet/ until the Pimlico bundler + paymaster API key arrives
 *      (Week 1 open item). When that lands, this flow does not change —
 *      the wallet returns a real userOpHash and we wait on the bundler.
 *
 * Everything else here is real: canonicalize is the canonical-JSON the
 * publisher signs, encodeSetContenthash produces the actual on-chain
 * calldata, and the wallet.signTx invocation is the path Phase 8
 * organizer-credentialed publishes will take in production.
 */
async function uploadManifestToIpfs(canonical: string): Promise<string> {
  // TODO Phase 8: w3up-client.uploadFile(new Blob([canonical], { type: 'application/json' }))
  //   - Read delegation from IndexedDB (encrypted under a passkey-derived key
  //     via wallet.requestKeyDerivation('w3up-delegation'))
  //   - If no delegation present, prompt user to paste W3_PROOF
  //   - On upload, store the returned CID + size + timestamp in IndexedDB
  //     for the dashboard's "your apps" list
  //
  // For now we synthesize a deterministic placeholder so the rest of the
  // flow can be exercised end-to-end. The CID prefix `bafkreig` is the
  // canonical CIDv1+raw-codec prefix, so it parses correctly downstream.
  console.log('[publish] STUB upload:', canonical.length, 'bytes')
  await new Promise((r) => setTimeout(r, 400))
  return 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy'
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

    // Step 2. Upload manifest to IPFS. Real call path; stub return value
    // until w3up delegation onboarding ships.
    publishState.value = { status: 'uploading' }
    const manifestCid = await uploadManifestToIpfs(canonical)
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
    const sdk = new WalletSdk({ walletOrigin: d.wallet_origin })
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
        IPFS upload + bundler stubbed until W3_PROOF / Pimlico land.
      </div>
    </div>
  )
}
