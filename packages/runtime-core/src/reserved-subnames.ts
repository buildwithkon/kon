/**
 * Reserved subnames for the kon.xyz namespace.
 *
 * These names cannot be claimed by organizers as their `<app>.kon.xyz`
 * subname. The list covers:
 *
 *   1. KON-managed origins in active use (id, my, kon)
 *   2. Future KON-team reservations (mail, docs, blog, status, support, etc.)
 *   3. IPFS / tech infrastructure (api, rpc, gateway, ipfs, ipns, relay)
 *   4. Common dashboard / admin variants — protected against rename confusion
 *      (app, apps, dashboard, dash, console, admin)
 *   5. Auth / account / settings (login, signin, signup, register, auth, ...)
 *   6. RFC 2142 standard mailbox names (root, postmaster, webmaster, abuse, ...)
 *
 * Self-host operators using their own domain define their own list — fork
 * this file in your deployment, or compose with extraReserved via
 * isReservedSubname(name, extraSet).
 *
 * Naming policy:
 *   - case-insensitive (normalized to lowercase)
 *   - exact match on the leftmost DNS label
 *   - DNS-format validation (alphanumeric + hyphens, 3-63 chars)
 */

export const RESERVED_SUBNAMES: ReadonlySet<string> = new Set([
  // KON-managed origins (active use)
  'id', // id.kon.xyz — wallet origin
  'my', // my.kon.xyz — organizer dashboard
  'kon', // protect against shadowing the brand

  // Future KON-team reservations
  'www',
  'mail',
  'email',
  'docs',
  'blog',
  'news',
  'status',
  'support',
  'help',
  'contact',
  'about',
  'team',
  'official',
  'store',
  'market',
  'shop',

  // IPFS / tech infrastructure
  'api',
  'rpc',
  'graphql',
  'gateway',
  'ipfs',
  'ipns',
  'relay',
  'cdn',
  'static',
  'assets',
  'media',

  // Dashboard / admin variants — keep reserved even when not used to
  // prevent rename confusion if KON changes the dashboard URL later.
  'app',
  'apps',
  'dashboard',
  'dash',
  'console',
  'admin',
  'edit',
  'manage',

  // Auth / account / settings
  'account',
  'login',
  'signin',
  'signup',
  'register',
  'auth',
  'oauth',
  'sso',
  'settings',
  'profile',
  'user',
  'users',
  'me',

  // RFC 2142 + common system names
  'root',
  'postmaster',
  'webmaster',
  'hostmaster',
  'abuse',
  'security',
  'noreply',
  'no-reply',
  'noc',
  'sysadmin',

  // Misc protected
  'test',
  'tests',
  'staging',
  'preview',
  'beta',
  'alpha',
  'dev',
  'internal'
])

export interface SubnameValidationResult {
  ok: boolean
  /** Reason when ok === false. */
  reason?: string
  /** Normalized form (lowercased, trimmed). Echoes input when valid. */
  normalized?: string
}

/**
 * Validate a candidate subname for the kon.xyz namespace (or any namespace
 * sharing this reserved list). Combines DNS format check + reserved
 * lookup. Self-host deployments can pass an extra reserved set.
 */
export function validateSubname(name: string, extraReserved?: ReadonlySet<string>): SubnameValidationResult {
  if (typeof name !== 'string') return { ok: false, reason: 'name must be a string' }
  const n = name.trim().toLowerCase()
  if (!n) return { ok: false, reason: 'name cannot be empty' }
  if (n.length < 3) return { ok: false, reason: 'name must be at least 3 characters' }
  if (n.length > 63) return { ok: false, reason: 'name cannot exceed 63 characters (DNS label limit)' }
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(n)) {
    return {
      ok: false,
      reason: 'name must be lowercase alphanumerics or hyphens, not starting or ending with a hyphen'
    }
  }
  if (RESERVED_SUBNAMES.has(n)) {
    return { ok: false, reason: 'this name is reserved for KON infrastructure', normalized: n }
  }
  if (extraReserved?.has(n)) {
    return { ok: false, reason: 'this name is reserved by the deployment', normalized: n }
  }
  return { ok: true, normalized: n }
}

/** Boolean shorthand. */
export function isReservedSubname(name: string, extraReserved?: ReadonlySet<string>): boolean {
  const result = validateSubname(name, extraReserved)
  return !result.ok && result.reason !== undefined && result.reason.includes('reserved')
}
