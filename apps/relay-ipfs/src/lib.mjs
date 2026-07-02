/**
 * Pure helpers extracted from index.mjs for testability.
 *
 * index.mjs imports these instead of inlining; tests in lib.test.mjs
 * exercise them without spinning up the full libp2p + Helia stack.
 *
 * Nothing here touches the network, the filesystem, or the helia
 * runtime — only logic.
 */

const EXT_TO_MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.htm', 'text/html; charset=utf-8'],
  ['.json', 'application/json'],
  ['.js', 'application/javascript'],
  ['.mjs', 'application/javascript'],
  ['.css', 'text/css'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
])

/**
 * Guess a Content-Type header value from a file path's extension.
 * Falls back to application/octet-stream for unknown extensions.
 */
export function guessContentType(path) {
  if (typeof path !== 'string') return 'application/octet-stream'
  const lower = path.toLowerCase()
  for (const [ext, mime] of EXT_TO_MIME) {
    if (lower.endsWith(ext)) return mime
  }
  return 'application/octet-stream'
}

/**
 * Per-IP token-bucket rate limiter with a separate daily byte quota.
 *
 * @param {object} opts
 * @param {number} opts.requestsPerMin   tokens refill at this rate
 * @param {number} opts.bytesPerDay      hard cap on bytes per IP per 24h window
 * @param {() => number} [opts.now]      injection for tests; defaults to Date.now
 */
export function createRateLimiter({ requestsPerMin, bytesPerDay, now = Date.now }) {
  const limiter = new Map()

  function check(ip, bytes) {
    const t = now()
    const entry = limiter.get(ip) ?? {
      tokens: requestsPerMin,
      lastRefill: t,
      bytesToday: 0,
      dayStart: t
    }
    // Refill tokens at requestsPerMin / 60s
    const elapsed = (t - entry.lastRefill) / 1000
    entry.tokens = Math.min(requestsPerMin, entry.tokens + (elapsed * requestsPerMin) / 60)
    entry.lastRefill = t
    // Roll daily byte counter
    if (t - entry.dayStart > 86_400_000) {
      entry.bytesToday = 0
      entry.dayStart = t
    }
    if (entry.tokens < 1) {
      limiter.set(ip, entry) // persist the refill calculation
      return { ok: false, reason: 'rate limit (req/min)' }
    }
    if (entry.bytesToday + bytes > bytesPerDay) {
      limiter.set(ip, entry)
      return { ok: false, reason: 'daily byte quota exceeded' }
    }
    entry.tokens -= 1
    entry.bytesToday += bytes
    limiter.set(ip, entry)
    return { ok: true }
  }

  /** Test-only: inspect a client's accounting state without consuming. */
  function snapshot(ip) {
    return limiter.get(ip) ?? null
  }

  return { check, snapshot }
}

/**
 * Extract the client IP from a Node http.IncomingMessage. Honors a
 * single X-Forwarded-For hop (Caddy → relay-ipfs is on the docker
 * internal network, so X-F-F is Caddy-supplied + trusted).
 */
export function ipOf(req) {
  const fwd = req.headers?.['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

/**
 * Parse a `/ipfs/<CID>[/<path>]` URL into { cid, subPath } shape.
 * subPath includes the leading slash when present, '' when not.
 */
export function parseIpfsUrl(url) {
  const rest = url.slice('/ipfs/'.length).split('?')[0]
  const slash = rest.indexOf('/')
  const cid = slash === -1 ? rest : rest.slice(0, slash)
  const subPath = slash === -1 ? '' : rest.slice(slash)
  return { cid, subPath }
}
