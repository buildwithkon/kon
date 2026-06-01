# Self-host the KON dashboard origin

Deploy `my.<your-domain>` so the organizer portal for your KON deployment runs under your control instead of `my.kon.xyz`. The dashboard is where organizers sign in, claim new `<app>.<your-domain>` subnames, and see the apps they own.

**Who this is for.** Operators running KON on their own domain who also want the cross-app portal experience native to that domain (e.g. a festival running `my.myfestival.com` so organizers don't bounce out to `my.kon.xyz` to manage their apps).

**When you don't need this.** Self-hosting the wallet (`id.<your-domain>`) and the runtime is enough to ship apps. The dashboard is a convenience — organizers can still edit each app at `<app>.<your-domain>/admin` (the per-app editor lives inside the runtime). Skip this doc if you don't have multiple apps + multiple organizers worth a portal.

## What the dashboard does

```
                organizer
                    │  sign in
                    ▼
        ┌──────────────────────┐
        │ my.<DOMAIN>          │   ← this self-host target
        │ (Vite + Preact SPA)  │
        │                      │
        │  ┌────────────────┐  │
        │  │ "Claim subname"│──┼──→ wallet.signTx(setSubnodeOwner)
        │  └────────────────┘  │     (popup at id.<DOMAIN>)
        │                      │
        │  ┌────────────────┐  │
        │  │ "Your apps"    │──┼──→ deep-link to <app>.<DOMAIN>/admin
        │  └────────────────┘  │     (per-app editor inside runtime)
        └──────────────────────┘
```

The dashboard is intentionally thin. Heavy lifting (passkey, Safe, IPFS upload, ENS write) lives in the wallet (`id.<DOMAIN>`) and the runtime's `/admin` route. The dashboard is just the **cross-app overview + new-app provisioning**.

## Prerequisites

|                                         | Required             | Notes                                                                                                                                                                                                 |
| --------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wallet origin already deployed          | ✅                   | [`docs/self-host-wallet.md`](self-host-wallet.md). The dashboard's sign-in flow needs `id.<DOMAIN>` to exist first.                                                                                   |
| Domain with DNSSEC enabled              | ✅                   | Same domain you used for the wallet.                                                                                                                                                                  |
| ENS DNS-import done                     | ✅                   | One-time setup at app.ens.domains/dns/`yourdomain.com`.                                                                                                                                               |
| A static hosting target                 | ✅                   | Same options as the wallet: Fleek, 4everland, Caddy + Kubo on a VPS.                                                                                                                                  |
| Optional: relay-ipfs `/api/pin` exposed | Strongly recommended | Without it, the dashboard's "Publish" flow falls back to KON-managed `gateway.kon.xyz/api/pin` — which works, but defeats the sovereignty story. See [`docs/self-host-relay.md`](self-host-relay.md). |

## How the dashboard derives its deployment context

`apps/dashboard/src/deployment.ts` reads `window.location.hostname` at runtime and constructs the resolved deployment block from the matched pattern:

| Deployed at         | wallet_origin               | ens_domain           | ipfs_pin_endpoint                        |
| ------------------- | --------------------------- | -------------------- | ---------------------------------------- |
| `my.kon.xyz`        | `https://id.kon.xyz`        | `kon.xyz`            | `https://gateway.kon.xyz/api/pin`        |
| `my.myfestival.com` | `https://id.myfestival.com` | `myfestival.com`     | `https://gateway.myfestival.com/api/pin` |
| `localhost:5177`    | KON-managed defaults        | KON-managed defaults | KON-managed defaults                     |

Nothing in the bundle hardcodes any KON-managed origin — the same compiled bytes work for any `my.<root>` deployment.

## Step-by-step

### 1. Build the dashboard

```bash
cd /your/kon/clone
bun --filter=@konxyz/dashboard run build
# → apps/dashboard/dist/ (~30 KB precache, 12 KB gz)
```

The bundle is tiny because the dashboard delegates the heavy crypto to the wallet origin and the heavy storage to the relay. It's a shell with three forms.

### 2. Pin to IPFS

```bash
# Via your own relay (recommended):
KON_PIN_SERVICE=helia bun --filter=@konxyz/dashboard run build
# CID is logged at upload time. Or pin manually:
ipfs add -r apps/dashboard/dist
```

### 3. Wire DNS + ENS

```
# DNS A or CNAME for the IPFS gateway you chose:
my.<DOMAIN>          A    <gateway-ipv4>
                     or
my.<DOMAIN>          CNAME <fleek-host>.fleek.co

# DNSLink for the IPFS gateways that use it:
_dnslink.my.<DOMAIN> TXT  "dnslink=/ipfs/<CID>"

# ENS contenthash on the my.<DOMAIN> subname (use viem or
# app.ens.domains UI under your apex's subname records):
my.<DOMAIN>          contenthash = ipfs://<CID>
```

The dashboard load path is HTTPS to `my.<DOMAIN>`; the `.limo` fallback (`my-<DOMAIN-with-dashes>.limo`) works automatically once the ENS contenthash is set.

### 4. Verify the dashboard wires correctly

```bash
# Open https://my.<DOMAIN>/ in a fresh incognito window.
# Sign in. Popup should open at id.<DOMAIN> (not id.kon.xyz).
# Type a candidate subname; the suffix display should show .<DOMAIN>.
# Click Claim. Wallet popup should propose:
#   to: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e (ENS Registry)
#   data: setSubnodeOwner(namehash("<DOMAIN>"), keccak("subname"), you)
#
# If you see id.kon.xyz or .kon.xyz in the popup, hostname derivation
# failed — re-check that the bundle is loaded from my.<DOMAIN>, not
# a .limo fallback URL.
```

### 5. Subname provisioning permissions

`setSubnodeOwner` requires the caller (the organizer's Safe) to own the parent `<DOMAIN>` ENS node. There are two models:

**Model A: open self-service (riskier)**

- The apex `<DOMAIN>` node's owner is a contract that lets anyone claim any subname (first-come-first-served). Like ENS's old free-tier `.eth` registrar.
- Pro: zero ops, organizers self-serve.
- Con: someone could squat `important-subname.<DOMAIN>`. Pair with the [reserved subname guard](../packages/runtime-core/src/reserved-subnames.ts) to at least prevent claiming KON-managed origins.

**Model B: gated registrar (recommended)**

- The apex `<DOMAIN>` node's owner is a contract that requires an off-chain signature from the operator. Dashboard claims become "request → approve → execute" flow.
- Pro: spam-resistant, brand-protective.
- Con: operator has to be online (or run an auto-approve bot) to grant claims.

For Stage 1, Model A is fine if the only organizers are people you trust. Stage 2 likely needs Model B.

The KON-managed deployment at `my.kon.xyz` runs Model B (KON team approves new subnames). The contract is on `packages/contracts/` — not yet deployed, planned alongside the Stage 2 launch.

## What the dashboard doesn't do

To keep the surface small + secure, the dashboard deliberately stays out of:

- **Manifest editing.** That's `<app>.<DOMAIN>/admin`, served by the runtime. The dashboard's "Open admin" link deep-links there.
- **Plugin authoring.** That's a build-time activity (see [`docs/plugin-authoring.md`](plugin-authoring.md)). The dashboard surfaces published plugins but doesn't compile them.
- **Identity bridging.** A user signing in at `my.myfestival.com` has a different Safe than at `my.kon.xyz` — see [`docs/self-host-wallet.md`](self-host-wallet.md#self-host-the-kon-wallet-origin) for the WebAuthn RP-binding explanation. Stage 3+ UCAN delegation may bridge them.
- **Publishing.** The "Publish" button lives inside each app's `/admin` route (the runtime's editor), not on the dashboard. The dashboard owns the create-new-app flow; the runtime owns per-app edits.

## Multi-region considerations

Same as the wallet origin: passkeys are origin-bound, so geo-distributing `my.<DOMAIN>` with different bundle CIDs per region breaks WebAuthn. Pick one global CID and let IPFS gateways geo-cache it.

## Troubleshooting

**The "Claim" button is grayed out even with a valid subname.**

- The wallet sign-in didn't complete. Open the browser console, look for postMessage origin errors. Most common cause: the wallet's `origin-allowlist.ts` doesn't include `my.<DOMAIN>`. Add it and re-publish the wallet bundle.

**Claim succeeds locally (card appears) but the on-chain tx never finalizes.**

- The userOpHash returned by `wallet.signTx` is the bundler's intent-to-execute, not on-chain finality. The actual ENS Registry call lands ~12 seconds later (Base mainnet block time). If it never lands, check the Pimlico dashboard for the userOp's status (rejected? sponsorship policy expired?). Until the Pimlico key is wired, the response is itself stubbed — locally everything appears to work but no on-chain effect occurs.

**`gateway.<DOMAIN>/api/pin` returns 429 immediately.**

- Per-IP rate limit kicked in. Default is 10 req/min; bump via `KON_PIN_RPM` on the relay container.
- Or you're hitting the daily byte cap (default 100 MB/IP); bump `KON_PIN_BYTES_PER_DAY`.

**The dashboard loads but doesn't pick up `<DOMAIN>` — shows `.kon.xyz` as the suffix.**

- The bundle was loaded via the `.limo` fallback (`my-<DOMAIN-with-dashes>.limo`), where the hostname doesn't match the `my.<root>` regex. Use the canonical hostname to test. In production, the `.limo` fallback only matters if your primary gateway is down — the hostname mismatch UX is mildly broken in that fallback mode and currently unfixed.

## Self-host operator's promise

The dashboard bundle plus your own DNS plus your own wallet origin plus your own relay = a fully sovereign cross-app portal. Organizers signing in at `my.<DOMAIN>` see their `<DOMAIN>` apps and never bounce out to `my.kon.xyz`. If KON disappears, your portal keeps running.
