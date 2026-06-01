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
   Pimlico bundler + paymaster          Pimlico bundler + paymaster
   (KON-managed sponsorship policy)     (your sponsorship policy + API key)
```

**Crucial consequence**: a user with a passkey on `id.kon.xyz` and a passkey on `id.myfestival.com` has **two different Safe smart accounts**. WebAuthn passkeys are bound to the Relying Party origin; there is no cross-RP credential. This is a deliberate trade-off — sovereignty over universal identity. Stage 3+ may bridge identities across self-hosted deployments via UCAN-style delegation, but at the wallet layer the two accounts are independent.

## Prerequisites

|                                        | Required             | Notes                                                                                                                                                                                              |
| -------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A domain with DNSSEC enabled           | ✅                   | Needed for DNS-ENS contenthash resolution. Most registrars support it (Gandi, Cloudflare Registrar, Namecheap, Porkbun).                                                                           |
| ENS DNS-import done                    | ✅                   | One-time setup at app.ens.domains/dns/`yourdomain.com`.                                                                                                                                            |
| A static hosting target                | ✅                   | Fleek / 4everland / a Kubo node behind a custom-domain gateway. Any host that can serve a static SPA over HTTPS with the cert under your hostname works.                                           |
| TLS cert for `id.<your-domain>`        | ✅                   | Required for WebAuthn to issue credentials. Self-signed certs don't work — browsers refuse passkey creation on untrusted origins. Most IPFS hosts (Fleek, 4everland) issue the cert automatically. |
| A Pimlico API key + sponsorship policy | ✅                   | Free tier covers ~100K UserOps/mo at the time of writing. Sign up at dashboard.pimlico.io.                                                                                                         |
| Backup owner UX understood             | Strongly recommended | Passkey loss is unrecoverable without a backup owner. See "Recovery model" below.                                                                                                                  |

## How the rpId is derived

`apps/account/` deliberately does **not** hardcode `id.kon.xyz` anywhere. The passkey RP id is read from `window.location.hostname` at runtime, so:

| Deployed at          | `rpId` becomes         |
| -------------------- | ---------------------- |
| `id.kon.xyz`         | `id.kon.xyz` (default) |
| `id.myfestival.com`  | `id.myfestival.com`    |
| `wallet.example.org` | `wallet.example.org`   |

You don't fork the codebase — you just deploy the same bundle to your hostname.

## Hosting: IPFS, not VPS

The wallet origin is a **static SPA** — no server, no Node process, no persistent state. The only requirement is "serve `apps/account/dist/` over HTTPS at `id.<DOMAIN>`". That fits an IPFS-hosted static site perfectly and is the recommended path for both the KON-managed default (`id.kon.xyz`) and self-host deployments.

| Hosting choice                                         | TLS for custom domain          | Cost           | Self-host operator fit                                                                        | Notes                                                                                               |
| ------------------------------------------------------ | ------------------------------ | -------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Fleek** ([fleek.xyz](https://fleek.xyz))             | ✅ auto                        | $0 (free tier) | ◎ **recommended default**                                                                     | Add domain in dashboard, paste CID, done. Custom-domain Let's Encrypt issued automatically.         |
| **4everland** ([4everland.org](https://4everland.org)) | ✅ auto                        | $0 (free tier) | ◎ EU + APAC PoPs if your audience is regional                                                 | Same DX as Fleek.                                                                                   |
| Your own Caddy + Kubo (VPS)                            | ✅ Let's Encrypt manual        | $5-10/mo       | ○ only if you already operate the relay VPS and want to consolidate                           | Reuses the relay's Caddy. Doesn't simplify anything; pick only if you want one host for everything. |
| `.limo` gateway fallback                               | ✅ (`.limo`'s cert, not yours) | $0             | ❌ rpId becomes `id-<DOMAIN-with-dashes>.limo` — passkeys created at `id.<DOMAIN>` don't work | Useful as a degraded-mode fallback only.                                                            |
| Cloudflare Pages                                       | ✅ auto                        | $0             | △ reintroduces CF dependency the v2 architecture deliberately removes                         | Acceptable if you're already CF-deep and don't care.                                                |

**A VPS is not part of the wallet's deploy story.** The relay VPS documented in [`docs/self-host-relay.md`](self-host-relay.md) hosts WebSocket + libp2p TCP processes and is completely separate from any static layer. `kon.xyz`, `id.kon.xyz`, `my.kon.xyz`, and every `<app>.kon.xyz` all live on IPFS in the default deployment.

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

# Pin via your own relay-ipfs /api/pin (recommended if you also run the
# relay stack):
curl -X POST https://gateway.<DOMAIN>/api/pin \
  -H 'content-type: application/octet-stream' \
  --data-binary @apps/account/dist/index.html
# → returns the index.html CID; repeat for the rest of dist/, or use the
# directory-upload path below

# OR use Fleek's dashboard / CLI directly:
fleek storage add apps/account/dist
# → CID for the dist/ directory root

# OR use w3up for the entire directory in one go:
w3 up apps/account/dist
```

