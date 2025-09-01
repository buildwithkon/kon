# Repository Guidelines

Use this guide to bootstrap local development, testing, and contributions across the monorepo.

## Project Structure & Module Organization
- `apps/pwa`: React Router PWA (Cloudflare Workers via wrangler).
- `packages/api`: Hono API for Cloudflare Workers.
- `packages/subdomain-router`: Worker for subdomain routing (+ tests).
- `packages/shared`: Cross-package TS utilities, schemas, styles.
- `packages/shared-react`: Reusable React components/hooks.
- `packages/site`: Marketing/docs (Vite + Honox).
- `packages/xmtp-agent`: Node-based XMTP agent.
- `packages/contracts`: Solidity resources and vendor libs.
- Tests live near source as `*.spec.ts`/`*.test.ts` or under `test/`.

## Build, Test, and Development Commands
- Install deps: `pnpm install`
- Run API + PWA dev: `pnpm dev`
- Start PWA against API: `pnpm start`
- Filtered package scripts (examples):
  - API: `pnpm --filter @konxyz/api dev`
  - PWA: `pnpm --filter @konxyz/app-pwa dev`
  - Router: `pnpm --filter @konxyz/subdomain-router dev`
  - Agent: `pnpm --filter @konxyz/xmtp-agent dev`
- Deploy per package (example): `pnpm --filter @konxyz/api run deploy:staging`

## Coding Style & Naming Conventions
- Language: TypeScript (TS/TSX). React components in PascalCase (e.g., `TopBar.tsx`); hooks in camelCase (e.g., `useWallet.ts`).
- Formatting/linting: Biome at repo root. Run `pnpm biome check` (2-space indent, single quotes, no trailing commas; unused imports/vars warned).
- CSS: Tailwind v4 in PWA; shared styles under `packages/shared/styles`.

## Testing Guidelines
- Framework: Vitest. Workers use `@cloudflare/vitest-pool-workers` with `wrangler.jsonc` (see `packages/subdomain-router`).
- Run tests:
  - API: `pnpm --filter @konxyz/api test`
  - Router: `pnpm --filter @konxyz/subdomain-router test`
- Conventions: Name specs `*.spec.ts`/`*.test.ts`; colocate near source or under `test/`.

## Commit & Pull Request Guidelines
- Commits: concise, imperative subjects (e.g., "add collapsible to login dialog"); reference issues (`#123`) when applicable.
- PRs must include:
  - Clear description and motivation.
  - Linked issues and affected packages.
  - Screenshots/GIFs for UI changes (PWA/site).
  - Test notes: how to run and any coverage added.

## Security & Configuration
- Cloudflare env via `wrangler.jsonc`; never commit secrets.
- Local agent env in `packages/xmtp-agent/.env` (gitignored).
- Prefer `@konxyz/shared` utilities for network/crypto logic to avoid duplication.

