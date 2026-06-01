# Minimal production image for @konxyz/relay-gun.
#
# Two-stage to keep the final image small:
#   - builder pulls deps with bun (fast)
#   - runner ships a slim node:22-alpine with only node_modules + src/
#
# Run with:
#   docker build -t kon-relay-gun apps/relay-gun
#   docker run -p 8765:8765 -v $(pwd)/gun-data:/data \
#     -e KON_GUN_DATA_PATH=/data kon-relay-gun
#
# In production the recommended pairing is the root docker-compose.yml,
# which co-deploys gun-relay + kon-relay + Caddy on one VPS.

FROM oven/bun:1.3-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN bun install --production

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

ENV KON_GUN_PORT=8765
ENV KON_GUN_DATA_PATH=/data
VOLUME /data
EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8765/health || exit 1

CMD ["node", "src/index.mjs"]
