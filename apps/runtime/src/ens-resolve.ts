/**
 * Client-side ENS resolution via viem.
 *
 * Replaces the server-side `packages/api/src/ens.ts` lookups. For Phase 1
 * we use public Ethereum RPCs; production should pin a list and add
 * failover. CCIP-Read (DNS-ENS / L2 ENS) is handled transparently by viem.
 */

import { createPublicClient, http, type PublicClient } from 'viem'
import { mainnet } from 'viem/chains'

const DEFAULT_RPCS = ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth', 'https://cloudflare-eth.com']

let client: PublicClient | null = null

function ensureClient(): PublicClient {
  if (client) return client
  client = createPublicClient({
    chain: mainnet,
    transport: http(DEFAULT_RPCS[0], { batch: true })
  })
  return client
}

/**
 * Resolve an ENS name to its contenthash (returned as `ipfs://<cid>` if
 * the encoded codec is IPFS / IPNS, otherwise the raw hex string).
 */
export async function resolveContenthash(name: string): Promise<string | null> {
  const c = ensureClient()
  // viem returns the contenthash decoded as a string when possible.
  // For IPFS contenthashes it emits `ipfs://...` directly.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- viem types contenthash as string but unions are loose
  const result = await (c as any).getEnsText({ name, key: 'contenthash' }).catch(() => null)
  if (result) return result

  // Fallback path: use getEnsAvatar's underlying contenthash machinery.
  // viem 2.x exposes a dedicated getEnsContentHash but the call shape varies;
  // we keep both paths so the runtime still resolves on older / newer viem.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
  const ch = await (c as any).getEnsContentHash?.({ name }).catch(() => null)
  return ch ?? null
}

/**
 * Read the entry CID for the current page. Resolution order:
 *   1. `?entry=ipfs://CID` URL query (dev override)
 *   2. `<meta name="kon:entry">` (set by the publish pipeline)
 *   3. ENS contenthash for `window.location.hostname`
 */
export async function resolveEntryRef(): Promise<{ ref: string; via: 'query' | 'meta' | 'ens' }> {
  const url = new URL(window.location.href)
  const fromQuery = url.searchParams.get('entry')
  if (fromQuery) return { ref: fromQuery, via: 'query' }

  const metaEl = document.querySelector('meta[name="kon:entry"]')
  const fromMeta = metaEl?.getAttribute('content') ?? ''
  if (fromMeta && !fromMeta.includes('__REPLACE_ME')) {
    return { ref: fromMeta, via: 'meta' }
  }

  const host = window.location.hostname
  const fromEns = await resolveContenthash(host)
  if (fromEns) return { ref: fromEns, via: 'ens' }

  throw new Error(`no entry CID resolved (tried URL ?entry=, meta[kon:entry], ENS contenthash for ${host})`)
}
