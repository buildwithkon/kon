# Self-host the KON relay stack

Run your own `relay.<your-domain>` and `gateway.<your-domain>` so the chat + IPFS pin layer of your KON apps doesn't depend on `kon.xyz` infrastructure. This is the relay subsystem of the broader Phase 7 self-host story — the runtime + wallet + dashboard self-host bits are documented separately.

**Who this is for.** Organizers who want their KON deployment to keep working even if the KON project, the KON team, or `kon.xyz` itself disappears. The relay stack is the most "infra-heavy" of the self-host options, so it's the one most worth documenting carefully.

**When you don't need this.** If you publish via web3.storage (`KON_PIN_SERVICE=w3up`) and let your apps default to the KON-run GUN relay at `relay.kon.xyz`, you can ignore this whole document. The relay stack only matters when you want to own the chat + IPFS-pin layer too.

## What you get

```
                Internet
                    │
                    ▼
                [Caddy :443]                ← TLS via Let's Encrypt
                    │
                    ├─────────────► [relay-gun :8765]
                    │                 GUN.js WebSocket
                    │                 wss://relay.<DOMAIN>/gun
                    │
                    └─────────────► [relay-ipfs :8080]
                                      IPFS HTTP gateway
                                      https://gateway.<DOMAIN>/ipfs/<cid>

                                    [relay-ipfs :4001]   ← libp2p TCP
                                    direct, public        Bitswap + DHT
```

Three containers via Docker Compose, one VPS, three public endpoints:

- `wss://relay.<DOMAIN>/gun` — GUN.js relay for chat + draft workspace
- `https://gateway.<DOMAIN>/ipfs/<cid>` — HTTP gateway for your pinned content
- `<vps-ip>:4001` — libp2p TCP for IPFS DHT + Bitswap

## Prerequisites

|                       | Required    | Notes                                                                                                                                                                 |
| --------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A domain you control  | ✅          | Examples below use `myfestival.com`. Can be a subdomain of something larger if you don't want a dedicated apex.                                                       |
| DNSSEC on that domain | ✅          | Needed for the DNS-ENS path in the runtime + wallet. Most registrars support it (Gandi, Cloudflare Registrar, Namecheap, Porkbun). If yours doesn't, move the domain. |
| ENS DNS-import done   | ✅          | Visit app.ens.domains/dns/`yourdomain.com` and import. One-time setup.                                                                                                |
| A VPS with Docker     | ✅          | 1 vCPU / 1 GB RAM / 25 GB disk is enough for ETHTokyo-scale (50-attendee event). Larger if you expect more. See "Picking a VPS" below.                                |
| Open TCP ports        | ✅          | 80, 443 (Caddy TLS), 4001 (libp2p). Firewall must allow inbound.                                                                                                      |
| A monitored email     | Recommended | For Let's Encrypt expiry warnings.                                                                                                                                    |

## Picking a VPS

The KON team's default at `relay.kon.xyz` runs on Vultr Tokyo $6/mo. Equivalent options:

| Provider          | Region (closest to your users)               | Spec                                 | Cost                            |
| ----------------- | -------------------------------------------- | ------------------------------------ | ------------------------------- |
| Vultr             | Tokyo / Frankfurt / Virginia / São Paulo     | 1 vCPU / 1 GB / 25 GB / 1 TB         | $6/mo                           |
| Linode (Akamai)   | Tokyo / Frankfurt / Virginia                 | 1 vCPU / 1 GB / 25 GB / 1 TB         | $5/mo                           |
| Hetzner           | Frankfurt / Helsinki / Falkenstein (EU only) | 2 vCPU ARM / 4 GB / 40 GB / 20 TB    | €4.51/mo                        |
| Oracle Cloud Free | Tokyo / Frankfurt / Phoenix (Always Free)    | 4 ARM cores / 24 GB / 200 GB / 10 TB | **$0** if capacity is available |
| AWS Lightsail     | Tokyo / Frankfurt / Virginia                 | 1 vCPU / 1 GB / 40 GB / 2 TB         | $5/mo                           |
| Sakura VPS        | Tokyo / Osaka (JP only)                      | 1 vCPU / 1 GB / 50 GB SSD            | ¥685/mo                         |

