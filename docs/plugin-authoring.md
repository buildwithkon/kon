# Authoring a KON v2 plugin

Two paths exist for shipping a plugin:

1. **Built-in (KON-shipped)** — lives under `packages/plugins/<name>/`, imported statically at runtime build time. Use this for plugins the KON team maintains and ships with the runtime.
2. **Third-party** — a single ES module file hosted on IPFS. The runtime fetches it by `ipfs://<CID>` (the `plugin.source` field in the manifest) and dynamically imports it on first use.

Both paths use the same component contract.

## Component contract

```ts
import type { KonPluginComponent } from '@konxyz/runtime-core'

interface MyProps {
  greeting?: string
}

const MyPlugin: KonPluginComponent<MyProps> = ({ props, context }) => {
  return <div>{props?.greeting ?? `Hello from ${context.appId}`}</div>
}

export default MyPlugin
```

`context` is `{ deployment, appId, wallet }`:

- `deployment` — resolved runtime config (IPFS gateways, GUN peers, wallet origin, ENS domain). Always honor this over hardcoding.
- `appId` — the app's manifest `app.id`.
- `wallet` — handle to the central wallet via `@konxyz/account-sdk`. Use `wallet.requestKeyDerivation(label)` to obtain a deterministic 32-byte key for SEA / E2EE / etc.

## Built-in path

```bash
mkdir -p packages/plugins/my-plugin/src
```

Files:

```
packages/plugins/my-plugin/
  package.json         # name: @konxyz/plugin-my-plugin, deps: preact + @konxyz/runtime-core
  tsconfig.json        # jsx: preserve, jsxImportSource: preact, moduleResolution: Bundler
  src/index.tsx        # default-exports the component
```

Then register in `apps/runtime/src/plugin-registry.ts`:

```ts
import MyPlugin from '@konxyz/plugin-my-plugin'

export const BUILTIN_PLUGINS = {
  // ...
  'my-plugin': MyPlugin as KonPluginComponent
}
```

…and add the dep to `apps/runtime/package.json`.

## Third-party (IPFS) path

Your plugin lives outside KON's repo. Bundle it as a single self-contained ES module:

- Default export must be a `KonPluginComponent`.
- **Do not bundle** `preact`, `preact/hooks`, `@preact/signals` — the runtime provides them via an import map at `apps/runtime/index.html`. Bare imports like `import { h } from 'preact'` and `import { useState } from 'preact/hooks'` resolve against the runtime's CDN-pinned versions automatically.
- You may bundle anything else.

Recommended build (Vite library mode):

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: { entry: 'src/index.tsx', formats: ['es'], fileName: 'plugin' },
    rollupOptions: {
      external: ['preact', 'preact/hooks', '@preact/signals']
    }
  }
})
```

Upload the resulting `dist/plugin.js` to IPFS (web3.storage `w3 up`, Pinata, your own kubo, etc), capture the CID, then reference it in the consuming app's manifest:

```json
{
  "id": "my-plugin",
  "version": "1.0.0",
  "source": "ipfs://bafy...your-cid",
  "props": { "greeting": "hi" }
}
```

The runtime fetches the bundle via the configured IPFS gateways (`manifest.deployment.ipfs_gateways`), runs it through `URL.createObjectURL` + dynamic `import()`, caches the resolved component by CID, and renders it. The service worker caches the bytes forever (CIDs are immutable).

## Manifest schema

The plugin entry is validated against `packages/schemas`:

```ts
KonPluginV1Schema = {
  id: string,            // looked up in BUILTIN_PLUGINS first
  version: string,       // semver (informational)
  source: 'ipfs://...',  // required even for built-ins (informational + future-proof)
  props?: Record<string, unknown>  // shape defined per-plugin
}
```

Validation runs at the renderer (`apps/renderer/`) before the manifest gets uploaded, and again at runtime boot before any plugin renders.

## Self-host overrides

Plugin sources can point at the same CID hosted on a self-hosted gateway. As long as `manifest.deployment.ipfs_gateways` includes that gateway URL, the runtime will fetch through it. There is no special case in the loader for the default kon.xyz gateways vs custom ones.
