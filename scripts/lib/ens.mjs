// ENS contenthash update via viem, using the encoding helpers from
// runtime-core/ens.ts so the bytes that land on-chain are byte-for-byte
// identical to what the dashboard's publish flow would have produced
// (both paths go through encodeSetContenthash).
//
// Env vars:
//   KON_DEPLOY_KEY  hex private key authorized to update the ENS subname
//                   (typically the parent kon.xyz domain owner or a
//                   delegated controller).
//   ENS_RPC_URL     optional. Defaults to https://eth.llamarpc.com.
//   KON_DRY_RUN     optional. When set, prints the calldata + target but
//                   does NOT send the tx. Useful for verifying calldata
//                   against the dashboard's output before going live.
//
// Resolver lookup: the ENS Registry's resolver(node) function returns
// the resolver contract for a given name. For kon.xyz subnames imported
// via DNS-ENS, the public resolver typically handles every subname
// uniformly; we read it from the Registry rather than hardcoding so a
// name with a custom resolver still works.

import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const DEFAULT_RPC = 'https://eth.llamarpc.com'

const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const ENS_REGISTRY_ABI = parseAbi(['function resolver(bytes32 node) view returns (address)'])

export function readDeployKeyFromEnv() {
  const raw = process.env.KON_DEPLOY_KEY
  if (!raw) return null
  return raw.startsWith('0x') ? raw : '0x' + raw
}

function rpcUrl() {
  return process.env.ENS_RPC_URL ?? DEFAULT_RPC
}

export function prepareWalletClient() {
  const key = readDeployKeyFromEnv()
  if (!key) return null
  const account = privateKeyToAccount(key)
  return createWalletClient({
    account,
    chain: mainnet,
    transport: http(rpcUrl())
  })
}

function publicClient() {
  return createPublicClient({ chain: mainnet, transport: http(rpcUrl()) })
}

/**
 * Look up the resolver address for an ENS name. Throws if the name has
 * no resolver set, or if the Registry call itself fails.
 */
async function resolveResolver(name) {
  const { namehash } = await import('@konxyz/runtime-core')
  const node = namehash(name)
  const client = publicClient()
  const resolver = await client.readContract({
    address: ENS_REGISTRY_ADDRESS,
    abi: ENS_REGISTRY_ABI,
    functionName: 'resolver',
    args: [node]
  })
  if (!resolver || resolver === '0x0000000000000000000000000000000000000000') {
    throw new Error('no resolver set for ' + name + ' — register a resolver first')
  }
  return resolver
}

/**
 * Update the contenthash record for an ENS name to point at an IPFS CID.
 *
 * @param {{ ensName: string, contenthash: string }} update
 *   - ensName:     'matsuri.kon.xyz' etc. Must already have a resolver set.
 *   - contenthash: 'ipfs://bafy...' OR just 'bafy...' — either works.
 *
 * Returns { applied, reason?, txHash? }.
 */
export async function publishContenthash(update) {
  const client = prepareWalletClient()
  if (!client) {
    return { applied: false, reason: 'KON_DEPLOY_KEY not set; dry-run' }
  }
  // Lazy import keeps the publish script's startup fast — runtime-core
  // brings viem + multiformats and we only need it on the actual write
  // path.
  const { encodeSetContenthash } = await import('@konxyz/runtime-core')

  const cid = update.contenthash.replace(/^ipfs:\/\//, '')
  const calldata = encodeSetContenthash(update.ensName, cid)
  const resolver = await resolveResolver(update.ensName)

  if (process.env.KON_DRY_RUN) {
    console.log('[ens] dry-run')
    console.log('[ens]   name:     ' + update.ensName)
    console.log('[ens]   resolver: ' + resolver)
    console.log('[ens]   cid:      ' + cid)
    console.log('[ens]   calldata: ' + calldata)
    return { applied: false, reason: 'KON_DRY_RUN set; not sent' }
  }

  // viem returns the tx hash immediately; on-chain finality follows a
  // block or so later. publish:app prints the tx hash so the operator
  // can watch for finalization on a block explorer.
  const txHash = await client.sendTransaction({
    to: resolver,
    data: calldata
  })
  console.log('[ens] setContenthash submitted')
  console.log('[ens]   name:     ' + update.ensName)
  console.log('[ens]   resolver: ' + resolver)
  console.log('[ens]   cid:      ' + cid)
  console.log('[ens]   tx:       ' + txHash)
  return { applied: true, txHash }
}
