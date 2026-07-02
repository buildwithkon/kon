# Phase 9 — Production Hardening

> **Reprioritized 2026-06-02 (CEO review + office-hours).** KON has no validated
> demand from any community outside a founder-run event, so most of Phase 9 is
> premature: it hardens for a Stage-2 scale there's no evidence of yet. Until an
> outside community pulls on KON, only two items ship before ETHTokyo, and both
> are because they protect the discovery event itself, not future scale:
>
> - **#3 (slimmed) — paymaster sybil/credit cap.** Lower CDP global + per-user
>   caps, move alerts to 25%/50%, add a claim-time speed-bump. Stops sybil
>   passkeys draining the sponsored-gas budget mid-event.
> - **`/api/pin` per-request body-size cap** (a gap not in the original list).
>   Few lines; stops one oversized POST OOMing the relay at the venue.
> - Plus a free UI guard: disable Publish on submit (no double-spend).
>
> Everything else here — including #1 signed `/api/pin` auth, which an earlier
> review pulled toward the launch — is **deferred to Stage 2 / post-demand** and
> tracked in `docs/TODOS.md` (items 6-9). The deferral reasoning and the demand
> plan live in
> `~/.gstack/projects/buildwithkon-kon/yujiym-v2-design-20260602-163305.md`.
> The full roadmap below stands as the Stage-2 plan; read it through that lens.

Phase 8 (commit `64393e8` and predecessors) closed the last critical-path stub in the publish pipeline: organizers can sign + publish from the dashboard with real on-chain effects via Pimlico bundler + Coinbase paymaster. Phase 9 is the security + operations work that turns "demo-quality" into "production-quality."

**When to do this work.** Stage 1 (ETHTokyo, ~50 attendees, KON-managed deploy, single Tokyo VPS) probably ships without most of Phase 9 — the per-IP rate limiter on `/api/pin` and the Pimlico + Coinbase dashboard restrictions absorb the realistic abuse vectors for an event-scale launch. Phase 9 lands incrementally between Stage 1 and Stage 2, when the deployment widens to organizers KON doesn't personally know.

This doc lists the work in priority order. Each section is independently shippable.

## 1. Passkey-signed `/api/pin` auth

**Status today.** The `/api/pin` endpoint accepts any POST with a body under the per-IP rate-limit + daily-quota caps. No auth header, no signature check. Abuse mitigation: 10 req/min + 100 MB/day per IP.

**Why this isn't enough at Stage 2.** An attacker on a residential IP can write garbage to the pin endpoint for free, filling the operator's blockstore over weeks until disk pressure forces an upgrade. The rate limiter slows them down but doesn't make the attack zero-cost.

**Design.**

```
Client (dashboard) → POST /api/pin
                     Headers:
                       X-Kon-Auth: <hex-signature>
                       X-Kon-Auth-Pubkey: <32-byte pubkey hex>
                       X-Kon-Auth-Timestamp: <unix ms>
                     Body: <raw bytes>

Server (relay-ipfs):
  1. Reject if Timestamp drift > 5 min (replay defense).
  2. Reconstruct the signed message:
     sha256(timestamp || pubkey || sha256(body))
  3. Verify signature against pubkey (Ed25519 / SEA-compatible).
  4. Check pubkey against a per-pubkey rate-limit + quota
     (separate from the per-IP one).
  5. Pass to fs.addBytes.
```

The pubkey is the SEA key the dashboard already derives from the passkey via `wallet.requestKeyDerivation('relay-pin')` (the same flow that gives the Forum plugin its GUN identity). Per-pubkey quotas mean each organizer gets their own budget regardless of IP.

**Implementation effort.** ~80 lines in `apps/relay-ipfs/src/index.mjs`, ~30 lines in the dashboard's `uploadManifestToIpfs()` helper, ~40 lines of vitest. Plus a small `runtime-core/auth.ts` helper exporting `signPinRequest()` so the dashboard + future organizer-side tools share the signing code.

## 2. Multi-region relay deployment

**Status today.** Single Tokyo VPS. `KON_GUN_PEERS` env wired in `apps/relay-gun/src/index.mjs` so multi-region gossip-sync works on configuration alone (no code change), but no actual second region exists.

