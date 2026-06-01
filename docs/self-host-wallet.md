# Self-host the KON wallet origin

Run your own `id.<your-domain>` so the passkey + Safe smart account layer of your KON apps doesn't depend on `id.kon.xyz`. This is the wallet subsystem of the broader Phase 7 self-host story — relay self-hosting is documented separately at [`docs/self-host-relay.md`](self-host-relay.md).

**Who this is for.** Organizers who want every layer of their KON deployment under their own control, including the passkey RP (Relying Party) that issues credentials. If KON disappears one day, your apps + your wallet origin + your users' passkeys all keep working.

**When you don't need this.** Apps that point at the default `id.kon.xyz` wallet origin work fine without doing any of this. Most ETHTokyo-scale events should use the default and focus on their actual app instead.

## What changes when you self-host the wallet

```
default deployment                   self-hosted deployment
────────────────                     ──────────────────────
matsuri.kon.xyz                      matsuri.myfestival.com
   ↓ popup                              ↓ popup
id.kon.xyz                           id.myfestival.com
   passkey rpId="id.kon.xyz"            passkey rpId="id.myfestival.com"
   Safe v1.4.1 (Base)                   Safe v1.4.1 (Base)
   Pimlico bundler                      Pimlico bundler
   Coinbase paymaster (CDP)             Coinbase paymaster (CDP)
   (KON-managed keys + allowlist)       (your keys + allowlist)
```

**Crucial consequence**: a user with a passkey on `id.kon.xyz` and a passkey on `id.myfestival.com` has **two different Safe smart accounts**. WebAuthn passkeys are bound to the Relying Party origin; there is no cross-RP credential. This is a deliberate trade-off — sovereignty over universal identity. Stage 3+ may bridge identities across self-hosted deployments via UCAN-style delegation, but at the wallet layer the two accounts are independent.

## Prerequisites

|                                           | Required             | Notes                                                                                                                                                                                                  |
| ----------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A domain with DNSSEC enabled              | ✅                   | Needed for DNS-ENS contenthash resolution. Most registrars support it (Gandi, Cloudflare Registrar, Namecheap, Porkbun).                                                                               |
| ENS DNS-import done                       | ✅                   | One-time setup at app.ens.domains/dns/`yourdomain.com`.                                                                                                                                                |
| A hosting target for `apps/account/dist/` | ✅                   | The relay VPS itself (recommended — Caddy vhost serving a pinned CID) or a managed IPFS host like 4everland. See "Hosting" section below.                                                              |
| TLS cert for `id.<your-domain>`           | ✅                   | Required for WebAuthn to issue credentials. Self-signed certs don't work — browsers refuse passkey creation on untrusted origins. Caddy issues Let's Encrypt automatically; 4everland / Pinata do too. |
| A Pimlico API key (bundler)               | ✅                   | Free tier ~100K UserOps/mo. Sign up at dashboard.pimlico.io.                                                                                                                                           |
| A Coinbase CDP API key (paymaster)        | ✅                   | Coinbase subsidizes Base gas heavily. Sign up at portal.cdp.coinbase.com. Alternative: skip CDP and use Pimlico's paymaster + sponsorship policy.                                                      |
| Backup owner UX understood                | Strongly recommended | Passkey loss is unrecoverable without a backup owner. See "Recovery model" below.                                                                                                                      |

## How the rpId is derived

`apps/account/` deliberately does **not** hardcode `id.kon.xyz` anywhere. The passkey RP id is read from `window.location.hostname` at runtime, so:

| Deployed at          | `rpId` becomes         |
| -------------------- | ---------------------- |
| `id.kon.xyz`         | `id.kon.xyz` (default) |
| `id.myfestival.com`  | `id.myfestival.com`    |
| `wallet.example.org` | `wallet.example.org`   |

You don't fork the codebase — you just deploy the same bundle to your hostname.

## Hosting: same VPS as the relay (recommended) or a managed IPFS host

The wallet origin is a **static SPA** — no server, no Node process, no persistent state. The bytes need to be reachable over HTTPS at `id.<DOMAIN>`; how those bytes get served is a deployment choice. Two practical paths in 2026:

