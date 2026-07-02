# ETHTokyo Stage 1 Launch Checklist

Pre-flight verification for the KON-managed deployment shipped at ETHTokyo 2026-09. Walk this top-to-bottom in the week before the event; each box is "verified by [person]" with a date stamp.

Audience: the operator(s) running `relay.kon.xyz`, `id.kon.xyz`, `my.kon.xyz`, `kon.xyz` apex, and 1-N `<app>.kon.xyz` apps for the event.

## 1. Pre-flight (T-7 days)

### Infrastructure

- [ ] Vultr Tokyo VPS provisioned, `kon` cloned, `cp .env.relay.example .env` done
- [ ] `.env` populated: `KON_RELAY_DOMAIN=kon.xyz`, `ACME_EMAIL=ops@kon.xyz`
- [ ] `docker compose up -d` succeeds (3 containers: relay-gun, relay-ipfs, kon-relay-caddy)
- [ ] `docker compose ps` shows all three "Up", "healthy"
- [ ] `docker compose logs relay-gun` shows "alive" heartbeat lines
- [ ] `docker compose logs relay-ipfs` shows libp2p peerId + HTTP gateway listening
- [ ] `docker compose logs caddy` shows certs issued for the configured hostnames

### DNS (Cloudflare DNS or Bunny DNS or whatever, just verify it's set)

- [ ] `relay.kon.xyz` A → VPS IP
- [ ] `gateway.kon.xyz` A → VPS IP
- [ ] `id.kon.xyz` A → VPS IP
- [ ] `my.kon.xyz` A → VPS IP
- [ ] `kon.xyz` A → VPS IP (apex)
- [ ] DNSSEC enabled on `kon.xyz` (registrar)
- [ ] ENS DNS-import done at app.ens.domains/dns/kon.xyz (one-time, post-DNSSEC)
- [ ] Each app's subname has an A record pointing at the VPS (Stage 1 scale, manual is fine)

### TLS

- [ ] `curl -L https://relay.kon.xyz/health` returns `{"ok":true,"gun":"0.2020",...}`
- [ ] `curl -L https://gateway.kon.xyz/` returns the relay-ipfs HTML index page
- [ ] `curl -L https://id.kon.xyz/` returns the apps/account bundle's index.html (after step 2)
- [ ] `curl -L https://my.kon.xyz/` returns the apps/dashboard bundle's index.html (after step 2)
- [ ] No cert errors in any of the above (`SSL certificate problem` = blocker)
- [ ] `curl https://gateway.kon.xyz/ipfs/<a-known-cid>` resolves a public IPFS file

## 2. Static SPA pin + deploy (T-7 to T-3 days)

### Build + pin

- [ ] `bun --filter=@konxyz/account run build` succeeds locally
- [ ] `bun run publish:account --upload` succeeds; note the CID
- [ ] `bun --filter=@konxyz/dashboard run build` succeeds
- [ ] `bun run publish:dashboard --upload` succeeds; note the CID
- [ ] `bun --filter=@konxyz/site run build` succeeds
- [ ] `bun run publish:site --upload` succeeds; note the CID
- [ ] `bun --filter=@konxyz/runtime run build` succeeds
- [ ] `bun run publish:runtime --upload` succeeds; note the CID
- [ ] `bun run publish:plugin --all --upload` succeeds; note all CIDs

### Deploy + serve

- [ ] On VPS, `.env` updated with `KON_ACCOUNT_CID=`, `KON_DASHBOARD_CID=`, `KON_SITE_CID=` from above
- [ ] `docker compose up -d caddy` reloads with new CIDs
- [ ] Visit `https://id.kon.xyz/` in incognito → wallet bundle loads
- [ ] Visit `https://my.kon.xyz/` in incognito → dashboard bundle loads
- [ ] Visit `https://kon.xyz/` → site bundle loads
- [ ] All three load without console errors

## 3. Wallet env (Pimlico + Coinbase) (T-7 days)

### Pimlico

- [ ] Account created at https://dashboard.pimlico.io
- [ ] API key created, `pim_xxx` saved
- [ ] Allowed Origins set: `https://id.kon.xyz`, `http://localhost:5175`
- [ ] Allowed Chain IDs: 8453, 84532
- [ ] Rate limit: 60 req/min
- [ ] No active Pimlico sponsorship policy (Coinbase paymaster is default)

### Coinbase Developer Platform (paymaster)

- [ ] Project created at https://portal.cdp.coinbase.com
- [ ] Paymaster API key obtained, UUID saved
- [ ] Allowed Contracts: ENS Registry (`0x000…2e1e`), Public Resolver (`0x231b…E63`)
- [ ] Allowed Selectors: `0x06ab5923` (setSubnodeOwner), `0x304e6ade` (setContenthash), `0xa22cb465` (setText)
- [ ] Allowed Origins: `https://id.kon.xyz`, `http://localhost:5175`
- [ ] Active Chains: 8453, 84532
- [ ] Global Max USD: $100
- [ ] Global Max UserOps: 1000
- [ ] Global Reset Interval: Monthly
- [ ] Per User Max USD: $5
- [ ] Per User Max UserOps: 50
- [ ] Per User Reset Interval: Daily
- [ ] Email alerts configured at 50% + 90% of Global USD
- [ ] $100 credit balance visible in CDP dashboard

### Local env (for the build that gets pinned to id.kon.xyz)

- [ ] `apps/account/.env.local` exists and contains:
  - [ ] `VITE_PIMLICO_API_KEY=pim_…`
  - [ ] `VITE_CDP_API_KEY=<UUID>`
  - [ ] `VITE_PIMLICO_SPONSORSHIP_POLICY_ID=` (empty)
- [ ] Re-run `bun run publish:account --upload` with the env in scope; verify the bundle has the keys
- [ ] Re-deploy the new account CID (step 2 → 3)

