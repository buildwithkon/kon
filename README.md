# KON

**Apps your community owns, free forever.** ENS + IPFS + GUN.js + a wallet origin you can self-host. No platform can shut your app down.

KON is mid-migration from v1 (Cloudflare Workers + XMTP + React Router) to **v2** (Vite + Preact + IPFS + DNS-ENS). The `v2` branch contains the new stack. The `main` branch still hosts the v1 PWA serving production.

See `~/.claude/plans/clever-spinning-sky.md` (or your local equivalent) for the active migration plan.

## v2 architecture (one paragraph)

Every KON app is a static SPA. `ethtokyo.kon.xyz` resolves through ENS (via DNSSEC + ENSIP-10 wildcard) to an IPFS `contenthash`. That CID points at a tiny `entry.json` describing two more CIDs: the shared `runtime` bundle (Preact + plugin host) and the app-specific `manifest.json` (pages + plugin list + per-app config). The runtime fetches both from any IPFS gateway, validates them against Zod schemas, then renders pages composed of plugins. Chat, draft workspace, and realtime sync go through GUN.js with SEA-signed messages. The wallet (passkey + Safe v1.4.1 smart account) lives at a single central origin — `id.kon.xyz` for the default deployment, `id.<your-domain>` for self-host — and apps interact with it via a thin postMessage SDK. Cloudflare Workers is an optional accelerator, never required.

## Layout

```
apps/
  runtime/    Vite + Preact Public Runtime. Boots from ENS → IPFS → manifest → plugins.
  renderer/   Hono JSX CLI. Turns an app's manifest source into canonical release files.
  wallet/     Vite + Preact wallet origin (deploys to id.kon.xyz). Passkey + Safe + Pimlico.
  ethtokyo/   Example app — manifest.source.json input for the publish pipeline.
  pwa/        v1 PWA (still in production). Deleted in Phase 6.
packages/
  runtime-core/  Types + defaults.ts (only place id.kon.xyz literal lives) + signature helpers.
  schemas/       Zod schemas for entry / manifest / plugin objects.
  wallet-sdk/    postMessage SDK consumed by apps to talk to the wallet origin.
  plugins/
    badge/ build-with/ forum/ ical/ iframe/ markdown/ profile-card/
  contracts/     AppCoin / AppCoinFactory (Base L2). Unchanged in v2.
  shared/        v1 shared library. Pieces still used by v1 PWA.
  api/  site/  shared-react/  subdomain-router/  xmtp-agent/
                 v1 packages. Deleted in Phase 6.
experiments/
  gun-spike/  Phase 0 GUN.js + SEA proof. Kept for reference + local relay (`pnpm relay`).
scripts/
  publish.mjs                  Publish pipeline orchestrator.
  lib/w3up.mjs, lib/ens.mjs    web3.storage + ENS contenthash helpers.
  lint-no-hardcoded-origins.mjs  CI guard: only defaults.ts may embed `id.kon.xyz`.
```

## Quick start (v2 dev)

```bash
pnpm install
pnpm --filter @konxyz/runtime dev    # http://127.0.0.1:5174 — runs with dev preset manifest
```

The runtime boots with an inline dev-preset manifest exercising every built-in plugin. Open Chat to test GUN; the dev preset's `gun_peers` includes `http://localhost:8765/gun`, so optionally:

```bash
cd experiments/gun-spike && pnpm install --ignore-workspace
pnpm relay                           # local GUN relay on :8765
```

To exercise the wallet popup against the dev runtime, run `apps/wallet/` in parallel:

```bash
pnpm --filter @konxyz/wallet dev     # http://127.0.0.1:5175
```

## Publishing

Two paths:

### 1. CLI — ops / release automation (current)

```bash
pnpm publish:app --app ethtokyo [--upload | --publish]
pnpm publish:site                          # builds + ships apps/site to kon.xyz apex
pnpm publish:runtime                       # builds + ships apps/runtime; prints CID for entry.runtime
pnpm publish:plugin --plugin badge         # or --all for every plugin
```

Uploads use `W3_PRINCIPAL` + `W3_PROOF` env (web3.storage delegation held by the operator). ENS contenthash writes use `KON_DEPLOY_KEY`. Dry-run mode (no flags) works without any credentials.

### 2. Dashboard — user-facing (Phase 8)

The eventual primary path. Organizers publish from the Admin Dashboard with **their own credentials**: their own w3up delegation for IPFS upload, their own Safe smart wallet for the ENS `setContenthash` tx. No KON-held private key is ever in the user-facing loop — that's the positioning ("apps your community owns") taken literally.

