# Phase 8 Smoke Test — End-to-End Publish Flow

Verify the Phase 8 dashboard publish flow works end-to-end against a real Pimlico bundler + Coinbase paymaster from your local machine, **before** deploying anything to a VPS. This catches integration issues (rpId mismatch, paymaster allowlist drift, gas-cap surprises) where they're cheapest to fix.

**Three levels.** Pick based on what you want to verify:

| Level               | What it tests                                                                      | Prereqs                                             |
| ------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------- |
| **L1 — build**      | Code compiles, units pass, no integration                                          | clean clone + bun                                   |
| **L2 — local e2e**  | Real wallet popup → real bundler → real paymaster, against a locally-running relay | L1 + Pimlico key + CDP key + passkey-capable device |
| **L3 — production** | Same as L2 but against the deployed `kon.xyz` infra                                | L2 passes + VPS deploy done + DNS configured        |

Walk top-to-bottom. If a step fails, stop and root-cause; don't skip ahead.

## Prereqs (5 min)

```bash
git clone https://github.com/buildwithkon/kon.git
cd kon
git checkout v2
bun install
```

For L2+:

- Pimlico API key from https://dashboard.pimlico.io (see `docs/self-host-wallet.md` Step 1 for dashboard config)
- Coinbase CDP API key from https://portal.cdp.coinbase.com (see `docs/self-host-wallet.md` Step 2)
- A passkey-capable device (iOS 16+, macOS 13+ with Touch ID, Android 13+, Windows 11 + Windows Hello)
- A modern browser (Chrome 120+ / Safari 17+ / Firefox 120+)

## L1 — Build verification (1 min)

```bash
bun run lint               # oxlint via vp — 0 errors
bun run format:check       # oxfmt via vp — clean
bun run typecheck:v2       # runtime-core + schemas typecheck
bun run test               # vp test run — should see 109 passing
bun --filter=@konxyz/runtime run build
bun --filter=@konxyz/account run build
bun --filter=@konxyz/dashboard run build
```

✓ Expected: each command exits 0. The test count locks down the public API of `runtime-core`, `dashboard/state`, `dashboard/deployment`, `account/chains`, and `relay-ipfs/lib`. A regression in any of those caught here saves an hour of dashboard-side debugging later.

## L2 — Local end-to-end (15-30 min)

The flow you're verifying:

```
dashboard (localhost:5177)
   ↓ Sign in
account popup (localhost:5175)
   ↓ Passkey created at rpId=localhost
dashboard
   ↓ Type subname → Claim
account popup
   ↓ permissionless builds Safe + UserOp
   ↓ Coinbase paymaster fills paymasterAndData
   ↓ Pimlico bundler accepts → returns userOpHash
dashboard
   ✓ Card appears with userOpHash
```

### L2.1 — Vendor dashboard prep (10 min)

Follow `docs/self-host-wallet.md` **"Bundler + Paymaster setup"** section:

- Pimlico: API key → restrict origins to **`http://localhost:5175`** (NOT id.kon.xyz yet — we're testing locally). Allowed chains 8453 + 84532. Rate 60/min.
- Coinbase CDP: paymaster project → API key → allowlist:
  - Contracts: `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`, `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63`
  - Selectors: `0x06ab5923`, `0x304e6ade`, `0xa22cb465`
  - **Origins**: `http://localhost:5175`
  - Chains: 8453 + 84532
  - Global cap: $10 (tighter for testing)
  - Per-user cap: $1 (Daily reset)

### L2.2 — Wire env (1 min)

```bash
# Account-side env: the wallet popup uses these
cp apps/account/.env.example apps/account/.env.local
# Edit apps/account/.env.local:
VITE_PIMLICO_API_KEY=pim_xxxxxxxxxxxxxxxxxx
VITE_CDP_API_KEY=<UUID from CDP>
VITE_PIMLICO_SPONSORSHIP_POLICY_ID=          # empty when using Coinbase
```

```bash
# Dashboard-side env: point the dashboard at the locally-running relay
cp apps/dashboard/.env.example apps/dashboard/.env.local
# Edit apps/dashboard/.env.local:
VITE_DEV_WALLET_ORIGIN=http://localhost:5175
VITE_DEV_PIN_ENDPOINT=http://localhost:8081/api/pin
```

The dashboard's `resolveDashboardDeployment()` honors these at build time so http://localhost:5177 stops trying to reach the (non-existent) production `gateway.kon.xyz/api/pin` and instead hits your local relay-ipfs.

### L2.3 — Boot three local dev servers (1 min)

Three terminals (or one tmux session):

```bash
# Terminal 1 — wallet origin
bun @account:dev              # → http://localhost:5175

# Terminal 2 — dashboard
bun @dashboard:dev            # → http://localhost:5177

# Terminal 3 — IPFS relay (for /api/pin)
KON_RELAY_HTTP_PORT=8081 bun @relay-ipfs:start
# → libp2p :4001 (won't bind if 4001 is busy; that's fine, gateway still serves)
# → HTTP gateway + /api/pin on http://0.0.0.0:8081
```

Optional: skip relay-ipfs if you don't want to exercise /api/pin (the Claim step doesn't need it; only the Publish step does).