**Pick the region closest to your users.** GUN chat latency is the most user-visible — anything >200ms makes the UI feel laggy. IPFS pin latency doesn't matter once the DHT cache is warm.

What doesn't work well:

- Fly.io / Render / Railway free tiers — libp2p TCP exposure on port 4001 is awkward or paid-only
- Cloudflare Workers / serverless — long-running libp2p sockets aren't possible
- AWS EC2 t2.nano — out of memory under load, not worth the savings

## Quick start

On a fresh VPS with Docker installed:

```bash
git clone https://github.com/buildwithkon/kon.git
cd kon
cp .env.relay.example .env
vim .env                       # set the three required vars (see below)
docker compose up -d
docker compose logs -f         # watch for Caddy to issue certs (~10s)
```

That's it. Caddy will request Let's Encrypt certs for `relay.<DOMAIN>` and `gateway.<DOMAIN>` on first boot, the GUN relay starts persisting to `gun-data` volume, and the IPFS relay announces itself on the DHT.

### Required `.env` values

```bash
# Root domain — same one whose DNSSEC + ENS DNS-import you set up
KON_RELAY_DOMAIN=myfestival.com

# Email Let's Encrypt notifies for cert-expiry warnings
ACME_EMAIL=ops@myfestival.com

# Optional — only set if behind NAT or if you want libp2p to advertise
# a stable DNS-based address instead of raw IPv4
KON_RELAY_ANNOUNCE=

# Optional — multi-region peers. Empty for single-region (Stage 1).
KON_GUN_PEERS=
```

### Required DNS records

Add these **before** running `docker compose up -d`. Caddy uses the ACME HTTP-01 challenge which needs live DNS to issue certs.

```
relay.<DOMAIN>     A    <vps-ipv4>
gateway.<DOMAIN>   A    <vps-ipv4>
```

Optionally, if you want libp2p to advertise via DNS instead of IP:

```
<DOMAIN>           A    <vps-ipv4>
```

And set `KON_RELAY_ANNOUNCE=/dns4/<DOMAIN>/tcp/4001` in `.env`.

## Point your apps at the new relay

In each KON app's `manifest.source.json`, override the relay endpoints:

```jsonc
{
  "app": { "id": "matsuri.myfestival.com", ... },
  "deployment": {
    "wallet_origin": "https://id.myfestival.com",
    "gun_peers": [
      "https://relay.myfestival.com/gun"
      // Optionally keep a public fallback:
      // "https://relay.peer.ooo/gun"
    ],
    "ipfs_gateways": [
      "https://gateway.myfestival.com",
      "https://w3s.link"
    ]
  },
  "pages": [...],
  "plugins": [...]
}
```

Republish the app (`bun run publish:app --app matsuri --publish`) and the new entry points your runtime at your relay instead of `relay.kon.xyz`.

## Verifying the deploy

After `docker compose up -d`:

```bash
# Health endpoints
curl https://relay.<DOMAIN>/health
# { "ok": true, "gun": "0.2020", "uptime": 42, "data": "/data", "peers": 0 }

curl https://gateway.<DOMAIN>/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
# Should return the IPFS "hello world" content

# libp2p peer ID (printed at startup, watch logs)
docker compose logs relay-ipfs | grep peerId
# [relay-ipfs] libp2p ready, peerId: 12D3KooW...

# Confirm DHT propagation (a few seconds after start)
curl "https://ipfs.io/api/v0/dht/findpeer?arg=<your-peerId>"
```

If you can resolve `relay.<DOMAIN>` AND `gateway.<DOMAIN>` over HTTPS, and libp2p shows the peer ID, you're done.

## Volumes, backups, restore

Three Docker named volumes hold all state:

| Volume                       | Contents                                   | Backup strategy                                                                                              |
| ---------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `kon-relays_gun-data`        | GUN graph (chat history, draft workspaces) | nightly `docker run --rm -v kon-relays_gun-data:/v -v $(pwd):/b alpine tar czf /b/gun-$(date +%F).tar.gz /v` |
| `kon-relays_ipfs-blockstore` | UnixFS blocks for everything you've pinned | same pattern. Larger but compressible.                                                                       |
| `kon-relays_caddy-data`      | TLS certs + ACME account key               | back this up if you'll move to a new VPS — losing it means re-issuing certs (rate-limited by Let's Encrypt)  |

