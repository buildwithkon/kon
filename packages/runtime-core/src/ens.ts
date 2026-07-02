/**
 * ENS publish-side encoding helpers.
 *
 * Both the CLI publish pipeline and the browser dashboard need to encode the
 * same two calls:
 *
 *   1. `setContenthash(bytes32 node, bytes hash)` on the public ENS resolver,
 *      to point an existing subname at a new IPFS CID.
 *
 *   2. `setSubnodeOwner(bytes32 node, bytes32 label, address owner)` on the
 *      ENS Registry, to claim a fresh `<app>.kon.xyz` subname under the
 *      organizer's wallet (Phase 8 dashboard "Claim" flow).
 *
 * Encoding these in one place keeps the publish path (Node/Bun) and the
 * dashboard (browser) byte-for-byte identical. Wrong encoding = wrong tx =
 * wrong on-chain state, so this module is heavily tested.
 *
 * The actual transaction submission happens elsewhere:
 *   - CLI: scripts/lib/ens.mjs (viem walletClient with KON_DEPLOY_KEY)
 *   - Browser: wallet.signTx({ to, data, ...}) via @konxyz/account-sdk
 *
 * Note on IPFS contenthash: ENS stores contenthash as a multicodec-prefixed
 * varint+CID byte string per EIP-1577. The viem helper
 * `contentHashFromString(...)` (which exists for some content types but not
 * all) is not used here; we encode by hand to avoid the helper churn across
 * viem versions and to keep the dependency surface minimal.
 */

import { encodeFunctionData, keccak256, toHex } from 'viem'
import { CID } from 'multiformats/cid'

/** ENS public Resolver ABI subset — only the methods we encode. */
export const ENS_RESOLVER_ABI = [
  {
    type: 'function',
    name: 'setContenthash',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'hash', type: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  }
] as const

/** ENS Registry ABI subset — only the methods we encode. */
export const ENS_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'setSubnodeOwner',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'label', type: 'bytes32' },
      { name: 'owner', type: 'address' }
    ],
    outputs: [{ type: 'bytes32' }],
    stateMutability: 'nonpayable'
  }
] as const

/**
 * Compute the ENS namehash for an arbitrary name. Recursive keccak per the ENS
 * spec: namehash('') = 0x00..00; namehash('a.b') = keccak256(namehash('b') || keccak256('a')).
 *
 * Implemented inline rather than importing viem/ens because that module
 * pulls a larger dependency surface; the namehash function itself is ~5
 * lines and stable since ENS launch.
 */
export function namehash(name: string): `0x${string}` {
  let node: `0x${string}` = `0x${'00'.repeat(32)}`
  if (!name) return node
  const labels = name.split('.').toReversed()
  for (const label of labels) {
    const labelHashHex = keccak256(toHex(label))
    node = keccak256(`${node}${labelHashHex.slice(2)}` as `0x${string}`)
  }
  return node
}

/** Convenience: keccak256(label) for `setSubnodeOwner`'s label argument. */
export function labelHash(label: string): `0x${string}` {
  return keccak256(toHex(label))
}

/**
 * Encode an IPFS CID as an ENS contenthash byte string per EIP-1577.
 *
 * Layout:
 *   0xe3        — protocol code for "ipfs"
 *   0x01        — multicodec varint prefix marker (constant for CIDv1)
 *   <CIDv1 bytes>  — raw bytes of the CID
 *
 * Both CIDv0 (Qm...) and CIDv1 (bafy...) inputs are normalized to CIDv1
 * before encoding so the on-chain shape is uniform regardless of source.
 */
export function ipfsContenthash(cidString: string): `0x${string}` {
  const cid = CID.parse(cidString.replace(/^ipfs:\/\//, ''))
  const v1 = cid.version === 1 ? cid : cid.toV1()
  const bytes = v1.bytes
  // EIP-1577: 0xe3 (ipfs) + 0x01 (varint, always 1 for our CIDv1 dag-pb cases) + CID bytes
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `0xe30101${hex}` as `0x${string}`
}

/**
 * Build the calldata for `Resolver.setContenthash(namehash(name), ipfsContenthash(cid))`.
 *
 * The caller still has to specify which Resolver contract to send to. For
 * kon.xyz subnames imported via DNS-ENS, the public resolver at
 * 0x231b... handles all subnames; for native .eth names a different
 * resolver may apply. The publish pipeline reads the resolver address from
 * the on-chain ENS Registry at publish time.
 */
export function encodeSetContenthash(name: string, cid: string): `0x${string}` {
  return encodeFunctionData({
    abi: ENS_RESOLVER_ABI,
    functionName: 'setContenthash',
    args: [namehash(name), ipfsContenthash(cid)]
  })
}

/**
 * Build the calldata for `Registry.setSubnodeOwner(namehash(parent), keccak(label), owner)`.
 *
 * Used by the dashboard's "Claim" flow when an organizer registers a new
 * `<app>.kon.xyz` subname under their wallet. Requires the caller to own
 * the parent `kon.xyz` node — for the default deployment, that's the KON
 * team's controller contract; for self-host, the operator's wallet.
 */
export function encodeSetSubnodeOwner(parent: string, label: string, owner: `0x${string}`): `0x${string}` {
  return encodeFunctionData({
    abi: ENS_REGISTRY_ABI,
    functionName: 'setSubnodeOwner',
    args: [namehash(parent), labelHash(label), owner]
  })
}

/**
 * Mainnet ENS Registry address. Same address on every chain ENS is deployed
 * to (Ethereum mainnet, Sepolia, Holesky). Pinned here so callers don't
 * have to repeat the literal.
 */
export const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const

/**
 * Public Resolver address on Ethereum mainnet. Same address on Sepolia +
 * Holesky for testing. For other resolver contracts (e.g. a custom one
 * deployed by a self-host operator), pass the address directly.
 */
export const ENS_PUBLIC_RESOLVER_ADDRESS = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63' as const