✓ Expected:

- :5175 shows the wallet origin's "Sign in" landing.
- :5177 shows the dashboard's sign-in panel.
- :8081 logs `libp2p ready` + `HTTP gateway on http://0.0.0.0:8081`.

### L2.4 — Sign in + create passkey (2 min)

In an **incognito / private** browser window (matters — your existing browser profile may have a stale passkey):

1. Open http://localhost:5177
2. Click **Sign in with KON wallet**.
3. Popup opens at http://localhost:5175.
4. Click **Create passkey** (or whatever the button label is).
5. Browser prompts for biometric/PIN → confirm.
6. Popup shows the derived Safe address; close.
7. Dashboard now shows the address in the top bar.

✓ Expected: a passkey is created with `rpId=localhost`. Devtools → Application → IndexedDB shows the WebAuthn credential. Dashboard's header shows `0x… · me`.

❌ If you see "Popup blocked" — the popup must be opened from an actual user click, not on-load. The Sign in button is wired correctly; check whether your browser has a popup blocker bumping it on the first click.

### L2.5 — Reserved subname verification (1 min)

In the "Create a new app" input:

| Type        | Expected                                   |
| ----------- | ------------------------------------------ |
| `id`        | ❌ reserved subname error (also too short) |
| `my`        | ❌ reserved + too short                    |
| `admin`     | ❌ reserved subname error                  |
| `login`     | ❌ reserved                                |
| `a`         | ❌ name too short (≥3 chars)               |
| `--ab`      | ❌ leading hyphen                          |
| `smoketest` | ✓ Claim button enabled                     |

These checks are pure-function (no network); each input is run through `validateSubname()` from `@konxyz/runtime-core`. The tests in `packages/runtime-core/src/reserved-subnames.test.ts` already lock this down — this step is a UI sanity check.

### L2.6 — Claim a subname (5 min)

1. Type `smoketest` (or your test name).
2. Click **Claim**.
3. Wallet popup opens at http://localhost:5175 with the description:
   ```
   Claim smoketest.kon.xyz
   ```
4. The popup should show:
   - chainId: 8453 (Base mainnet)
   - to: `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` (ENS Registry)
   - data: starts with `0x06ab5923…` (setSubnodeOwner selector)
5. Click **Approve**.
6. Browser prompts for biometric/PIN to sign.
7. Wait ~5-10 seconds for the bundler to return.
8. Dashboard's create-app card shows:
   ```
   ✓ Claimed. tx: 0x...
   ```

✓ Expected: a real `userOpHash` (0x-prefixed 32-byte hex). Open the Pimlico dashboard → UserOps → see the request log entry, status "succeeded" (or "pending" then "succeeded" within ~30s). Open CDP dashboard → Sponsorship → balance dropped by ~$0.01-0.05.

❌ Common failure modes for L2.6:

