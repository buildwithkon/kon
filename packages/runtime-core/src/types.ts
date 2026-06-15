/**
 * KON v2 core types.
 *
 * Resolution flow:
 *   ENS contenthash → KonEntryV1 (per-app, minimal)
 *                       ↓
 *                     runtime CID (shared across apps, version-pinned)
 *                     manifest CID (per-release content)
 *                       ↓
 *                     pages / plugins / assets → render
 *
 * See plan: ~/.claude/plans/clever-spinning-sky.md
 */

export type IpfsUri = `ipfs://${string}`

/**
 * Relative path within a published directory (e.g. './manifest.json').
 * Used when the publish flow uploads multiple files as a single UnixFS
 * directory so siblings refer to each other without needing a separate
 * CID per file.
 */
export type RelativePath = `./${string}` | `/${string}`

/** Either an absolute IPFS CID URI or a path relative to the containing directory. */
export type ContentRef = IpfsUri | RelativePath

/**
 * Identifier for any DID. We use did:pkh:eip155:<chain>:<address> for Safe accounts
 * and did:key:<multibase> for ephemeral SEA / passkey-derived identities.
 */
export type Did = `did:${string}`

/**
 * Deployment override block. Every field is optional; missing fields fall back to
 * KON-managed defaults (see ./defaults.ts).
 *
 * Self-hosted deployments populate this block to point apps at their own
 * wallet origin, GUN relays, IPFS gateways, and ENS root domain. The runtime
 * passes this through to every subsystem; no code outside ./defaults.ts may
 * reference the literal KON-managed origins.
 */
export interface KonDeploymentV1 {
  /** Wallet origin URL hosting the passkey + Safe smart account (rpId of WebAuthn). */
  wallet_origin?: string
  /** GUN peer URLs used for chat, draft workspace, and cache hints. */
  gun_peers?: string[]
  /** IPFS gateway URLs (priority order; the runtime tries them in sequence). */
  ipfs_gateways?: string[]
  /**
   * IPFS pin endpoint that accepts `POST /api/pin` from authenticated browsers
   * (the dashboard's publish flow). Default = KON-managed `gateway.kon.xyz/api/pin`;
   * self-host operators point this at their own relay-ipfs deployment.
   */
  ipfs_pin_endpoint?: string
  /** Apex ENS / DNS-ENS domain (e.g. 'kon.xyz' for KON-managed, or 'myfestival.com' for self-host). */
  ens_domain?: string
}

/**
 * The minimal per-app entry pointed to by ENS contenthash.
 *
 * This file is tiny on purpose — the bulk of the app lives in the shared
 * runtime + manifest. Bumping the entry is what triggers a release; the
 * runtime/manifest may change independently.
 */
export interface KonEntryV1 {
  schema: 'kon-entry-v1'
  /** Human-readable name of the app (typically the ENS name). */
  name: string
  /** CID of the shared KON runtime to load. */
  runtime: IpfsUri
  /**
   * Reference to the app-specific manifest. Either an `ipfs://CID` (separate
   * upload) or a relative path like `./manifest.json` (when the directory
   * upload pattern is used — manifest, entry, and index.html ship in one
   * UnixFS dir). The bootstrap loader handles both forms.
   */
  manifest: ContentRef
  /** Monotonic release counter, bumped per publish. */
  version: number
  /** ISO 8601 timestamp of publish. */
  publishedAt: string
}

/**
 * A plugin reference. Each plugin is an independently-versioned IPFS object
 * loaded lazily by the runtime. The contract is intentionally minimal —
 * id + version for identity, source CID for code, props for instance config.
 */
export interface KonPluginV1 {
  id: string
  /** Semver of the plugin (matches the version inside the plugin bundle). */
  version: string
  source: IpfsUri
  props?: Record<string, unknown>
}

export type KonIconName = 'home' | 'calendar' | 'chat' | 'info' | 'list'

export interface KonThemeV1 {
  /** CSS color — header / sidebar background. */
  main: string
  /** CSS color — active nav item / highlights. */
  accent: string
  /** Font family preset. Defaults to 'sans'. */
  font?: 'sans' | 'serif' | 'mono'
}

export interface KonPageV1 {
  id: string
  title: string
  /** Bottom-tab / sidebar icon. */
  icon?: KonIconName
  /** Optional content source (markdown / JSON) loaded by the runtime. */
  source?: IpfsUri
  /** Plugins specific to this page. Global plugins live on the manifest. */
  plugins?: KonPluginV1[]
}

export interface KonManifestV1 {
  schema: 'kon-manifest-v1'
  app: {
    id: string
    name: string
    version: number
    description?: string
    icon?: IpfsUri
    theme?: KonThemeV1
  }
  /** Optional deployment overrides. Absent = use KON-managed defaults. */
  deployment?: KonDeploymentV1
  pages: KonPageV1[]
  /** Plugins applied across all pages (e.g. global header, chat). */
  plugins?: KonPluginV1[]
  /** Previous manifest CID for traceability (history without re-pinning). */
  previous?: IpfsUri
  publishedAt: string
  publisher: Did
  /** SEA / wallet signature over the canonical JSON (excluding this field). */
  signature?: string
}