**Why this matters at Stage 2.** International organizers (Berlin → ETHBerlin, Singapore → token2049) hit ~150 ms RTT to a Tokyo relay, which makes GUN chat feel laggy. The fix is one region per major audience cluster + GeoDNS.

**Design.**

```
Tokyo VPS              Frankfurt VPS         Virginia VPS
relay-gun (WS)         relay-gun (WS)        relay-gun (WS)
  ↑                      ↑                     ↑
  KON_GUN_PEERS=         KON_GUN_PEERS=        KON_GUN_PEERS=
   fra+iad relay /gun     nrt+iad relay /gun    nrt+fra relay /gun
  (gossip-sync)          (gossip-sync)         (gossip-sync)

   ←─────── GeoDNS resolves relay.kon.xyz to nearest region ───────→
```

DNS provider: Bunny DNS (free GeoDNS + DNSSEC), recommended over CF DNS Load Balancing ($5/mo extra) for the KON-managed deployment.

**Implementation effort.** Mostly ops, very little code:

- Stand up 2 more VPS (Frankfurt + Virginia or São Paulo, ~$12/mo total)
- Configure GeoDNS at the DNS provider (per the table in `docs/self-host-relay.md`)
- Set `KON_GUN_PEERS` on each region's `.env`
- Update `docs/self-host-relay.md` "Multi-region scaling" with the operator's actual provider choice

No application-side code change. The relay-gun already supports `KON_GUN_PEERS`; the relay-ipfs's IPFS DHT propagates content globally without any config.

## 3. Pimlico + Coinbase budget alerting

**Status today.** Both dashboards support email alerts at 50% / 90% of the global USD cap (documented in `docs/self-host-wallet.md`). KON team has configured them. But there's no programmatic visibility into per-day spending — alerting is reactive, not predictive.

**Why this matters at Stage 2.** A single buggy organizer-side app (e.g. an infinite retry loop after a paymaster reject) could burn through the daily cap in an hour. The dashboards see it but only after the threshold. Need ahead-of-time signaling.

**Design.**

```
GitHub Action (hourly cron) → Pimlico API /v1/usage
                            → Coinbase API /paymaster/usage
                            → If hourly spend > N × (daily_cap / 24),
                              post to a Slack/Discord webhook
```

Or self-hosted: a tiny Cloudflare Worker on a 1-hour cron that pulls the same APIs.

**Implementation effort.** ~100 lines GHA workflow YAML + 50 lines of a polling script. The Pimlico and Coinbase APIs are documented; the only deployment-specific value is the webhook URL (operator-supplied).

## 4. Bundler / paymaster failover

**Status today.** If Pimlico's bundler is down, `wallet.signTx` rejects with `paymaster_rejected` or a network error. If Coinbase's paymaster is rate-limited, the same. The dashboard surfaces the error but has no fallback path.

**Why this matters at Stage 2.** A scheduled Pimlico maintenance window during ETHTokyo would break publish until they're back. Need a second bundler that can absorb traffic without code changes.

**Design.**

`apps/account/src/chains.ts` gains a fallback array:

```ts
{
  bundlerUrls: [pimlicoUrl(8453), alchemyUrl(8453)],
  paymasterUrls: [cdpUrl(8453), pimlicoUrl(8453)],
}
```

`submit-user-op.ts` tries the first; on `network error || 5xx`, retries with the second. ~30 lines of retry logic, ~3 new env vars.

The CDP paymaster being subsidized makes it the always-preferred-first paymaster regardless of bundler choice.

## 5. Wildcard `<app>.kon.xyz` Caddy resolver

**Status today.** Each KON app's subname needs its own Caddy vhost mapping to a static CID, or organizers use `.limo` fallback for ENS-aware routing. Doesn't scale past ~20 apps.

**Why this matters at Stage 2.** KON-managed deployment expects 50-200 apps in Stage 2. Manually maintaining 200 Caddy vhosts is operator pain.

**Design.**

```
Caddy on-demand TLS + custom plugin (or sidecar service):
  on request for <app>.kon.xyz:
    1. lookup DNSLink TXT record _dnslink.<app>.kon.xyz
       (each organizer's publish updates this)
    2. proxy to relay-ipfs:8080/ipfs/<CID-from-DNSLink>
    3. cache the lookup for 60s
```

