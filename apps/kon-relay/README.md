# kon-relay

Helia + libp2p daemon that exposes the local `.kon/blockstore/` (written by `publish:*` when `KON_PIN_SERVICE=helia`) to the public IPFS network. Without this daemon, self-host blocks never leave your disk.

## What it does

```
[KON publish scripts]
   ↓ write UnixFS blocks
[.kon/blockstore/]
   ↓ read same path
[kon-relay]
   ├─ libp2p TCP transport on :4001
   ├─ kad-DHT (announces our CIDs)
   ├─ Bitswap (serves blocks to requesting peers)
   └─ @helia/verified-fetch HTTP gateway on :8080
       ↓ /ipfs/<cid>
[public web — w3s.link, .limo, your own gateway]
```

When a public IPFS gateway gets a request for one of your pinned CIDs, it queries the DHT, finds kon-relay's peer ID, opens a libp2p connection over TCP, Bitswaps the blocks, then serves them to the user.

## Quick start (local PoC)

```bash
# 1. publish something to the local blockstore
KON_PIN_SERVICE=helia pnpm publish:app --app ethtokyo --upload

# 2. run the relay
pnpm --filter @konxyz/kon-relay start
# [kon-relay] starting...
# [kon-relay]   blockstore: .kon/blockstore
# [kon-relay] libp2p ready
# [kon-relay]   peerId: 12D3KooW...
# [kon-relay]   addr: /ip4/192.168.1.10/tcp/4001/p2p/12D3KooW...
# [kon-relay] HTTP gateway on http://0.0.0.0:8080/ipfs/<cid>

# 3. fetch via direct relay HTTP gateway (no public gateway needed)
curl http://localhost:8080/ipfs/<cid>/index.html

# 4. or via public gateway — once the DHT announce propagates (a few seconds)
curl https://w3s.link/ipfs/<cid>/index.html
```

## Production deploy (VPS)

Minimum: a $5/mo VPS with port 4001 reachable from the public internet.

```bash
# install + start
git clone <kon repo>
pnpm install
pnpm --filter @konxyz/kon-relay start

# behind NAT? announce your public address:
KON_RELAY_ANNOUNCE=/dns4/relay.kon.xyz/tcp/4001 pnpm --filter @konxyz/kon-relay start

# behind a reverse proxy for HTTPS gateway:
# Caddy/nginx terminates TLS on gateway.kon.xyz -> http://localhost:8080
```

systemd unit (example):

```ini
[Unit]
Description=KON IPFS relay
After=network-online.target

[Service]
ExecStart=/usr/bin/pnpm --filter @konxyz/kon-relay start
WorkingDirectory=/srv/kon
Environment=NODE_ENV=production
Environment=HELIA_BLOCKSTORE_PATH=/srv/kon/.kon/blockstore
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Env vars

| Var                     | Default           | Notes                                                                                                                |
| ----------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `HELIA_BLOCKSTORE_PATH` | `.kon/blockstore` | Same path the publish scripts write to.                                                                              |
| `KON_RELAY_TCP_PORT`    | `4001`            | libp2p listen port; open on firewall.                                                                                |
| `KON_RELAY_HTTP_PORT`   | `8080`            | HTTP gateway; set to empty (`KON_RELAY_HTTP_PORT=`) to disable.                                                      |
| `KON_RELAY_ANNOUNCE`    | (none)            | Comma-separated multiaddrs to announce externally. Required when behind NAT. Example: `/dns4/relay.kon.xyz/tcp/4001` |

## Relationship to other KON v2 pieces

- **publish:\*** — writes blocks to disk. Doesn't need kon-relay to run; only to be reachable.
- **MultiPinService (planned)** — pushes the same CIDs to web3.storage in parallel. With kon-relay running too, you get both: sovereign self-host AND immediate public reachability. Either can fail without breaking the other.
- **No node-datachannel / WebRTC dependency** — kon-relay's libp2p config uses TCP only. Builds cleanly on any platform with a C compiler (no native binding required for the transport).

## Self-host operator's promise

This daemon, plus your own w3up account, plus your own ENS DNS-import, gives you the full KON v2 stack without any KON-managed component in the path. Run kon-relay → publish via Helia → DNS-ENS contenthash → users navigate to `app.yourdomain.com` and get YOUR pinned blocks served from YOUR daemon. KON's role is the OSS code + the default kon.xyz convenience; the bytes never have to touch us.

## Status

PoC. The daemon boots successfully, joins the libp2p DHT, exposes a peerId + multiaddrs, and serves the HTTP gateway on the configured port. Upload + dry-run end-to-end through `KON_PIN_SERVICE=helia pnpm publish:app --upload && pnpm --filter @konxyz/kon-relay start` works.

Known limitations (production hardening):

- **bitswap stream stability**: @helia/bitswap@3.2.3 has a known issue where incoming streams can crash the process on a `connection.remotePeer undefined` read. Affects long-running production usage. Track upstream — pin to a newer/older bitswap version once a fix lands. Workaround for now: restart loop via systemd / docker auto-restart.
- **No persistent peer-store**: re-bootstraps DHT on every restart. Add a peer-store backend before serving production traffic.
- **No IPFS Cluster integration**: single-node only. For multi-node redundancy, run multiple kon-relay instances + use multi-pin from the publish side.
- **HTTP gateway has no auth / rate limiting**: front with Caddy / Cloudflare in production.
- **No native WebRTC transport** by design: kon-relay uses TCP only to avoid the node-datachannel native build hazard. Public gateways and Kubo nodes all support TCP so this is rarely a limitation in practice.