| Symptom                           | Cause                                                                                                                                    | Fix                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `passkey_unavailable`             | rpId mismatch (e.g. you visited `127.0.0.1:5177` instead of `localhost:5177` so the popup's rpId doesn't match the dashboard's hostname) | Always use `localhost`, not `127.0.0.1`                                           |
| `paymaster_rejected`              | CDP allowlist missing the selector or origin                                                                                             | Re-check CDP dashboard (the actual rejected RPC log shows which check failed)     |
| 403 from Pimlico bundler          | Allowed Origins in Pimlico dashboard doesn't include `http://localhost:5175`                                                             | Add it                                                                            |
| "Smart account deployment failed" | Gas cap too low                                                                                                                          | Bump CDP Max gas per UserOp to ≥ 1,500,000                                        |
| Wallet popup white-screens        | apps/account bundle build issue or env not in scope                                                                                      | Re-build: `bun --filter=@konxyz/account run build`, then `bun @account:dev` again |
| Dashboard hangs on "claiming…"    | Popup got closed before approval                                                                                                         | Reopen by clicking Claim again                                                    |

### L2.7 — Publish flow (requires L2.3 with relay-ipfs running)

Skip this section if you didn't start relay-ipfs (no /api/pin endpoint).

For this you need an existing app's `/admin` route. The dashboard's create-app step doesn't deploy a manifest — that's the per-app editor at `<app>.kon.xyz/admin` (apps/runtime).

For a fully local test, the runtime's `/admin` doesn't easily map to a local URL without a real DNS-resolved subname. The simplest local exercise is to call submitUserOp directly from the dashboard via devtools:

```js
// In dashboard console (http://localhost:5177)
const { encodeSetContenthash, ENS_PUBLIC_RESOLVER_ADDRESS } = await import('@konxyz/runtime-core')

// 1. Encode a setContenthash call against your smoketest subname
const calldata = encodeSetContenthash(
  'smoketest.kon.xyz',
  'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy' // any valid CID
)

// 2. Call wallet directly (no need to invoke /api/pin first since
//    we passed a CID literal above)
const { WalletSdk } = await import('@konxyz/account-sdk')
const sdk = new WalletSdk({ walletOrigin: 'http://localhost:5175' })
const result = await sdk.signTx({
  chainId: 8453,
  to: ENS_PUBLIC_RESOLVER_ADDRESS,
  data: calldata,
  description: 'smoke test setContenthash'
})
console.log('userOpHash:', result.userOpHash)
```

✓ Expected: wallet popup → confirm → real userOpHash returned. This time the function selector is `0x304e6ade` (setContenthash) instead of `0x06ab5923`.

To exercise /api/pin separately:

```bash
curl -X POST http://localhost:8081/api/pin \
  -H 'content-type: application/json' \
  --data '{"smoke":"test"}'
# → { "cid": "bafy...", "bytes": 17 }
```

The CID returned is the canonical content-address of your test bytes. Curl it back:

```bash
curl http://localhost:8081/ipfs/<that-cid>
# → {"smoke":"test"}
```

### L2.8 — Verify on-chain (5-10 min)

L2.6 returned a userOpHash. To confirm finality:

```bash
# 1. Get the underlying transaction hash from Pimlico
# In the Pimlico dashboard, click the UserOp → shows "Transaction Hash: 0x..."

# 2. Look it up on Basescan
open "https://basescan.org/tx/<that-tx-hash>"
```

✓ Expected: the tx is "Success", with the to: address matching ENS Registry, and the input matching the calldata you saw in the popup. The Logs tab shows a NewOwner event for `smoketest.kon.xyz`.

❌ If the tx reverted, look at Basescan's "Failed reason" — most common reasons are paymaster rate-limit hits or the registrar contract rejecting the claim (e.g. the subname is already owned).

## L3 — Production (after VPS deploy)

After completing `docs/eth-tokyo-checklist.md` sections 1-3 (VPS up, DNS configured, bundles pinned, Pimlico + CDP origins updated to use `id.kon.xyz` instead of `localhost:5175`):

Repeat L2.4-L2.6 but against:

- Dashboard: `https://my.kon.xyz`
- Wallet popup: `https://id.kon.xyz`
- /api/pin: `https://gateway.kon.xyz/api/pin`

Don't keep the localhost overrides — `apps/dashboard/.env.local` should be empty for production. Re-build + re-pin if needed.

The smoke test passes when L3 succeeds from a device that has never visited `id.kon.xyz` before — i.e. the WebAuthn flow handles first-time passkey creation correctly on the production rpId.

## Reporting back

If something fails, capture:

1. The exact step number (L2.5, L2.6 etc.)
2. The browser console log around the failure (devtools → Console)
3. The wallet popup console log (right-click the popup → Inspect → Console)
4. The relay-ipfs terminal output (if /api/pin involved)
5. The Pimlico + CDP dashboard log entries for the failed request

That bundle is enough to root-cause 95% of issues from chat without needing to reproduce.

## What success looks like

After a clean L2 run, you have:

- A passkey on your test device under `rpId=localhost`
- A Safe smart account deployed on Base mainnet (predictable from your passkey, so it's a real address you control)
- One on-chain `setSubnodeOwner` tx → `smoketest.kon.xyz` owned by your Safe
- Pimlico free tier consumed by ~1 UserOp
- CDP credit consumed by ~$0.01-0.05

Total cost: zero (Coinbase credit covered the gas, Pimlico free tier covered the bundler). Total time: 20-30 minutes for the first run; 5 minutes for subsequent runs once the env is in place.

After this passes, L3 (production) is mostly DNS + bundle re-pin work documented in `docs/eth-tokyo-checklist.md`.