| Hosting choice                                                  | TLS for custom domain       | Cost                                          | Self-host operator fit                                                                        | Notes                                                                                                                                                                                                                                  |
| --------------------------------------------------------------- | --------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Same VPS as the relay** (Caddy vhost → relay-ipfs blockstore) | ✅ Caddy auto Let's Encrypt | **$0 additional** (relay VPS already running) | ◎ **recommended default**                                                                     | The docker-compose stack from [`docs/self-host-relay.md`](self-host-relay.md) ships a Caddy vhost for `id.<DOMAIN>` that proxies a pinned bundle CID. Set `KON_ACCOUNT_CID=...` in `.env`, restart, done. One host for everything KON. |
| **4everland** ([4everland.org](https://4everland.org))          | ✅ auto                     | $0 (free tier)                                | ○ managed alternative                                                                         | Add domain in dashboard, paste CID, done. EU + APAC PoPs. Pick this if you'd rather not maintain the Caddy vhosts yourself. The relay VPS is still required for chat + the IPFS pin endpoint.                                          |
| **Pinata Picnic plan**                                          | ✅ auto                     | $20/mo                                        | ○ paid managed                                                                                | Industry-mature dedicated-gateway product. Overkill for ETHTokyo-scale; appropriate for ongoing production where SLA matters more than $20/mo.                                                                                         |
| Storacha (formerly w3up) + `.limo`                              | ✅ via `.limo`, not yours   | $0                                            | ❌ rpId becomes `id-<DOMAIN-with-dashes>.limo` — passkeys created at `id.<DOMAIN>` won't work | Useful as a degraded-mode fallback only.                                                                                                                                                                                               |
| Cloudflare Pages + Storacha pinning                             | ✅ auto                     | $0                                            | △ reintroduces CF dependency the v2 architecture deliberately removes                         | Pick if you're already deeply CF-tied and don't care about decoupling.                                                                                                                                                                 |

**Fleek is no longer a recommendation.** Their legacy static-hosting tier with the simple "drop CID + custom domain + free TLS" UX was sunset; the current "Fleek Functions" product is a different shape. 4everland fills the same niche as a managed alternative.

**Why "same VPS as the relay" is the default**: the relay VPS already runs Caddy + a full Helia + libp2p stack with a blockstore. Adding three more Caddy vhosts (`id`, `my`, apex) that proxy fixed CIDs from the existing blockstore is a config change, not new infra. Total managed-deployment cost stays at $6/mo (one Vultr Tokyo droplet for everything KON-managed). Self-host operators get the same shape from `docker compose up -d`.

## Step-by-step deployment

### 1. DNS prep

You'll set these records before bringing your bundle live:

```
id.<DOMAIN>          CNAME storage.fleek.co            (or your gateway's CNAME)
_dnslink.id.<DOMAIN> TXT   "dnslink=/ipfs/<CID>"        (filled after first upload)
```

Also configure ENS contenthash for `id.<DOMAIN>` once your ENS DNS-import is done (set it to the same CID; lets the `.limo` gateway find your bundle as a fallback).

### 2. Configure the bundle's chain endpoints

The wallet's `apps/account/src/chains.ts` declares the bundler + paymaster endpoints per chain. The default values are blank because they require a Pimlico API key that's deployment-specific. Edit a `.env` (gitignored) — never commit the key:

```bash
# apps/account/.env
VITE_PIMLICO_API_KEY=pim_xxxxxxxxxxxxxxxxxx
VITE_PIMLICO_SPONSORSHIP_POLICY_ID=sp_xxxxxxxxxxxx
```

`apps/account/src/chains.ts` reads these via `import.meta.env.VITE_*` at build time — Vite inlines them into the bundle. The Pimlico API key becomes a public string anyone with the deployed `id.<DOMAIN>` bundle can read. **That is fine as long as the key is restricted in the Pimlico dashboard** (see the "Pimlico API key handling" section below — there's no other way to "hide" a client-side bundler endpoint).

### 3. Build + pin

```bash
# Build with the Pimlico env in scope
bun --filter=@konxyz/account run build
# → apps/account/dist/  (the static SPA bundle)
```

Pick a pin target:

```bash
# Path 1 (recommended) — pin to your own relay-ipfs blockstore via the
# /api/pin endpoint. Then the Caddy vhost in the relay docker-compose
# serves it. Same VPS, no extra hosting subscription.
#
# Use the ipfs CLI against your relay's HTTP gateway, or w3up-style
# directory upload to the /api/pin endpoint (one POST per file in the
# dist tree; a small wrapper script is on the roadmap):
ipfs add -r --pin --cid-version 1 apps/account/dist
# → root CID of the directory
ipfs dag export <root-cid> > /tmp/account.car
curl -X POST https://gateway.<DOMAIN>/api/pin \
  -H 'content-type: application/vnd.ipld.car' \
  --data-binary @/tmp/account.car

# Path 2 — managed alternative on 4everland (or Pinata Picnic).
# Upload the dist directory via the platform's dashboard or CLI.
# Configure custom domain id.<DOMAIN> in their UI → they handle TLS.
4ever publish apps/account/dist
# → records the CID + sets up DNSLink for the domain you configured
```

### 4. Wire DNS + the Caddy vhost (or DNSLink for managed hosts)

**Path 1 (same VPS):**

```
# DNS A record for the static origin — same VPS as the relay
id.<DOMAIN>  A  <vps-ipv4>
```

Set `KON_ACCOUNT_CID=<root-cid>` in the relay stack's `.env`, then redeploy:

```bash
ssh <vps>
cd kon
echo 'KON_ACCOUNT_CID=bafy...' >> .env   # or edit the existing line
docker compose up -d caddy               # reload the Caddy config
```

Caddy will issue Let's Encrypt for `id.<DOMAIN>` automatically on first hit. The included vhost in `Caddyfile` proxies `id.<DOMAIN>/<path>` → `relay-ipfs:8080/ipfs/${KON_ACCOUNT_CID}/<path>` with SPA-aware routing (asset extensions resolve nested, everything else falls through to `index.html`).

**Path 2 (4everland / Pinata):**

```
# DNS records the managed platform tells you to add — typically
_dnslink.id.<DOMAIN>  TXT    "dnslink=/ipfs/<CID>"
id.<DOMAIN>           CNAME  <managed-host>.4everland.app
```

Also set the ENS contenthash on `id.<DOMAIN>` (use viem or the app.ens.domains UI under your subname's records — this makes the `.limo` gateway resolve as a fallback):

```
id.<DOMAIN>  contenthash = ipfs://<CID>
```

Wait 1-2 minutes for DNS propagation, then verify:

```bash
curl -L https://id.<DOMAIN>/        # should return the wallet bundle's index.html
```

The TLS cert is issued automatically by Fleek / 4everland on first request. You don't run an ACME client yourself.

## Bundler + Paymaster setup

The wallet uses two ERC-4337 vendors:

- **Bundler**: Pimlico (submits UserOperations to the EntryPoint). Required.
- **Paymaster**: Coinbase Developer Platform (CDP) on Base — preferred, since Coinbase subsidizes Base gas. Pimlico paymaster is the fallback.

The wallet bundle is **a static client-side SPA shipped to every user's browser**. Any string in the bundle is readable by anyone who opens devtools. There is no "hide" — only "restrict so the key is useless to anyone but legitimate KON traffic."

The defense-in-depth model is:

```
   bundle ships keys → each vendor's dashboard restricts its key
                   └→ sponsorship/contract allowlist gates what UserOps get sponsored
                        └→ paymaster rejects calls outside the allowlist
```

Even if a third party extracts the key, they can only sponsor operations that match the allowlist, called from an allowed origin. Drains aren't possible; the worst case is they consume the configured per-day quota with no-op calls (which both vendors' rate-limiting catches anyway).

### Step 1: Pimlico (bundler) — dashboard setup

In the Pimlico dashboard ([dashboard.pimlico.io](https://dashboard.pimlico.io)):

1. **API Keys → Create API Key** → name it `kon-mainnet` (or your domain). Copy the resulting `pim_xxxxxxxx` once shown — it's not redisplayed.
2. Open that key's **Settings** and configure:

   | Restriction              | Value for KON-managed deploy                              | Value for self-host                                        |
   | ------------------------ | --------------------------------------------------------- | ---------------------------------------------------------- |
   | **Allowed origins**      | `https://id.kon.xyz` + `http://localhost:5175` (dev)      | `https://id.<your-domain>` + `http://localhost:5175` (dev) |
   | **Allowed chain IDs**    | `8453` (Base mainnet), `84532` (Base Sepolia for staging) | Same                                                       |
   | **Rate limit (req/min)** | `60` (covers a busy ETHTokyo session)                     | tune to your traffic                                       |

3. Pimlico's **Sponsorship Policies** can stay empty when you use Coinbase paymaster (next step). If you'd rather have Pimlico sponsor gas, create a policy with the same allowlist as the Coinbase one in Step 2 and set its id as `VITE_PIMLICO_SPONSORSHIP_POLICY_ID`.

Origin restriction is the load-bearing rule. Pimlico verifies the `Origin` header on incoming requests against this list and returns 403 if it doesn't match. Browser-based callers from any other origin (an attacker's page, a `.limo` mirror with a different rpId, a malicious extension) get rejected before the key is honored.

### Step 2: Coinbase Developer Platform (paymaster, preferred on Base)

Coinbase paymaster on Base mainnet is heavily subsidized — Stage 1 ETHTokyo-scale traffic stays free for KON-managed deploys, and self-host operators with a fresh CDP project also get the initial credit.

In the CDP portal ([portal.cdp.coinbase.com](https://portal.cdp.coinbase.com)):

1. **Create Project** → name `kon-mainnet` (or your domain). Note the project id.
2. Open **Paymaster** tab → copy the API key (UUID-shaped). This is `VITE_CDP_API_KEY`.
3. Configure the paymaster's allowlist (mandatory before going live):

   | Setting               | Value                                                                                                                       |
   | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
   | **Allowed Contracts** | `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` (ENS Registry), `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63` (Public Resolver) |
   | **Allowed Selectors** | `0x06ab5923` (setSubnodeOwner), `0x304e6ade` (setContenthash), `0xa22cb465` (setText)                                       |
   | **Allowed Origins**   | `https://id.kon.xyz` + `http://localhost:5175` (dev) — or `https://id.<your-domain>` for self-host                          |
   | **Active Chains**     | `8453` (Base mainnet) + `84532` (Base Sepolia)                                                                              |

4. Set spending caps:

   | Setting                                | Value                                                                                                 |
   | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
   | **Global Maximum USD**                 | `100` (Stage 1 budget; bump as the deployment grows)                                                  |
   | **Global Maximum Number of UserOps**   | `1000` (loose ceiling; USD cap is the binding constraint)                                             |
   | **Global Reset Interval**              | Monthly                                                                                               |
   | **Per User Maximum USD**               | `5`                                                                                                   |
   | **Per User Maximum Number of UserOps** | `50`                                                                                                  |
   | **Per User Reset Interval**            | Daily (so an attacker can't drain the per-user cap once and stay disabled — every day brings a reset) |

   Monthly Global vs Daily Per-User is intentional: the Global cap aligns with billing cycles and your USD budget; the Per-User cap is the abuse ceiling and wants tighter resets.

5. Set up **email alerts** at 50% and 90% of the Global USD cap — Notifications tab.

### Step 3: Set env at build time

`apps/account/.env.local` (gitignored — never committed):

```bash
# Bundler — required
VITE_PIMLICO_API_KEY=pim_xxxxxxxxxxxxxxxxxx

# Paymaster — pick ONE of the two below:
#   Coinbase (preferred on Base; uses your CDP credit):
VITE_CDP_API_KEY=<UUID from CDP dashboard>
#   OR Pimlico (fallback; uses Pimlico's free tier then $0.50/1K):
VITE_PIMLICO_SPONSORSHIP_POLICY_ID=
```

`chains.ts` auto-detects which paymaster to wire based on which env is present. Coinbase wins when both are set. For CI / production builds, supply these via your CI's secrets store (Fleek build env vars, GitHub Actions secrets, etc.). The build artifact contains the key string literals but, per Steps 1 + 2, the keys are harmless without the matching origin + allowlist + spending caps on each vendor's side.

### Operating cost reality check

For a Stage 1 ETHTokyo-scale deployment (~50 organizers × ~10 publishes each = 500 UserOps):

- **Pimlico bundler**: 500 ops / 100K free tier ≈ free
- **Coinbase paymaster**: ~$50-100 of gas, fully covered by the $100 CDP credit
- **Total KON-managed Stage 1 cost**: $6/mo VPS, no other line items

If the deployment outgrows the Coinbase credit, the same allowlist + spending caps survive a switch to Pimlico paymaster — set `VITE_PIMLICO_SPONSORSHIP_POLICY_ID` and clear `VITE_CDP_API_KEY`, the wallet picks the new path on next build with no code change.

### Optional: serverless proxy (advanced, usually unnecessary)

If you want to keep the keys entirely out of the bundle, run a serverless proxy:

```
browser → wallet origin's /paymaster-proxy endpoint → CDP / Pimlico API
              (proxy adds the API key server-side; browser never sees it)
```

This requires:

- A Cloudflare Worker (or Vercel function, or whatever) at e.g. `pm.id.<DOMAIN>/`
- The wallet bundle calls the proxy URL instead of `api.pimlico.io` / `api.developer.coinbase.com` directly
- The proxy holds the keys in its env, forwards to the vendor, returns the response

When to bother: only if the threat model includes "an attacker uses the bundled key for non-KON operations despite restrictions." With the dashboard restrictions in Steps 1 + 2, that scenario doesn't exist in practice — the keys have no use outside KON. The proxy reintroduces a server dependency the v2 architecture deliberately avoids, so skip it for Stage 1 / 2.

### Cost reality check

Pimlico's free tier covers ~100K UserOps/mo. ETHTokyo-scale events (50-100 attendees × 5-10 ops/attendee) stay well under this. If you go viral, switch to a paid tier (~$0.50 per 1K UserOps at the time of writing) or self-host an [Alto](https://github.com/pimlicolabs/alto) bundler.

### 3. Build + publish

```bash
# From the KON repo root:
bun --filter=@konxyz/account run build

# Pin apps/account/dist/ to your IPFS host of choice.
# Fleek example:
fleek storage upload apps/account/dist
# → CID: bafy...

# Or with w3up:
w3 up apps/account/dist
# → CID: bafy...
```

### 4. Wire DNS + ENS

```
# DNSLink — Fleek / 4everland gateways serve from this
_dnslink.id.<DOMAIN>    TXT   "dnslink=/ipfs/<CID>"

# ENS contenthash — for .limo gateway fallback + future DNS-ENS clients
# Set via viem or app.ens.domains UI under your subname's text records
```

Verification:

```bash
# Should resolve to your bundle's index.html
curl -L https://id.<DOMAIN>/

# Should also work via the .limo gateway (relies on ENS contenthash)
curl -L https://id-<DOMAIN-with-dashes>.limo/
```

### 5. Point your apps at the new wallet origin

In each KON app's `manifest.source.json`:

```jsonc
{
  "app": { "id": "matsuri.myfestival.com", ... },
  "deployment": {
    "wallet_origin": "https://id.myfestival.com",
    // ... gun_peers, ipfs_gateways, ens_domain
  },
  ...
}
```

Republish the app (`bun run publish:app --app matsuri --publish`) and the new entry directs the wallet popup at your origin. The `@konxyz/account-sdk` consumer code reads `walletOrigin` from the resolved deployment — no app code changes.

## Recovery model (read carefully)

WebAuthn passkeys are credential-locked to the device + RP. A user who loses their device cannot retrieve the passkey by re-creating an account at the same RP — the new passkey is a different credential. Without a recovery path, losing the device means losing the Safe.

KON's wallet enforces **backup owner during onboarding**:

- Onboarding flow asks for a second EOA address (the user's Ledger, MetaMask, a friend's wallet, an institutional cold storage, etc.) before the Safe is deployed.
- The Safe is deployed with `threshold: 1` and `owners: [passkey-signer, backup-EOA]`.
- If the passkey is lost, the backup owner can sign a Safe transaction to add a new passkey owner and remove the lost one.

This is the **only** unrecoverable-state mitigation today. Stage 3+ may add Safe Recovery module support (time-locked recovery via guardians), but for Stage 1 the backup owner is mandatory.

The wallet UI surfaces this in the onboarding flow and refuses to deploy a Safe without a backup owner. **Do not patch this out** when self-hosting; users will lose funds.

## Same-address-across-chains

The Safe `{Core}` v1.4.1 deployment uses CREATE2 with a deterministic salt derived from the owner set + threshold, so the same passkey + backup pair yields **the same Safe address on every supported chain**. This is intentional — UX is much simpler when "my wallet address" is one thing across Base, Optimism, Arbitrum, etc.

`apps/account/src/safe.ts` `predictSafeAddress()` is the implementation; verify against Safe's official `Safe{Core} SDK` if you fork.

## Cross-origin postMessage allowlist

The wallet popup must only accept `kon.signIn` / `kon.signTx` requests from origins it trusts. Otherwise any third-party site could open the popup and trick the user into signing.

Configured at `apps/account/src/origin-allowlist.ts`. The default allowlist is `*.kon.xyz` (KON-managed apps) plus `localhost:*` (dev). Self-host deployments override this with `*.your-domain.com` or an explicit list. **Do not leave the allowlist permissive**; an attacker who tricks a user into signing arbitrary calldata can drain the Safe.

## Multi-region

Unlike the relay stack, **the wallet origin should NOT be regionally distributed**. WebAuthn passkeys are origin-bound, and regional DNS that returns different content for the same origin (e.g. GeoDNS pointing at different bundle CIDs) breaks the same-origin-policy assumption WebAuthn relies on.

Pick one global IPFS bundle (DNSLink to a single CID) and let IPFS gateways geo-cache it for performance. This is fine because:

- The wallet bundle is small (~410 KB gz today).
- All TLS sessions hit the same content hash; cache hit ratio is ~100%.
- Latency to the wallet origin matters less than latency to the GUN relay (chat) — wallet popup is a few-second interaction at most.

If you absolutely need regional wallet PoPs, use anycast hosting (Fleek anycast tier, Cloudflare Pages with cache-everything) rather than DNS-level routing.

## Troubleshooting

**Passkey creation fails with "RP_ID mismatch" or "InvalidStateError".**

- The current page's hostname doesn't match what the browser expects. Usually means you're hitting the bundle via the wrong URL (e.g. `id-myfestival-com.limo` instead of `id.myfestival.com`). Always test passkey flows on the canonical hostname.
- Subdomain depth matters: a passkey created at `id.myfestival.com` can also be used on `*.myfestival.com` (single-eTLD up the chain), but the reverse isn't true.

**Safe address is different across chains.**

- The owner set or threshold differs between deploys. CREATE2 salt is a hash of `(owners, threshold, fallbackHandler, ...)`; any difference produces a different address. Re-deploy with the canonical set.
- You're on Base Sepolia (testnet) when you expected Base Mainnet. Chain ID enters the address via the proxy factory init code; addresses differ across networks even with identical owner sets only when using a chain-specific factory. Verify the factory address you used.

**`UserOperation` reverts on first transaction with `Bundler error: paymaster rejected`.**

- Pimlico sponsorship policy ID is wrong or expired. Check the policy in the Pimlico dashboard; new policies need 30-60 seconds to propagate.
- The first UserOp triggers Safe deployment + the actual call atomically. If your sponsorship policy excludes deployment (gas limit too low), it will reject. Set the policy's gas cap to ≥1,500,000 for first-tx safety.

**Apps can't open the wallet popup ("popup blocked").**

- Most browsers require popups to be opened in response to a user gesture (click, keypress). The wallet SDK's `openSignIn()` must be called from a click handler, not on page load.
- The `@konxyz/account-sdk` already does this correctly when used from `SignInPanel.tsx` — verify your custom UI isn't calling it on mount.

**Cross-origin postMessage is silently dropped.**

- Your `origin-allowlist.ts` doesn't include the calling app's origin. Open the wallet popup and check the browser console: blocked origins log a warning. Add `*.your-domain.com` (or the specific origin) to the allowlist and rebuild.

## Self-host operator's promise

This bundle, plus your own IPFS pin, plus your own DNS + DNSSEC + ENS DNS-import, plus your own Pimlico account, gives you a fully sovereign wallet layer. The KON team, the KON project, and `id.kon.xyz` are all removable without breaking your users' Safe accounts (they live on Base, addressed by their passkey hash, fully recoverable via the backup owner regardless of what happens to the wallet bundle host).

Stage 3+ UCAN delegation may bridge identities across self-hosted wallet origins. Until then, each origin's passkey + Safe pair is independent.
