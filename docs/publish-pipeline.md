# KON v2 Publish Pipeline

End-to-end overview of how a KON app goes from a manifest source file on an organizer's laptop to a live `<app>.kon.xyz` URL serving real traffic. This doc is the reference for "what happens when I run `bun run publish:app --publish`" and its dashboard-driven equivalent.

**Two equivalent paths.** Same on-chain output, different signer:

```
CLI path (KON team ops + CI)              Dashboard path (organizers)
─────────────────────────────              ──────────────────────────
manifest.source.json                       browser editor (apps/runtime /admin)
       ↓                                          ↓ user clicks Publish
apps/renderer (Hono JSX CLI)               canonicalize() in-browser
       ↓ outputs                                  ↓
manifest.json + entry.json + index.html    POST /api/pin (relay-ipfs)
       ↓                                          ↓ returns CID
relay-ipfs /api/pin (or w3up)              encodeSetContenthash(...)
       ↓ returns CID                              ↓
encodeSetContenthash(name, cid)            wallet.signTx popup
       ↓ via runtime-core/ens.ts                  ↓
scripts/lib/ens.mjs sendTransaction        permissionless + Pimlico + Coinbase
       ↓ KON_DEPLOY_KEY signer                    ↓
ENS Resolver.setContenthash                ENS Resolver.setContenthash
       ↓                                          ↓
✓ on-chain                                 ✓ on-chain (same Resolver, same calldata)
```

The encoding helpers in `@konxyz/runtime-core/ens.ts` (`encodeSetContenthash`, `namehash`, `ipfsContenthash`) produce **byte-for-byte identical calldata** for the same (name, cid) regardless of which path called them. Tests in `packages/runtime-core/src/ens.test.ts` pin the function selectors + per-arg sensitivity so a regression there is caught for both paths.

## Layers + which CID lands where

A published KON app is **four CIDs** in a hierarchy:

```
ENS contenthash                                  ← what setContenthash writes
   ↓ points at
entry.json (per-app, ~200 bytes)                 ← tiny boot manifest
   ↓ references
   ├── runtime CID (shared across apps)          ← apps/runtime bundle
   └── manifest CID (per-release)                ← KonManifestV1 content
                                                 ↓ references
                                                 plugin CIDs[]            ← packages/plugins/* bundles
                                                 page sources[]?          ← optional markdown CIDs
                                                 assets[]?                ← optional images, icons
```

Each layer is pinned independently. Bumping `app.version` and re-publishing only changes the manifest CID + entry CID + the on-chain contenthash; the runtime CID stays pinned to whatever shared release the app is locked to.

## CLI path — `bun run publish:app`

### Modes

```bash
bun run publish:app --app ethtokyo                  # dry-run: build only
bun run publish:app --app ethtokyo --upload         # build + IPFS upload
bun run publish:app --app ethtokyo --publish        # above + on-chain setContenthash
```

### Steps

1. **Render** (`apps/renderer`) — reads `apps/<name>/manifest.source.json`, normalizes against `KonManifestV1Schema`, emits canonical `manifest.json` + `entry.template.json` + `index.html` to `dist/publish/<name>/`. No network.

2. **Resolve runtime CID** — `scripts/publish.mjs` reads from `--runtime <cid>` arg, then `KON_RUNTIME_CID` env, then `.kon/runtime-cid.txt`. The template's `__REPLACE_ME_RUNTIME_CID__` placeholder gets substituted.

3. **Upload manifest** (`--upload`) — `scripts/lib/pin-service.mjs` factories pick between `helia` (local blockstore) and `w3up` (web3.storage) per `KON_PIN_SERVICE` env. Returns the manifest CID.

4. **Substitute manifest CID** into `entry.template.json`, re-upload entry as `entry.json` → entry CID.

5. **Substitute entry CID** into `index.html`'s `<meta name="kon:entry">` tag, re-upload html.