For Fleek, the typical flow is: connect your GitHub repo → Fleek auto-builds on push → automatic CID + DNSLink update. After the first manual setup, deploys are git-push.

### 4. Wire DNS + ENS

```bash
# DNSLink — the IPFS gateway uses this to map id.<DOMAIN> to the CID
_dnslink.id.<DOMAIN>  TXT   "dnslink=/ipfs/<CID>"

# ENS contenthash for the .limo fallback + DNS-ENS resolvers (use viem
# or the app.ens.domains UI)
id.<DOMAIN>  contenthash = ipfs://<CID>
```

Wait 1-2 minutes for DNS propagation, then verify:

```bash
curl -L https://id.<DOMAIN>/        # should return the wallet bundle's index.html
```

The TLS cert is issued automatically by Fleek / 4everland on first request. You don't run an ACME client yourself.

## Pimlico API key handling

The wallet bundle is **a static client-side SPA shipped to every user's browser**. Any string in the bundle is readable by anyone who opens devtools. There is no "hide" — only "restrict so the key is useless to anyone but legitimate KON traffic."

The defense-in-depth model is:

```
   bundle ships key → key restricted in Pimlico dashboard
                  └→ sponsorship policy restricts what UserOps the key sponsors
                       └→ paymaster rejects calls not on the policy allowlist
```

Even if a third party extracts the key, they can only sponsor operations that match the policy, called from an allowed origin. Drains aren't possible; the worst case is they consume your free-tier quota with no-op calls (which the rate-limit + per-origin throttle in Pimlico catches anyway).

### Step 1: Restrict the API key in Pimlico

In the Pimlico dashboard ([dashboard.pimlico.io](https://dashboard.pimlico.io)), open the key's settings and configure:

| Restriction              | Value for KON-managed deploy                              | Value for self-host        |
| ------------------------ | --------------------------------------------------------- | -------------------------- |
| **Allowed origins**      | `https://id.kon.xyz`                                      | `https://id.<your-domain>` |
| **Allowed chain IDs**    | `8453` (Base mainnet), `84532` (Base Sepolia for staging) | Same                       |
| **Rate limit (req/min)** | `60` (covers a busy ETHTokyo session)                     | tune to your traffic       |

Origin restriction is the load-bearing rule. Pimlico verifies the `Origin` header on incoming requests against this list and returns 403 if it doesn't match. Browser-based callers from any other origin (an attacker's page, a `.limo` mirror with a different rpId, a malicious extension) get rejected before the key is honored.

### Step 2: Create a tight sponsorship policy

Sponsorship policy controls which UserOps the paymaster will actually pay gas for. In the Pimlico dashboard, create a policy with:

| Rule                           | Value                                                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Allowed contract targets**   | The exact addresses the wallet calls — typically just the ENS Registry (`0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`) and Public Resolver (`0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63`). Add more as your app set grows. |
| **Allowed function selectors** | `setContenthash`, `setSubnodeOwner`, `setText` — the exact methods Phase 8 publish uses. Selectors are computed at policy creation time.                                                                                  |
| **Max gas per UserOp**         | `1,500,000` — covers Safe deployment + the actual call atomically. Tighter caps reject first-tx-deploys.                                                                                                                  |
| **Daily UserOp count cap**     | `10,000` — ETHTokyo-scale buffer. Lower for self-host with small user counts.                                                                                                                                             |

The policy is what makes the bundle-exposed key safe in practice. An attacker who extracts the key cannot sponsor anything outside this allowlist — no random ERC-20 transfers, no arbitrary contract calls, nothing.

### Step 3: Set env at build time

`apps/account/.env` (gitignored):

```bash
VITE_PIMLICO_API_KEY=pim_xxxxxxxxxxxxxxxxxx
VITE_PIMLICO_SPONSORSHIP_POLICY_ID=sp_xxxxxxxxxxxx
```

For CI / production builds, supply these via your CI's secrets store (Fleek build env vars, GitHub Actions secrets, etc.). The build artifact contains the key string literal but, per Steps 1 + 2, the key is harmless without the matching origin + policy on Pimlico's side.

### Optional: serverless proxy (advanced, usually unnecessary)

If you want to keep the key entirely out of the bundle, run a serverless proxy:

```
browser → wallet origin's /pimlico-proxy endpoint → Pimlico API
              (proxy adds the API key server-side; browser never sees it)
```

This requires:

- A Cloudflare Worker (or Vercel function, or whatever) at e.g. `pimlico.id.<DOMAIN>/`
- The wallet bundle calls the proxy URL instead of `api.pimlico.io` directly
- The proxy holds the key in its env, forwards to Pimlico, returns the response

When to bother: only if the threat model includes "an attacker uses the bundled key for non-KON operations despite restrictions." With the origin + policy restrictions in Steps 1 + 2, that scenario doesn't exist in practice — the key has no use outside KON. The proxy reintroduces a server dependency the v2 architecture deliberately avoids, so skip it for Stage 1 / 2.

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
