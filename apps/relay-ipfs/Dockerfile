# Production image for @konxyz/relay-ipfs (Helia + libp2p daemon).
#
# Resource profile:
#   - TCP libp2p listener on KON_RELAY_TCP_PORT (default 4001)
#   - HTTP gateway on KON_RELAY_HTTP_PORT (default 8080)
#   - persistent UnixFS blockstore at HELIA_BLOCKSTORE_PATH (volume)
#   - ~500MB RSS under load, 10GB+ disk for an active app's blocks
#
# Native deps: relay-ipfs deliberately avoids @libp2p/webrtc (and thus
# node-datachannel) so the build needs no C compiler — node:22-alpine
# is sufficient.

FROM oven/bun:1.3-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN bun install --production

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

ENV HELIA_BLOCKSTORE_PATH=/blockstore
ENV KON_RELAY_TCP_PORT=4001
ENV KON_RELAY_HTTP_PORT=8080
VOLUME /blockstore
EXPOSE 4001 8080

CMD ["node", "src/index.mjs"]
