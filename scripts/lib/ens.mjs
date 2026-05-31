// ENS contenthash update via viem.
//
// Env vars required for actual updates:
//   KON_DEPLOY_KEY  hex private key authorized to update the ENS subname.
//   ENS_RPC_URL     optional. Defaults to https://eth.llamarpc.com.
//
// NOTE: the on-chain write is wired once the ENS DNS-import setup for
// kon.xyz is finalized (one of the remaining Week 1 open items). Until
// then this returns a "not yet wired" reason and the operator applies
// the update manually via the ENS app at app.ens.domains.

import { createWalletClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const DEFAULT_RPC = 'https://eth.llamarpc.com'

export function readDeployKeyFromEnv() {
  const raw = process.env.KON_DEPLOY_KEY
  if (!raw) return null
  return raw.startsWith('0x') ? raw : '0x' + raw
}

export function prepareWalletClient() {
  const key = readDeployKeyFromEnv()
  if (!key) return null
  const account = privateKeyToAccount(key)
  return createWalletClient({
    account,
    chain: mainnet,
    transport: http(process.env.ENS_RPC_URL ?? DEFAULT_RPC)
  })
}

export async function publishContenthash(update) {
  const client = prepareWalletClient()
  if (!client) {
    return { applied: false, reason: 'KON_DEPLOY_KEY not set; dry-run' }
  }
  console.log('[ens] (NOT YET WIRED) would set contenthash:', update)
  return { applied: false, reason: 'on-chain write deferred until ENS DNS-import setup is finalized' }
}
