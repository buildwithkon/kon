# KON

**Apps your community owns, free forever.** ENS + IPFS + GUN.js + a wallet origin you can self-host. No platform can shut your app down.

The `v2` branch is the active line of development. Stage 1 ships at ETHTokyo (2026-09). See `~/.claude/plans/clever-spinning-sky.md` (or your local equivalent) for the migration plan.

## Architecture (one paragraph)

Every KON app is a static SPA. `ethtokyo.kon.xyz` resolves through ENS (via DNSSEC + ENSIP-10 wildcard) to an IPFS `contenthash`. That CID points at a tiny `entry.json` describing two more CIDs: the shared `runtime` bundle (Preact + plugin host) and the app-specific `manifest.json` (pages + plugin list + per-app config). The runtime fetches both from any IPFS gateway, validates them against Zod schemas, then renders pages composed of plugins. Chat, draft workspace, and realtime sync go through GUN.js with SEA-signed messages. The wallet (passkey + Safe v1.4.1 smart account) lives at a single central origin — `id.kon.xyz` for the default deployment, `id.<your-domain>` for self-host — and apps interact with it via a thin postMessage SDK. The central organizer dashboard at `my.kon.xyz` is where new `<app>.kon.xyz` subnames get claimed. Cloudflare Workers is not in the runtime path.

## Layout

```
apps/
  runtime/    Vite + Preact Public Runtime. Boots from ENS → IPFS → manifest → plugins. Hosts /admin per-app editor.
  wallet/     Vite + Preact wallet origin (id.kon.xyz). Passkey + Safe v1.4.1 + Pimlico.
  dashboard/  Vite + Preact organizer portal (my.kon.xyz). Sign in, claim subnames, see your apps.
  renderer/   Hono JSX CLI. Turns an app's manifest source into canonical release files.
  site/       Vite + Preact marketing site (kon.xyz apex, SSG).
  ethtokyo/   Reference app — manifest.source.json input for the publish pipeline.
  relay-gun/  GUN.js relay daemon. WebSocket peer for chat + draft workspace.
  relay-ipfs/ libp2p + Helia daemon exposing local blockstore to public IPFS.
packages/
  runtime-core/  Types + defaults.ts (only place id.kon.xyz literal lives) + reserved-subnames + signature helpers.
  schemas/       Zod schemas for entry / manifest / plugin objects.
  wallet-sdk/    postMessage SDK consumed by apps to talk to the wallet origin.
  plugins/
    badge/ build-with/ forum/ ical/ iframe/ markdown/ profile-card/
  contracts/     AppCoin / AppCoinFactory (Base L2). Foundry.
scripts/
  publish.mjs                  Publish pipeline orchestrator.
  publish-{site,runtime,plugin}.mjs   Per-target shipping.
  lib/{pin-service,w3up,helia,ens}.mjs   IPFS pin abstraction + ENS contenthash.
  lint-no-hardcoded-origins.mjs  CI guard: only defaults.ts may embed `id.kon.xyz`.
```

## Quick start

```bash
bun install
bun @runtime:dev      # http://127.0.0.1:5174 — runs with dev preset manifest
```

The runtime boots with an inline dev-preset manifest exercising every built-in plugin. Open Chat to test GUN; the dev preset's `gun_peers` includes `http://localhost:8765/gun`, so optionally:

```bash
bun @relay-gun:start  # local GUN relay on :8765
```

To exercise the wallet popup against the dev runtime, run `apps/wallet/` in parallel:

```bash
bun @wallet:dev       # http://127.0.0.1:5175
```

The organizer dashboard:

```bash
bun @dashboard:dev    # http://127.0.0.1:5177
```

## Publishing

Two paths:

### 1. CLI — ops / release automation (current)

```bash
bun run publish:app --app ethtokyo [--upload | --publish]
bun run publish:site                       # builds + ships apps/site to kon.xyz apex
bun run publish:runtime                    # builds + ships apps/runtime; prints CID for entry.runtime
bun run publish:plugin --plugin badge      # or --all for every plugin
```

Uploads use `W3_PRINCIPAL` + `W3_PROOF` env (web3.storage delegation held by the operator). ENS contenthash writes use `KON_DEPLOY_KEY`. Dry-run mode (no flags) works without any credentials.

### 2. Dashboard — user-facing (Phase 8)

The eventual primary path. Organizers publish from `my.kon.xyz` with **their own credentials**: their own w3up delegation for IPFS upload, their own Safe smart wallet for the ENS `setContenthash` tx. No KON-held private key is ever in the user-facing loop — that's the positioning ("apps your community owns") taken literally.

Code-share with the CLI: the canonical-JSON, Zod schemas, and `w3up-client` API are identical in browser and Node. Only the auth surface differs (delegation paste UI vs env var; wallet popup vs `KON_DEPLOY_KEY`).

Depends on real wallet `signTx` (Pimlico bundler+paymaster) and the dashboard's claim flow. See the plan §Phase 8 for the storage-onboarding model (hybrid: free-tier proxy + BYOK upgrade).

The CLI pipeline also runs in CI via `.github/workflows/publish.yml` (manual dispatch or `publish/<app>` tag push).

## Self-hosting (Phase 7, sketch)

`kon.xyz` is the default fast path, never a hard dependency. To run KON on your own domain:

1. Acquire `yourdomain.com` and enable DNSSEC.
2. Import the domain into ENS at app.ens.domains/dns/yourdomain.com.
3. Build + publish `apps/wallet` to your own IPFS pin → set `_dnslink` + ENS `contenthash` on `id.yourdomain.com`. Full runbook: [`docs/self-host-wallet.md`](docs/self-host-wallet.md).
4. Same for `apps/dashboard` → `my.yourdomain.com`.
5. Override `manifest.deployment.wallet_origin` to `https://id.yourdomain.com` in your app's manifest source.
6. Optionally run your own relays — `apps/relay-gun` (chat) + `apps/relay-ipfs` (IPFS pin) — via the root `docker-compose.yml`.

The CI lint at `scripts/lint-no-hardcoded-origins.mjs` rejects any literal `id.kon.xyz` outside `packages/runtime-core/src/defaults.ts` so self-host overrides cannot be bypassed.

### Relay stack (one VPS, two protocols)

Full runbook: [`docs/self-host-relay.md`](docs/self-host-relay.md).

The root `docker-compose.yml` co-deploys both relays plus Caddy (TLS reverse proxy) on a single VPS. On any host that can run Docker (Vultr Tokyo $6/mo, Oracle Cloud Free, Hetzner, Fly.io, your homelab):

```bash
git clone https://github.com/buildwithkon/kon.git
cd kon
cp .env.relay.example .env
vim .env                    # set KON_RELAY_DOMAIN + ACME_EMAIL
docker compose up -d
```

DNS records before bringing up (Let's Encrypt HTTP-01 needs live DNS):

```
relay.<DOMAIN>     A    <vps-ipv4>
gateway.<DOMAIN>   A    <vps-ipv4>
```

Caddy auto-issues certs for both hostnames. `wss://relay.<DOMAIN>/gun` is the GUN endpoint; `https://gateway.<DOMAIN>/ipfs/<cid>` is the IPFS HTTP gateway. The libp2p TCP port (4001) is exposed directly (not behind Caddy — libp2p can't traverse an HTTP proxy).

### Multi-region scaling (Stage 2+)

For Stage 1 (ETHTokyo, single Tokyo VPS) the single-host docker-compose is sufficient. To scale geographically:

1. **Stand up the same stack in each region** — Tokyo, Frankfurt, Virginia, etc. Each region has its own VPS, its own `.env`, its own Caddy cert.
2. **GeoDNS at the edge** — point `relay.kon.xyz` (and `gateway.kon.xyz`) at multiple region IPs via a DNS provider that supports geographic answers: Cloudflare DNS, Route53 latency-based routing, NS1, or similar. Each client's DNS lookup returns the IP of the nearest region.
3. **GUN gossip-sync between regions** — on each region's `.env`, set `KON_GUN_PEERS` to the public `/gun` URLs of the _other_ regions. GUN's CRDT will keep chat + draft graphs in sync across the mesh in ~100ms-1s without any application-level coordination.
4. **IPFS needs no special config** — libp2p's kad-DHT handles global content discovery automatically. Each region holds its own blockstore; cross-region fetches resolve via Bitswap.

Example for the Tokyo region of a three-region KON deployment:

```bash
KON_GUN_PEERS=https://fra.relay.kon.xyz/gun,https://iad.relay.kon.xyz/gun
```

No code changes between Stage 1 and Stage 2 — only env + DNS.

## Toolchain

- **Bun 1.3+** as package manager + JavaScript runtime for scripts. Lockfile is `bun.lock` at root.
- Vite 5 + Preact 10 + @preact/signals
- viem 2.51 + permissionless 0.3 (ERC-4337 + Safe v1.4.1 + Pimlico paymaster)
- GUN.js + SEA for chat / realtime sync / identity-derived keys
- web3.storage (w3up) + Helia for IPFS pinning (`KON_PIN_SERVICE=w3up|helia`)
- ENS (DNS-ENS via DNSSEC + ENSIP-10) for app resolution
- **oxlint + oxfmt** for lint + format
- TypeScript across all packages
- Service worker (workbox via vite-plugin-pwa) for offline-first caching

## Lint, format, typecheck

```bash
bun run lint           # oxlint
bun run lint:fix       # oxlint --fix
bun run lint:origins   # custom rule: no literal id.kon.xyz outside defaults.ts
bun run format         # oxfmt --write .
bun run format:check   # oxfmt --check .
bun run typecheck:v2   # tsc --noEmit for runtime-core + schemas
```

Plus per-package `bun --filter=@konxyz/<pkg> run typecheck`.

## CI

`.github/workflows/lint.yml` runs the three lint gates on push and PR. `.github/workflows/publish.yml` is manual (workflow_dispatch) or tag-triggered for release.

## Open items

- [ ] **Pimlico API key + sponsorship policy** — unblocks bundler + paymaster (real wallet signTx).
- [ ] **web3.storage account** — unblocks `--upload` in publish pipeline.
- [ ] **DNS provider for `kon.xyz` with DNSSEC** — required before the DNS-ENS import works.
- [ ] **ENS DNS-import on app.ens.domains** — once done, publish pipeline writes contenthash directly.
- [ ] **GUN peer relay** — KON-run relay (Docker image planned in Phase 7) plus configurable public fallbacks via manifest.