A 3-line cron job covers all three:

```cron
# /etc/cron.daily/kon-relays-backup
0 3 * * * cd /srv/kon && \
  for v in gun-data ipfs-blockstore caddy-data; do \
    docker run --rm -v kon-relays_$v:/v -v /backup:/b alpine \
      tar czf /b/$v-$(date +\%F).tar.gz -C /v . ; \
  done
```

Restore: stop containers, `tar xzf` into the volume mount, start. The blockstore can be regenerated from any peer with the data via Bitswap if you lose it, but the GUN graph is canonical — you cannot recover chat history if `gun-data` is gone and you have no backup.

## Operations

```bash
# Watch logs
docker compose logs -f                # all three services
docker compose logs -f relay-gun      # one
docker compose logs --tail=200 relay-ipfs

# Restart a single service (no downtime for the others)
docker compose restart relay-gun

# Update to the latest KON repo (rebuilds images)
cd /srv/kon
git pull
docker compose up -d --build

# Stop everything (state survives)
docker compose down

# Wipe everything including volumes — destructive
docker compose down -v
```

Healthcheck on `relay-gun` is built into its Dockerfile; Docker auto-restarts the container if `/health` stops responding for ~90 seconds (3 failed checks × 30 s interval). `relay-ipfs` doesn't ship a healthcheck — libp2p doesn't have a single "am I healthy" endpoint — but Docker's `restart: unless-stopped` covers crash recovery.

## Monitoring

Minimum:

- Uptime check on `https://relay.<DOMAIN>/health` (UptimeRobot free tier, or your favorite)
- Uptime check on `https://gateway.<DOMAIN>/` (returns Helia HTML index page)
- Disk space alert on the VPS (`ipfs-blockstore` grows with every pin)

Optional next step: scrape Docker stats into Prometheus + Grafana. Out of scope for this doc; the `cadvisor` + `node_exporter` combo is the standard recipe.

## Multi-region scaling

When one region isn't enough — usually because users are global and chat latency from Tokyo to Berlin is noticeable:

1. **Stand up the same `docker compose` stack in each region.** Different VPS, same code, same `.env` except for `KON_GUN_PEERS`.

2. **Set `KON_GUN_PEERS` on each region** to the public `/gun` URLs of the _other_ regions:

   ```bash
   # On the Tokyo region's .env:
   KON_GUN_PEERS=https://fra.relay.myfestival.com/gun,https://iad.relay.myfestival.com/gun

   # On the Frankfurt region's .env:
   KON_GUN_PEERS=https://nrt.relay.myfestival.com/gun,https://iad.relay.myfestival.com/gun
   ```

3. **GeoDNS at the edge.** Use a DNS provider that supports geographic answers to route `relay.myfestival.com` (and `gateway.myfestival.com`) to the nearest region.

   | Provider              | GeoDNS pricing                                        | DNSSEC |
   | --------------------- | ----------------------------------------------------- | ------ |
   | Bunny DNS (bunny.net) | Free                                                  | ✅     |
   | Gcore DNS             | Free                                                  | ✅     |
   | AWS Route 53          | $0.50/zone/mo + $0.40/M queries                       | ✅     |
   | Google Cloud DNS      | $0.40/M queries                                       | ✅     |
   | Cloudflare DNS        | Free DNS, but GeoDNS via Load Balancing add-on $5/mo+ | ✅     |
   | deSEC.io              | ❌ no GeoDNS — fine for single-region                 |

   **Recommended: Bunny DNS** if you need GeoDNS today; **deSEC** if you don't yet (it has the better DNSSEC story and is free).

4. **IPFS needs no special config.** libp2p's kad-DHT handles global content discovery automatically. Each region holds its own blockstore; cross-region requests resolve via Bitswap with a one-time latency cost (a few hundred ms the first time, ~immediate after).

GUN gossip converges across regions in ~hundreds of ms via its CRDT layer — there's no application-level coordination required. Drop a message on the Tokyo relay, it appears on the Frankfurt relay before the next message arrives.

**Stage 1 (single region) needs none of this.** `KON_GUN_PEERS` stays empty, DNS is a single A record, and `docker compose up -d` is the full deployment.

