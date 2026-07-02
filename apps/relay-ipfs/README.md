# relay-ipfs

Helia + libp2p daemon that exposes the local `.kon/blockstore/` (written by `publish:*` when `KON_PIN_SERVICE=helia`) to the public IPFS network. Without this daemon, self-host blocks never leave your disk.

## What it does

```
[KON publish scripts]
   ↓ write UnixFS blocks
[.kon/blockstore/]
   ↓ read same path
[relay-ipfs]
   ├─ libp2p TCP transport on :4001
   ├─ kad-DHT (announces our CIDs)
   ├─ Bitswap (serves blocks to requesting peers)
   └─ @helia/verified-fetch HTTP gateway on :8080
       ↓ /ipfs/<cid>
[public web — w3s.link, .limo, your own gateway]
```

When a public IPFS gateway gets a request for one of your pinned CIDs, it queries the DHT, finds relay-ipfs's peer ID, opens a libp2p connection over TCP, Bitswaps the blocks, then serves them to the user.

## Quick start (local PoC)

```bash
# 1. publish something to the local blockstore
KON_PIN_SERVICE=helia bun run publish:app --app ethtokyo --upload

# 2. run the relay
bun --filter '@konxyz/relay-ipfs' run start
# [relay-ipfs] starting...
# [relay-ipfs]   blockstore: .kon/blockstore
# [relay-ipfs] libp2p ready
# [relay-ipfs]   peerId: 12D3KooW...
# [relay-ipfs]   addr: /ip4/192.168.1.10/tcp/4001/p2p/12D3KooW...
# [relay-ipfs] HTTP gateway on http://0.0.0.0:8080/ipfs/<cid>

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
bun install
bun --filter '@konxyz/relay-ipfs' run start

# behind NAT? announce your public address:
KON_RELAY_ANNOUNCE=/dns4/relay.kon.xyz/tcp/4001 bun --filter '@konxyz/relay-ipfs' run start

# behind a reverse proxy for HTTPS gateway:
# Caddy/nginx terminates TLS on gateway.kon.xyz -> http://localhost:8080
```

systemd unit (example):

```ini
[Unit]
Description=KON IPFS relay
After=network-online.target

[Service]
ExecStart=/usr/local/bin/bun --filter '@konxyz/relay-ipfs' run start
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

- **publish:\*** — writes blocks to disk. Doesn't need relay-ipfs to run; only to be reachable.
- **MultiPinService (planned)** — pushes the same CIDs to web3.storage in parallel. With relay-ipfs running too, you get both: sovereign self-host AND immediate public reachability. Either can fail without breaking the other.
- **No node-datachannel / WebRTC dependency** — relay-ipfs's libp2p config uses TCP only. Builds cleanly on any platform with a C compiler (no native binding required for the transport).

## Self-host operator's promise

This daemon, plus your own w3up account, plus your own ENS DNS-import, gives you the full KON v2 stack without any KON-managed component in the path. Run relay-ipfs → publish via Helia → DNS-ENS contenthash → users navigate to `app.yourdomain.com` and get YOUR pinned blocks served from YOUR daemon. KON's role is the OSS code + the default kon.xyz convenience; the bytes never have to touch us.

## Status

PoC. The daemon boots successfully, joins the libp2p DHT, exposes a peerId + multiaddrs, and serves the HTTP gateway on the configured port. Upload + dry-run end-to-end through `KON_PIN_SERVICE=helia bun run publish:app --upload && bun --filter '@konxyz/relay-ipfs' run start` works.

Known limitations (production hardening):

- **bitswap stream stability**: @helia/bitswap@3.2.3 has a known issue where incoming streams can crash the process on a `connection.remotePeer undefined` read. Affects long-running production usage. Track upstream — pin to a newer/older bitswap version once a fix lands. Workaround for now: restart loop via systemd / docker auto-restart.
- **No persistent peer-store**: re-bootstraps DHT on every restart. Add a peer-store backend before serving production traffic.
- **No IPFS Cluster integration**: single-node only. For multi-node redundancy, run multiple relay-ipfs instances + use multi-pin from the publish side.
- **HTTP gateway has no auth / rate limiting**: front with Caddy / Cloudflare in production.
- **No WebRTC transport** by design: relay-ipfs uses TCP only. Simpler ops (no NAT traversal logic, no ICE servers, one firewall rule), and public IPFS gateways + Kubo nodes all speak TCP, so the practical reach is identical. The `node-datachannel` native module still installs (Helia's meta-package pulls it in transitively via `@libp2p/webrtc`); we just don't wire WebRTC into our libp2p config. The native binary downloads automatically via `prebuild-install` because `node-datachannel` is in the root `package.json` `trustedDependencies` — no xcode-select required on macOS, no system C compiler required on Linux.