## 4. Smoke test (T-3 days)

End-to-end Phase 8 publish flow against the live deployment:

- [ ] Open https://my.kon.xyz/ in a fresh incognito window on a passkey-capable device
- [ ] Sign in → wallet popup opens at id.kon.xyz (NOT id.kon.xyz.limo or a Caddy error page)
- [ ] Create passkey when prompted; verify Safe address shown
- [ ] Verify the Safe address is the same on a second incognito window
- [ ] Type a test subname (e.g. `smoketest`)
- [ ] Reserved subname check: type `id`, `my`, `admin` → these reject with "reserved"
- [ ] Click "Claim" on `smoketest`
- [ ] Wallet popup proposes `setSubnodeOwner(namehash("kon.xyz"), keccak("smoketest"), <your-Safe>)`
- [ ] Confirm popup, get userOpHash back
- [ ] Check Pimlico dashboard → UserOp visible in the request log
- [ ] Check CDP dashboard → sponsorship deducted by ~$0.01-0.10 from credit balance
- [ ] Visit https://smoketest.kon.xyz/admin (no manifest yet → expected blank or 404)

Then test publish:

- [ ] In any KON app's editor (e.g. https://ethtokyo.kon.xyz/admin), edit the manifest
- [ ] Click Publish → uploads to `gateway.kon.xyz/api/pin` (relay-ipfs)
- [ ] Wallet popup proposes `setContenthash(namehash("ethtokyo.kon.xyz"), ipfs://...)`
- [ ] Confirm, get userOpHash
- [ ] Refresh `https://ethtokyo.kon.xyz/` → new manifest in effect

If any of these fail, root-cause before T-2 days. Most common Stage 1 issues:

- **Wallet popup blocked**: must be triggered by a user gesture (click handler).
- **`paymaster_rejected`**: CDP allowlist missing the contract/selector.
- **`passkey_unavailable`**: `id.kon.xyz` not loaded over HTTPS, or rpId mismatch.
- **`429` on /api/pin**: per-IP rate limit; rare in normal use, common in test loops.

## 5. Operations dashboard (T-3 days)

- [ ] Pimlico dashboard Notifications: 50% + 90% USD alerts active
- [ ] CDP dashboard: same alerts
- [ ] UptimeRobot (or equivalent) monitoring:
  - [ ] https://relay.kon.xyz/health every 5 min
  - [ ] https://gateway.kon.xyz/ every 5 min
  - [ ] https://id.kon.xyz/ every 5 min
- [ ] Slack/Discord webhook configured to receive UptimeRobot alerts
- [ ] VPS disk-space alert (Vultr's own monitoring or `df`-based cron)
- [ ] Backup cron from `docs/self-host-relay.md` "Volumes, backups, restore" running nightly

## 6. Reference deployment ("ethtokyo" app) (T-2 days)

The KON team's own demo app, used as the Stage 1 vehicle:

- [ ] `apps/ethtokyo/manifest.source.json` reflects the actual event schedule + plugins
- [ ] `bun run publish:app --app ethtokyo --publish` runs cleanly, ENS contenthash updated
- [ ] https://ethtokyo.kon.xyz/ resolves and renders the manifest correctly
- [ ] /admin route works (apps/runtime's editor visible)
- [ ] Forum chat plugin connects to relay-gun + receives a test message
- [ ] All other plugins render correctly (badge, ical, profile-card, etc.)

## 7. Communication (T-1 day)

- [ ] Sign-up page for ETHTokyo attendees published
- [ ] Telegram / Element fallback chat link in case GUN relay drops
- [ ] Brief organizer guide ("how to create your KON app for ETHTokyo") shared with intended creators
- [ ] On-call rotation set: who responds to UptimeRobot alerts during the event

## 8. Event day (T-0)

- [ ] Tail logs on a second device: `ssh root@<vps> 'docker compose logs -f'`
- [ ] Watch Pimlico + CDP dashboards for sudden cost spikes
- [ ] Keep a `git revert <last-commit>` cheat sheet handy in case a Phase 8 regression breaks publish during the event

## Post-event cleanup (T+1 day)

- [ ] Snapshot the relay-ipfs blockstore (everything organizers pinned during the event — keep at least 30 days)
- [ ] Snapshot the gun-data volume (chat history)
- [ ] Diff Pimlico spend vs CDP credit consumption → file Stage 2 budget reality
- [ ] Postmortem note: any flow that surprised operators / users, file as a Phase 9 issue

## Failure modes + rollback plan

| Symptom                                     | Likely cause                              | Rollback step                                                            |
| ------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| Wallet popup white-screens                  | Bad apps/account build                    | Revert KON_ACCOUNT_CID to previous in .env, `docker compose up -d caddy` |
| Publish always returns `paymaster_rejected` | CDP allowlist drift                       | Re-check CDP allowed contracts/selectors, no code change                 |
| `/api/pin` returns 429 storm                | Rate limit too tight for event traffic    | Bump `KON_PIN_RPM` in .env, restart relay-ipfs                           |
| relay-gun OOMs                              | Memory spike from many concurrent clients | Add swap; if not enough, bump VPS to 2GB                                 |
| `id.kon.xyz` cert expires                   | ACME automation failure                   | Caddy auto-renews; if stuck, `docker exec kon-relay-caddy caddy reload`  |
| ENS contenthash write fails                 | KON_DEPLOY_KEY out of ETH                 | Top up the wallet address with mainnet ETH for gas                       |

## Sign-off

- [ ] Operator A signed off on infrastructure
- [ ] Operator B signed off on wallet/paymaster
- [ ] Code reviewer signed off on the published bundles' commit hashes
- [ ] Event coordinator signed off on communication