Code-share with the CLI: the canonical-JSON, Zod schemas, and `w3up-client` API are identical in browser and Node. Only the auth surface differs (delegation paste UI vs env var; wallet popup vs `KON_DEPLOY_KEY`).

Depends on #8 d/e (real wallet `signTx`) and #11 (Admin Dashboard). See `~/.claude/plans/clever-spinning-sky.md` §Phase 8 for the storage-onboarding model (hybrid: free-tier proxy + BYOK upgrade).

`--upload` requires `W3_PRINCIPAL` + `W3_PROOF` in env (from `w3 key create` + `w3 delegation create`). `--publish` additionally requires `KON_DEPLOY_KEY` and is gated until the ENS DNS-import for `kon.xyz` is finalized — see "Open items" below.

The pipeline also runs in CI via `.github/workflows/publish.yml` (manual dispatch or `publish/<app>` tag push).

## Self-hosting (Phase 7, sketch)

`kon.xyz` is the default fast path, never a hard dependency. To run KON on your own domain:

1. Acquire `yourdomain.com` and enable DNSSEC.
2. Import the domain into ENS at app.ens.domains/dns/yourdomain.com.
3. Build + publish `apps/wallet` to your own IPFS pin → set `_dnslink` + ENS `contenthash` on `id.yourdomain.com`.
4. Override `manifest.deployment.wallet_origin` to `https://id.yourdomain.com` in your app's manifest source.
5. Optionally run your own GUN relay (the `experiments/gun-spike/scripts/relay.mjs` is the same code; production hosting docs land in Phase 7).

The CI lint at `scripts/lint-no-hardcoded-origins.mjs` rejects any literal `id.kon.xyz` outside `packages/runtime-core/src/defaults.ts` so self-host overrides cannot be bypassed.

## Toolchain

- pnpm workspaces (Node 22+)
- Vite 5 + Preact 10 + @preact/signals
- viem 2.51 + permissionless 0.3 (ERC-4337 + Safe v1.4.1 + Pimlico paymaster)
- GUN.js + SEA for chat / realtime sync / identity-derived keys
- web3.storage (w3up) for IPFS pinning
- ENS (DNS-ENS via DNSSEC + ENSIP-10) for app resolution
- **oxlint + oxfmt** for lint + format (replaces Biome as of `cef95d4`)
- TypeScript across all packages
- Service worker (workbox via vite-plugin-pwa) for offline-first caching

## Lint, format, typecheck

```bash
pnpm run lint           # oxlint
pnpm run lint:fix       # oxlint --fix
pnpm run lint:origins   # custom rule: no literal id.kon.xyz outside defaults.ts
pnpm run format         # oxfmt --write .
pnpm run format:check   # oxfmt --check .
pnpm run typecheck:v2   # tsc --noEmit for runtime-core + schemas
```

Plus per-package `pnpm --filter <pkg> typecheck`.

## CI

`.github/workflows/lint.yml` runs the three lint gates on push and PR. `.github/workflows/publish.yml` is manual (workflow_dispatch) or tag-triggered for release.

## Open items (Week 1 of the v2 migration)

These are gated on the user — once each lands, several downstream tasks unlock.

- [ ] **Pimlico API key + sponsorship policy** — unblocks `apps/wallet` steps 8d/8e (bundler + paymaster).
- [ ] **web3.storage account** — unblocks `scripts/publish.mjs --upload`.
- [ ] **DNS provider for `kon.xyz` with DNSSEC** — required before the DNS-ENS import works.
- [ ] **ENS DNS-import setup on app.ens.domains** — once done, the publish pipeline can write contenthash directly.
- [ ] **GUN peer relay** — KON-run relay (Docker image planned in Phase 7) plus configurable public fallbacks via manifest.

## Status (snapshot)

10/16 plan tasks complete on the `v2` branch:

| Done                                                                                                                                                    | In progress                                                                                                         | Pending                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| GUN spike, runtime, renderer, runtime-core + schemas, CI lint, 7 plugins, Forum (GUN+SEA), service worker, publish pipeline skeleton, oxlint+oxfmt swap | wallet (scaffold + passkey + Safe predicted + cross-chain done; bundler / paymaster / recovery pending Pimlico key) | Week 1 open items, admin dashboard, ETHTokyo dress rehearsal, v1 cleanup, self-host docs |