Alternative: a thin Node sidecar at `*.kon.xyz` that does the lookup + forward. Simpler to write than a Caddy plugin; ~150 lines.

**Implementation effort.** Medium — sidecar approach is straightforward, ~200 lines + Caddy config integration + DNS automation in `publish:app --publish`.

## 6. Persistent peer-store for relay-ipfs

**Status today.** relay-ipfs re-bootstraps the libp2p DHT on every restart (~30 sec of no peers being found before the bootstrap nodes warm up the routing table).

**Why this matters at Stage 2.** Restart for upgrades happens every few weeks. During the warm-up window, public gateways requesting the relay's content get 504s.

**Design.**

`@libp2p/persistent-peer-store` writes peer routing state to disk on shutdown, restores on startup. Drop-in to the libp2p config in `apps/relay-ipfs/src/index.mjs`.

**Implementation effort.** ~10 lines. Listed because it's low-effort + clear ops win.

## 7. Backup + restore runbook

**Status today.** `docs/self-host-relay.md` mentions a 3-line cron backup recipe but doesn't document the restore path.

**Why this matters at Stage 2.** A self-host operator whose VPS dies needs to recover gun-data + ipfs-blockstore + caddy-data on a new host without losing customer state.

**Design.**

New `docs/disaster-recovery.md`:

- Pre-failure: scheduled tarballs of the three volumes, off-machine (S3 / B2 / rclone to whatever).
- Post-failure on new VPS: install Docker, restore tarballs into freshly named volumes, `docker compose up -d`. The DHT bootstrap takes 30 sec; Caddy re-issues TLS within 60 sec.
- Verify: signed users' passkeys still authenticate (Safe addresses are deterministic from the passkey, so this just works).

Document operator drill: "do this exercise once before going to production."

## 8. CI for relay artifacts

**Status today.** No CI for relay-ipfs / relay-gun. Tests pass on the workspace; integration is ad-hoc.

**Design.** A `.github/workflows/relay.yml`:

- On push to `v2`, build the two Dockerfiles. Smoke-test the gateway endpoint via container against a fixed CID. Smoke-test `/api/pin` round-trip.
- On tag `relay-v*`, publish the images to ghcr.io.

Cheap insurance. Self-host operators can then `docker compose pull` instead of `docker compose build` for faster deploys.

## 9. Telemetry / observability

**Status today.** Stdout logs. Operator inspects via `docker compose logs`. No metrics, no traces.

**Design.** Minimum-viable:

- relay-ipfs exposes `/metrics` (Prometheus format) listing pin-endpoint stats (`pin_requests_total`, `pin_bytes_total`, per-status counter)
- relay-gun exposes `/metrics` listing peer count + message rate
- Operator opt-in: a `docker-compose.override.yml` snippet adds a Grafana Agent that scrapes both and ships to Grafana Cloud's free tier.

~150 lines total. Operator who wants observability adds the override; who doesn't, just doesn't.

## What's NOT in Phase 9

Punted to Stage 3+:

- **UCAN-style cross-origin identity** — bridging the passkey at `id.kon.xyz` with the one at `id.myfestival.com`. Substantial cryptography work, low practical priority while organizers are single-deployment.
- **Multi-sig Safe (M-of-N threshold)** — the Safe deploys 1-of-1 today. M-of-N would let organizers add a co-signer for high-stakes operations. Possible but not urgent.
- **Per-app rate limiting** — at the moment the rate-limiter is per-IP, not per-app. Phase 9 #1 adds per-pubkey; a future per-app layer would gate by `app.id` from the manifest. Probably never needed.

## Recommended ordering

For KON team's own deployment, the sequence that delivers the most operator confidence per hour spent:

1. Phase 9 #6 (persistent peer-store) — 10 lines, big stability win
2. Phase 9 #3 (budget alerting) — 1 hour, prevents nasty surprises
3. Phase 9 #1 (signed /api/pin auth) — 1 day, blocks the abuse path at Stage 2
4. Phase 9 #2 (multi-region) — 1 day ops, only after demand justifies the extra VPS spend
5. Phase 9 #5 (wildcard resolver) — 1-2 days, blocks growth past ~20 apps

Phase 9 #4 (failover), #7 (DR runbook), #8 (CI), #9 (telemetry) are good-to-have throughout but not gating any specific Stage transition.
