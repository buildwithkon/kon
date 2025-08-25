# Repository Guidelines

## Project Structure & Modules
- apps/pwa: React Router PWA deployed via Cloudflare Workers (wrangler).
- packages/api: Hono API for Cloudflare Workers.
- packages/subdomain-router: Worker for subdomain routing with tests.
- packages/shared: Cross-package TS utilities, schemas, styles.
- packages/shared-react: Reusable React components/hooks.
- packages/site: Marketing/docs site (Vite + Honox).
- packages/xmtp-agent: Node-based XMTP agent.
- packages/contracts: Solidity-related resources and vendor libs.

## Build, Test, Develop
- Install: `pnpm install`
- Run API + PWA dev: `pnpm dev`
- Start PWA against API: `pnpm start`
- Filtered package scripts (examples):
  - API dev: `pnpm --filter @konxyz/api dev`
  - PWA dev: `pnpm --filter @konxyz/app-pwa dev`
  - Router dev: `pnpm --filter @konxyz/subdomain-router dev`
  - Agent dev: `pnpm --filter @konxyz/xmtp-agent dev`
- Deploy (per package): e.g. `pnpm --filter @konxyz/api run deploy:staging`

## Coding Style & Conventions
- Language: TypeScript (TS/TSX). React components in PascalCase (e.g., `TopBar.tsx`), hooks in camelCase (e.g., `useWallet.ts`).
- Formatting/linting: Biome at repo root. Run `pnpm biome check` (or IDE integration). 2-space indent, single quotes, no trailing commas; unused imports/vars warned.
- CSS: Tailwind (v4) in PWA; shared styles under `packages/shared/styles`.

## Testing Guidelines
- Framework: Vitest.
- Run tests:
  - API: `pnpm --filter @konxyz/api test`
  - Router: `pnpm --filter @konxyz/subdomain-router test`
- Conventions: Place unit/integration specs as `*.spec.ts` or `*.test.ts` near source or under `test/`. For Workers, use `@cloudflare/vitest-pool-workers` and `wrangler.jsonc` as in `packages/subdomain-router`.

## Commit & Pull Requests
- Commits: Use concise, imperative subjects (e.g., "add collapsible to login dialog"). Group related changes; reference issues (`#123`) when applicable.
- PRs must include:
  - Clear description of change and motivation.
  - Linked issues and scope of impact (packages affected).
  - Screenshots/GIFs for UI tweaks (PWA/site).
  - Test notes: how to run, any coverage added.

## Security & Configuration
- Cloudflare env via `wrangler.jsonc`; do not commit secrets. For local agents, use `.env` in `packages/xmtp-agent` (ignored by default).
- Prefer `@konxyz/shared` utilities for network/crypto logic to avoid duplication.
