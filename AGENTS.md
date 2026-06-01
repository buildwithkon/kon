# AGENTS.md

This file provides guidance to coding agents (Claude Code, etc.) when working with code in this repository.

## Project Overview

KON is a No-code On-chain App Framework for building Progressive Web Apps that communities own. v2 architecture: client-first, served from IPFS via DNS-ENS, with a central wallet origin at `id.kon.xyz` and a central dashboard at `my.kon.xyz`. Every layer is self-hostable on a custom domain — `kon.xyz` is the default fast path, not a hard dependency.

## Development Commands

### Initial Setup

```bash
bun install

# Optional: per-package env files (see each app's .env.example / .dev.vars.example)
```

### Running Services

```bash
bun @runtime:dev      # http://127.0.0.1:5174 — Public Runtime SPA
bun @account:dev      # http://127.0.0.1:5175 — id.kon.xyz wallet origin
bun @site:dev         # http://127.0.0.1:5176 — kon.xyz marketing site
bun @dashboard:dev    # http://127.0.0.1:5177 — my.kon.xyz organizer portal
bun @relay-gun:start  # http://127.0.0.1:8765 — local GUN.js relay
bun @relay-ipfs:start # local libp2p + Helia HTTP gateway (4001 + 8080)
```

### Publish pipeline (CLI)

```bash
bun run publish:app --app ethtokyo [--upload | --publish]
bun run publish:site            # apps/site → kon.xyz apex
bun run publish:runtime         # apps/runtime → CID for entry.runtime
bun run publish:plugin --plugin badge   # or --all
```

`--upload` requires `W3_PRINCIPAL` + `W3_PROOF` (web3.storage delegation). `--publish` additionally requires `KON_DEPLOY_KEY` (ENS contenthash update).

### Smart Contract Development

```bash
cd packages/contracts
forge install
forge build
forge test
forge script script/DeployFactory.s.sol --broadcast --verify
```

### Code Quality

```bash
bun run lint          # oxlint
bun run lint:fix      # oxlint --fix
bun run lint:origins  # custom rule: no literal id.kon.xyz outside defaults.ts
bun run format        # oxfmt --write
bun run format:check  # oxfmt --check
bun run typecheck:v2  # tsc --noEmit for runtime-core + schemas
```

Plus per-package `bun --filter=@konxyz/<pkg> run typecheck`.

## Architecture

### Monorepo Structure

```
apps/
  runtime/         Public Runtime SPA (Vite + Preact + signals). The browser host
                   that resolves ENS contenthash, loads entry + manifest, renders
                   pages and plugins, and exposes /admin per-app editor.
  account/         id.kon.xyz central wallet origin (Vite + Preact). Safe v1.4.1 +
                   passkey via viem WebAuthn + permissionless.js + Pimlico paymaster.
  dashboard/       my.kon.xyz central dashboard (Vite + Preact). Sign in once, see
                   apps owned, claim new <app>.kon.xyz subnames.
  renderer/        Publish-time CLI (Hono JSX). Normalizes manifest source into the
                   canonical KonManifestV1 + entry.template.json + index.html.
  site/            kon.xyz marketing site (Vite + Preact, SSG).
  ethtokyo/        ETHTokyo manifest source. The reference app shipped at Stage 1.
  relay-gun/       GUN.js WebSocket relay (chat + draft workspace gossip layer).
  relay-ipfs/      libp2p + Helia daemon exposing local blockstore to public IPFS.

packages/
  runtime-core/    Types (KonEntryV1, KonManifestV1, KonPluginV1) + defaults +
                   reserved-subnames + signature helpers.
  schemas/         Zod schemas for entry + manifest + plugin.
  account-sdk/     postMessage SDK for apps to talk to the wallet origin.
  plugins/
    badge/ build-with/ forum/ ical/ iframe/ markdown/ profile-card/
  contracts/       AppCoin + AppCoinFactory (Base L2). Foundry.

scripts/
  publish.mjs                    Publish orchestrator (renderer → IPFS → ENS).
  publish-{site,runtime,plugin}.mjs   Per-target shipping.
  lib/{pin-service,w3up,helia,ens}.mjs   IPFS pin abstraction + ENS contenthash.
  lint-no-hardcoded-origins.mjs  CI guard: only defaults.ts may embed `id.kon.xyz`.
```

### Key Technologies

- **Runtime**: Vite 5 + Preact 10 + @preact/signals (no React)
- **Toolchain**: Bun 1.3 (package manager + .ts script runtime), oxlint + oxfmt
- **Blockchain**: Base mainnet / sepolia, Viem 2.51, Safe v1.4.1, permissionless 0.3, Pimlico bundler+paymaster
- **Identity**: passkey via viem WebAuthn (rpId read from `window.location.hostname` at runtime)
- **Realtime**: GUN.js + SEA for chat + draft workspace + verifiable identity-derived keys
- **Storage**: IPFS via DNS-ENS (ENSIP-10 wildcard + DNSSEC) on `kon.xyz`. Helia or w3up via the PinService abstraction.
- **Service worker**: workbox via vite-plugin-pwa (offline-first + stale-while-revalidate)
- **Smart Contracts**: OpenZeppelin v5.3, Foundry

### Network Configuration

- **kon.xyz**: Base Mainnet (production)
- **kon.wtf**: Base Sepolia (staging)
- App subnames: `<app>.kon.xyz` via DNS-ENS contenthash

### Self-Host Design

`kon.xyz` is convenience, not dependency. Every endpoint that points at a KON-managed origin (`id.kon.xyz`, `my.kon.xyz`, gateway URLs, GUN relay URLs) lives in `packages/runtime-core/src/defaults.ts`. The CI lint at `scripts/lint-no-hardcoded-origins.mjs` rejects any literal `id.kon.xyz` outside that file, so self-host overrides via `manifest.deployment` cannot be bypassed.

### Hosting model

Everything KON-managed runs on **one VPS** — a single Vultr Tokyo droplet (~$6/mo) hosting:

- `relay-gun` (chat WebSockets) and `relay-ipfs` (libp2p + IPFS pin + `/api/pin`)
- Caddy fronting both, plus **three more Caddy vhosts** that serve the static SPAs (`id.<DOMAIN>`, `my.<DOMAIN>`, `<DOMAIN>` apex) by proxying pinned bundle CIDs through `relay-ipfs`'s blockstore

So when an agent is asked where a static SPA goes, the answer is "pin it to the relay-ipfs blockstore, set the `KON_*_CID` env, restart Caddy." Not Fleek (sunset in 2025), not "a separate IPFS host" by default. See `docs/self-host-wallet.md` for the deploy step-by-step.

Managed-IPFS-host alternatives (4everland, Pinata Picnic plan) are documented as opt-in for operators who'd rather not maintain their own Caddy vhosts. The relay VPS is still required regardless of static-hosting choice (chat + IPFS pin can't live on a static host).

## Code Style Guidelines

- oxlint + oxfmt for lint + format
- Preact (not React) — `@jsxImportSource preact` on every TSX file
- No emojis in code unless explicitly requested
- Don't add comments unless the WHY is non-obvious
- Self-host policy: never embed `id.kon.xyz` literally; route through `resolveDeployment()` from runtime-core

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
