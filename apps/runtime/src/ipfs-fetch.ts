/**
 * IPFS content fetch with gateway failover.
 *
 * For Phase 1 we use HTTP gateways (configurable per deployment). Phase 4
 * (#12 service worker) adds Cache API + IndexedDB layering. Helia in-browser
 * node is a follow-up if HTTP gateways prove unreliable in dress rehearsal.
 *
 * CID semantics: we accept either `ipfs://<cid>` URIs or bare `<cid>` strings.
 * The fetched bytes are CID-addressed and assumed immutable — callers cache
 * by CID without any TTL.
 */

const IPFS_URI_PREFIX = 'ipfs://'

export interface FetchOptions {
  gateways: string[]
  /** Per-gateway timeout in ms. */
  timeoutMs?: number
  /** Total budget across all gateway attempts. */
  totalBudgetMs?: number
}

export function parseIpfsUri(uri: string): string {
  if (uri.startsWith(IPFS_URI_PREFIX)) return uri.slice(IPFS_URI_PREFIX.length)
  return uri
}

function buildGatewayUrl(gatewayBase: string, cid: string): string {
  // Prefer subdomain form (`<cid>.ipfs.<gateway>`) when the gateway supports
  // it — gives origin isolation per CID. For now use path form, which works
  // on every gateway.
  const trimmed = gatewayBase.replace(/\/+$/, '')
  return `${trimmed}/ipfs/${cid}`
}

export async function fetchIpfsBytes(uri: string, opts: FetchOptions): Promise<Uint8Array> {
  const cid = parseIpfsUri(uri)
  const start = performance.now()
  const totalBudget = opts.totalBudgetMs ?? 10_000
  const perGatewayTimeout = opts.timeoutMs ?? 4_000

  const errors: string[] = []
  for (const gw of opts.gateways) {
    if (performance.now() - start > totalBudget) {
      errors.push('budget-exhausted')
      break
    }
    const url = buildGatewayUrl(gw, cid)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), perGatewayTimeout)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) {
        errors.push(`${gw} ${res.status}`)
        continue
      }
      const buf = await res.arrayBuffer()
      return new Uint8Array(buf)
    } catch (e) {
      errors.push(`${gw} ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  throw new Error(`fetchIpfsBytes: all gateways failed for ${cid}: ${errors.join('; ')}`)
}

export async function fetchIpfsJson<T = unknown>(uri: string, opts: FetchOptions): Promise<T> {
  const bytes = await fetchIpfsBytes(uri, opts)
  const text = new TextDecoder().decode(bytes)
  return JSON.parse(text) as T
}
