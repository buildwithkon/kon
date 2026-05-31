# Phase 0 Spike Report — GUN.js + SEA on Preact

**Date**: 2026-05-31
**Goal**: Verify GUN.js + SEA viable as KON v2 chat protocol (XMTP replacement)
**Stack**: Vite + Preact + @preact/signals + gun + gun/sea
**Kill criteria**: bundle >500KB gz, >5s to first message, signature integrity fails

---

## Result: ✅ PASS on automated checks; manual verification pending

### Automated metrics (verified)

| Metric                           | Kill threshold | Actual      | Status                 |
| -------------------------------- | -------------- | ----------- | ---------------------- |
| Bundle (gzip, total)             | 500 KB         | **35.6 KB** | ✅ PASS (7% of budget) |
| Vite dev server startup          | n/a            | 306 ms      | ✅                     |
| Module transformation (TSX → JS) | n/a            | working     | ✅                     |

### Bundle breakdown

| Chunk         | Raw         | Gzip        | Notes                               |
| ------------- | ----------- | ----------- | ----------------------------------- |
| `gun-*.js`    | 69.4 KB     | **26.0 KB** | GUN core + SEA (full chat protocol) |
| `preact-*.js` | 19.1 KB     | 7.4 KB      | Preact + @preact/signals            |
| `index-*.js`  | 4.8 KB      | 2.2 KB      | App code (chat UI, signature flow)  |
| **Total**     | **93.3 KB** | **35.6 KB** |                                     |

**For comparison**: XMTP browser SDK alone is ~500-800 KB gz before any app code. GUN at 26 KB gz is ~20× smaller.

---

## Manual verification (open browser at http://127.0.0.1:5173/)

The dev server is running. Run these checks in two browser tabs:

### Check 1: Connection + first-message latency

1. Open tab A: http://127.0.0.1:5173/
2. Watch "Status" panel — note the time to "Ready: yes"
3. Send a message from tab A
4. Open tab B in another window
5. Tab B should display tab A's message within seconds, marked ✓ verified
6. **Pass criteria**: time-to-first-message < 5s (kill threshold)

### Check 2: SEA signature verification

1. From tab A, send a message — confirm "✓ signature verified" badge in BOTH tabs
2. The "verified / unverified" counter should increment only the verified column
3. If any messages show "✗ signature INVALID", SEA is broken — that's a kill

### Check 3: Offline behavior

1. With both tabs connected and history present, disconnect WiFi
2. Reload tab A — does message history persist? (depends on GUN local cache)
3. Reconnect WiFi — does it re-sync?
4. **Pass criteria**: cached state survives reload; sync resumes on reconnect

### Check 4: Peer drop tolerance

1. Send a message from tab A
2. Close tab B mid-conversation
3. Open tab B again — does the message that was sent while tab B was closed still appear?
4. **Pass criteria**: messages sent during peer absence eventually arrive via GUN relay buffer

---

## Implementation notes

### Identity model

- For the spike, each tab generates a fresh SEA keypair via `SEA.pair()` on load
- In production this is replaced by passkey-PRF-derived deterministic SEA keypair (so same wallet = same identity across devices)
- See KON v2 plan Phase 2.5 for the production identity flow

### Public peers used (spike only)

```
https://gun-manhattan.herokuapp.com/gun
https://relay.peer.ooo/gun
```

In production these are replaced by KON-run relay + configurable per-app relays in `manifest.deployment.gun_peers`.

### Signature scheme

- `SEA.sign(JSON.stringify({ text, ts }), pair)` produces a self-contained signed envelope
- `SEA.verify(envelope, pub)` returns the original payload or undefined
- Unverified messages are still rendered with a red badge so signature failures are visible (not silently dropped)

### Limitations of this spike

- No group membership / access control (anyone can write to the room)
- No message ordering across peers under network partition
- No E2EE (signed only, not encrypted — production needs `SEA.encrypt`/`decrypt` for private rooms)
- No backpressure / rate limiting
- These are production concerns, not blockers for the go/no-go gate

---

## Decision: ✅ GO (confirmed 2026-05-31)

Manual verification in Firefox/Zen confirmed:

- Two-tab peer exchange works (after switching from dead `gun-manhattan.herokuapp.com` to a local relay at `http://localhost:8765/gun`)
- SEA signatures verify correctly across tabs
- Self-echo (SEA-only, no peer) works as the failure-isolation tool

Bundle PASS with wide margin (35.6 KB gz vs 500 KB threshold). Proceeding with GUN.js + SEA for KON v2 chat layer.

### Lesson from this spike (carry forward)

- Public GUN relays are unreliable (Heroku free tier killed `gun-manhattan` in 2022). Production must include a KON-run relay; cannot rely on public relays alone.
- `manifest.deployment.gun_peers` design from the plan is validated: per-app override is necessary, not optional.
- "Self-echo" SEA-only test pattern is worth keeping in the production Forum plugin as a built-in diagnostic.

### Conditions for revisiting the decision

- Manual check 1 (connection latency) fails repeatedly with public peers → need to provision KON-run relay before Phase 2.5 starts
- Manual check 2 (signature verification) fails → kill, switch to Nostr
- Manual check 4 (peer drop tolerance) fails → may still proceed but document the limitation; ETHTokyo chat needs persistent peer

### Follow-up tasks (after go-decision)

- Set up KON-run GUN relay (Docker image `kon/gun-relay`) — Phase 2.5
- Wire `SEA.pair()` to passkey-PRF derivation — Phase 2.6 (depends on `apps/wallet/`)
- Add group access control via SEA-signed membership token — Phase 2.5
- Add E2EE via `SEA.encrypt` for private rooms — Stage 3+