## Troubleshooting

**Caddy fails to issue certs at startup.**

- Verify DNS A records point at the VPS and propagation finished (`dig relay.<DOMAIN>`). Let's Encrypt HTTP-01 needs to reach the VPS on port 80.
- Check the VPS firewall allows inbound 80 + 443. Some providers (DigitalOcean Cloud Firewalls, AWS Security Groups) deny by default.
- `docker compose logs caddy` shows the exact ACME error.

**relay-gun crashes with `EADDRINUSE :8765`.**

- Another process on the host is using 8765. Inside Docker this shouldn't happen since the port is internal-only. If it does, `lsof -i :8765` finds the conflict.
- If you're running the relay outside Docker for development, kill any orphan `bun @relay-gun:start` processes.

**relay-ipfs fails to find a `node-datachannel` native binary at startup.**

- Should not happen on a fresh `bun install` — `node-datachannel` is in the root `package.json` `trustedDependencies`, which lets bun run its install hook to fetch the prebuilt binary via `prebuild-install`. Most platforms (macOS arm64/x64, Linux glibc/musl x64/arm64, Windows x64) have a prebuilt available.
- If it does happen, the most likely cause is a platform without a prebuilt — falling back to compiling from source requires `cmake-js`. Workaround: install cmake + a C++ compiler and run `bunx prebuild-install -r napi || cmake-js rebuild` inside `node_modules/.bun/node-datachannel@*/node_modules/node-datachannel/`. Or use the Docker image, which bakes the binary at build time.

**Apps don't see chat messages.**

- Verify the manifest's `deployment.gun_peers` actually points at your relay. The runtime logs the resolved deployment on boot (`runtime diagnostics` expand panel in the bottom of every page).
- Test the relay endpoint directly: `wscat -c wss://relay.<DOMAIN>/gun` (install `wscat` from npm) and send `["1234567890",{"#":"test","get":"chat/"}]`. You should see GUN's handshake response within ~100ms.

**IPFS content doesn't load via the gateway.**

- Confirm the block was actually pinned: `docker compose exec relay-ipfs ls /blockstore` should show data.
- If you published via `KON_PIN_SERVICE=helia` from a different machine, the blocks live on that machine — the relay's blockstore is empty. Either publish on the same host as the relay, or use `KON_PIN_SERVICE=w3up` for cross-machine publishing.
- `curl -v https://gateway.<DOMAIN>/ipfs/<cid>` shows whether Caddy is proxying correctly. If you get 404 from Helia, the CID isn't pinned locally and the relay can't find it via DHT either.

**Disk fills up on the blockstore.**

- IPFS doesn't garbage-collect by default. To remove no-longer-pinned content: `docker compose exec relay-ipfs node -e "import('helia').then(...)"` (gc API). In practice, just nuke the blockstore and re-pin from your publish source when disk pressure becomes real.

## Known issues

- **`@helia/bitswap@3.2.3` incoming-stream crash.** A known upstream bug can crash `relay-ipfs` on a `connection.remotePeer` undefined access. Docker's `restart: unless-stopped` covers it (the container restarts within seconds), but if you're seeing this frequently, check the upstream Helia issue tracker and pin to a newer version once the fix lands.
- **No native WebRTC transport.** Deliberate. `relay-ipfs` uses TCP-only libp2p to avoid the node-datachannel native build dependency. Public IPFS gateways and Kubo nodes all support TCP, so this rarely matters in practice.
- **No persistent peer-store.** Each restart re-bootstraps the DHT from scratch. Adds ~10s to startup time. Not yet worth the complexity of adding a persistent peer-store backend.
- **HTTP gateway has no auth or rate limiting.** If you're worried about abuse, front the stack with Cloudflare's free-tier reverse proxy (it doesn't change the GeoDNS picture — Cloudflare DNS still works).

## Self-host operator's promise

This stack, plus your own w3up account (or `KON_PIN_SERVICE=helia` with this relay as the pin endpoint), plus your own ENS DNS-import, gives you the full KON v2 stack without any KON-managed component in the data path. KON's role becomes the OSS code + the default `kon.xyz` convenience for organizers who want zero ops. The bytes never have to touch us.

When KON disappears one day, your relay stack and your apps keep running.
