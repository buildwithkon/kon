# Self-host the KON public runtime

Pin your own copy of `apps/runtime` to IPFS so your apps don't depend on the KON-managed runtime CID at `runtime.kon.xyz`. This is the shortest of the Phase 7 runbooks — the runtime is a static SPA, no infra to operate, and most self-host operators won't need this at all.

**Who this is for.** Operators who want every layer of their KON deployment immutably theirs, including the JS bundle that boots in users' browsers. If KON ships a runtime version with a bug, your CID stays pinned to the version you tested. If KON disappears, your runtime CID is independent.

**When you don't need this.** Apps that reference the KON-managed runtime CID work fine. The runtime is open-source and re-buildable from any KON release tag — even if `runtime.kon.xyz` goes away, the same bytes are still on IPFS as long as one peer pins them. For most ETHTokyo-scale deployments, defaulting is correct.

## How the runtime is referenced

Every published KON app has an entry.json with shape:

```json
{
  "schema": "kon-entry-v1",
  "name": "Matsuri",
  "runtime": "ipfs://bafy-runtime-cid",
  "manifest": "./manifest.json",
  "version": 12,
  "publishedAt": "2026-09-20T03:00:00Z"
}
```

The `runtime` field is the CID the user's browser fetches from any IPFS gateway. Bumping it is what propagates new runtime code to users — the entry is content-addressed, so each runtime version is a different CID.

## Step-by-step

### 1. Build the runtime

```bash
git clone https://github.com/buildwithkon/kon.git
cd kon
git checkout <release-tag>     # pin a specific version
bun install
bun --filter=@konxyz/runtime run build
# → apps/runtime/dist/ contains the full SPA bundle (~450 KB precache)
```

If you want a customized runtime (different plugin list, different dev-preset, your own branding), fork the repo and edit `apps/runtime/src/`. The plugin contract + manifest schema are stable across forks; only the host-shell varies.

### 2. Pin the dist directory to IPFS

```bash
# Via the relay you self-host (recommended if you also run docs/self-host-relay.md):
KON_PIN_SERVICE=helia bun run publish:runtime --upload
# → prints: runtime CID: ipfs://bafy...

# Or via web3.storage:
W3_PRINCIPAL=... W3_PROOF=... bun run publish:runtime --upload

# Or by hand:
ipfs add -r apps/runtime/dist
# → CID for the directory root
```

The publish script uploads the directory; the runtime CID points at the root, and the runtime entry-point is at `<CID>/runtime.js`. Service-worker assets live at sibling paths.

### 3. Point your apps' entries at your runtime CID

In each KON app's `manifest.source.json`, set the runtime CID either via the publish CLI flag:

```bash
bun run publish:app --app matsuri --runtime ipfs://bafy-your-runtime-cid --publish
```

Or stash it in `.kon/runtime-cid.txt` so every subsequent publish picks it up automatically:

```bash
echo 'bafy-your-runtime-cid' > .kon/runtime-cid.txt
bun run publish:app --app matsuri --publish
# Picks up the CID from .kon/runtime-cid.txt
```

The published entry.json now references your runtime instead of the KON-managed one.

### 4. Verify

```bash
# Browser visits matsuri.<your-domain>; service worker boots the runtime from
# the CID baked into entry.json. Check the network tab — the request goes to
# your-CID/runtime.js, not runtime.kon.xyz/runtime.js.
```

The KON-managed gateway list (`KON_DEFAULTS.ipfs_gateways`) is what the browser uses to fetch your CID — they happily serve anyone's content as long as the CID is real. You don't need to host your own gateway just to serve your runtime.

## Updating the runtime

```bash
git pull
bun --filter=@konxyz/runtime run build
KON_PIN_SERVICE=helia bun run publish:runtime --upload
# → new CID

# Update entry.runtime in each app you control:
echo 'bafy-new-cid' > .kon/runtime-cid.txt
bun run publish:app --app matsuri --publish
bun run publish:app --app stage --publish
# ...etc
```

Apps you DON'T re-publish keep running on the old CID — that's the design. The runtime is per-app-pinned so a global update doesn't break apps that haven't been re-tested.

## When the runtime is the WRONG layer to self-host

You're probably looking at the wrong layer if your motivation is:

- **Custom plugins.** Plugins are content-addressed separately. Add your plugin to `packages/plugins/`, publish it via `bun run publish:plugin`, reference the CID in your app manifest's `plugins[]`. No runtime fork needed.
- **Custom branding.** The runtime is the host shell; branding lives in each app's manifest + pages. Default runtime can render any styling.
- **Custom wallet / GUN / IPFS endpoints.** Those flow through `manifest.deployment` and don't require a custom runtime.
- **Custom dashboard editor.** That's `apps/dashboard`, not the runtime. See [`docs/self-host-dashboard.md`](self-host-dashboard.md).

## Multi-region considerations

Same as the [wallet origin](self-host-wallet.md): pick one global IPFS bundle (one CID, one DNSLink record). The runtime bundle is content-addressed so any IPFS gateway worldwide serves the same bytes. Regional caching falls out for free; no GeoDNS needed.

## Self-host operator's promise

A pinned runtime CID + your own pin service (or one trustworthy public pin) = your apps boot the same JS forever, regardless of what the KON project does upstream. The CID is the contract; everything else is implementation detail.