6. **On-chain write** (`--publish`) — `scripts/lib/ens.mjs publishContenthash({ ensName, contenthash })`:
   - Look up the resolver for `<app>.kon.xyz` via ENS Registry's `resolver(node)`.
   - Encode `setContenthash(namehash(<app>.kon.xyz), ipfsContenthash(entry CID))` using `@konxyz/runtime-core/ens.ts`.
   - Send via viem walletClient signed by `KON_DEPLOY_KEY`.
   - Returns the tx hash; on-chain finality follows ~12 sec later on Ethereum mainnet.

   When `KON_DRY_RUN=1`, prints the calldata bytes but does not send — useful for verifying that the CLI and the dashboard agree on the calldata before going live.

### Env required per mode

| Mode      | Env                                                                                        |
| --------- | ------------------------------------------------------------------------------------------ |
| dry-run   | none                                                                                       |
| --upload  | `W3_PRINCIPAL` + `W3_PROOF` (w3up) OR `KON_PIN_SERVICE=helia` + a local `.kon/blockstore/` |
| --publish | the above + `KON_DEPLOY_KEY` (hex) + optional `ENS_RPC_URL`                                |

### Where CIDs end up

`dist/publish/<app>/` after `--upload`:

```
manifest.json      canonical manifest, signed; this is the manifestCid input to entry.json
entry.json         {"runtime": "ipfs://bafy...", "manifest": "ipfs://bafy...", ...}
index.html        boot stub referencing entryCid via <meta>
manifest.cid       (text file) the manifest CID for diff-checking
entry.cid          (text file) the entry CID for diff-checking
```

The CLI prints both CIDs at the end. `publish:app --publish` then writes the entry CID as the ENS contenthash.

## Dashboard path — organizer-credentialed publish

### Trigger

Operator opens `<app>.kon.xyz/admin` (apps/runtime's admin route). The editor's `PublishButton` (`apps/runtime/src/admin/publish-button.tsx`) drives the flow:

1. **Canonicalize** the draft manifest in-browser (`runtime-core/signature.ts canonicalize`).
2. **POST canonical JSON to `gateway.<DOMAIN>/api/pin`** (`apps/relay-ipfs` accepts via `/api/pin` endpoint with the per-IP rate-limit guard documented in `docs/self-host-relay.md`). Returns `{ cid, bytes }`.
3. **Encode** `setContenthash(app.id, manifestCid)` via the same `runtime-core/ens.ts` helpers as the CLI.
4. **Open the wallet popup** at `id.<DOMAIN>` via `@konxyz/account-sdk WalletSdk.signTx({ chainId: 8453, to: PUBLIC_RESOLVER, data: calldata })`.
5. **Wallet popup** (`apps/account`) constructs the Safe smart-account client via permissionless.js, asks the configured paymaster (Coinbase preferred on Base, Pimlico fallback) to fill `paymasterAndData`, submits via Pimlico's bundler.
6. **Bundler returns** `userOpHash` — the dashboard displays it; on-chain finality follows ~12 sec later (Base mainnet block time).

### What the organizer needs

| Component                | Provided by                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Passkey                  | Created on first sign-in at `id.<DOMAIN>` (synced via iCloud / Google Password Manager)              |
| Safe smart account       | Counterfactual, deployed on first tx via the EntryPoint's `initCode`                                 |
| ENS subname              | Either claimed via dashboard's `setSubnodeOwner` flow, or pre-allocated by the operator              |
| Bundler / paymaster keys | Bundled into the wallet origin's deployment at build time (restricted by origin + chain + allowlist) |

The organizer never sees any of these as configuration — the dashboard handles everything client-side.

## Plugins and runtime — separate cadence

### Publishing a plugin

```bash
bun run publish:plugin --plugin badge          # dry-run
bun run publish:plugin --plugin badge --upload # uploads packages/plugins/badge/dist/plugin.js
bun run publish:plugin --all --upload          # every plugin
```

Plugins are content-addressed once per version. The CID gets manually copy-pasted into the consuming app's `manifest.source.json`'s `plugins[]` entry. Each plugin's `source` field references a specific CID; updating a plugin without updating the consuming manifest leaves the consumer pinned to the old version intentionally.

### Publishing the runtime

```bash
bun run publish:runtime          # dry-run
bun run publish:runtime --upload # uploads apps/runtime/dist/
```

The runtime CID is the single shared bundle every KON app boots. Bumping the runtime is a coordinated activity:

1. Build + upload → new runtime CID.
2. Write the new CID to `.kon/runtime-cid.txt` (or commit to env).
3. Re-publish each app you control via `publish:app --publish`, which substitutes the new runtime CID into each app's `entry.runtime` field.
4. Apps you do NOT re-publish stay pinned to the previous runtime CID — by design, so a runtime regression cannot silently break apps that haven't been re-tested.

The dashboard publish path does NOT change the runtime CID — only the manifest. Organizers always inherit whatever runtime CID was current when their app was last published via the CLI.

## Publishing the static origins (id / my / apex)

For the wallet origin (`id.<DOMAIN>`), the organizer dashboard (`my.<DOMAIN>`), and the marketing site (`<DOMAIN>` apex), the deploy uses Caddy vhosts that proxy pinned CIDs from the relay-ipfs blockstore. The pipeline:

```bash
bun run publish:account --upload      # build apps/account → pin → prints KON_ACCOUNT_CID=bafy...
bun run publish:dashboard --upload    # build apps/dashboard → pin → prints KON_DASHBOARD_CID=...
bun run publish:site --upload         # build apps/site → pin → prints CID
```

Each script tells the operator the exact two-line follow-up to land the new bundle:

```bash
# 1. On the relay VPS, edit kon/.env:
KON_ACCOUNT_CID=bafy...
# 2. Reload the Caddy vhost:
docker compose up -d caddy
```

These bundles do NOT update ENS contenthash — hostname-routed via Caddy, not contenthash-resolved. The `.limo` fallback (`id-kon-xyz.limo`) still works because we additionally set the ENS contenthash by hand (or via `--publish` on `publish:site` for the apex).

## Self-host equivalence

Every step in both paths reads the deployment configuration from `@konxyz/runtime-core/defaults.ts` via `resolveDeployment()`. Self-host operators override `manifest.deployment.{wallet_origin, ipfs_gateways, ipfs_pin_endpoint, ens_domain, gun_peers}` and the same pipeline routes their app's bytes through their own infrastructure — no code change anywhere in the pipeline.

The CI lint at `scripts/lint-no-hardcoded-origins.mjs` enforces that no literal `id.kon.xyz` (or other KON-managed origin) exists outside `defaults.ts`, so a self-host operator's override cannot be silently bypassed by a stray hardcoded string.

## What's NOT in the pipeline yet

- **w3up "upgrade" path for the dashboard** — if a KON-managed organizer outgrows the relay's `/api/pin` quota, the documented Phase 8 path is to paste their own web3.storage delegation in onboarding. That UI hasn't shipped; the relay's free tier currently covers ETHTokyo-scale needs.
- **Multi-region relay GeoDNS** — `KON_GUN_PEERS` env in `docs/self-host-relay.md` is wired but no actual multi-region deploy exists yet.
- **Wildcard `*.kon.xyz` Caddy resolver** — the apex + `id.<DOMAIN>` + `my.<DOMAIN>` work via fixed-CID Caddy vhosts. Per-app `<app>.kon.xyz` resolution currently relies on each subname having its own DNS + Caddy vhost (Stage 1 scale, few apps) or `.limo` gateway. Dynamic ENS-aware vhost is Stage 2.
- **Passkey-signed `/api/pin` auth** — the relay's `/api/pin` endpoint relies on per-IP rate limits in Stage 1. Phase 9 hardening adds a signed-header check.

## Reference

- `scripts/publish.mjs` — CLI orchestrator
- `scripts/publish-{site,runtime,plugin,account,dashboard}.mjs` — per-target shipping
- `scripts/lib/pin-service.mjs` — w3up vs helia factory
- `scripts/lib/ens.mjs` — ENS contenthash write (real, since b838cd1)
- `apps/relay-ipfs/src/index.mjs` — `/api/pin` endpoint
- `apps/runtime/src/admin/publish-button.tsx` — dashboard publish UI
- `apps/account/src/submit-user-op.ts` — wallet popup's signTx implementation
- `packages/runtime-core/src/ens.ts` — shared encoding (CLI + dashboard)
- `packages/runtime-core/src/signature.ts` — `canonicalize()` (CLI + dashboard)
- `packages/runtime-core/src/defaults.ts` — single source of KON-managed origins
