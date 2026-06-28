# ---------- stage 1: build the web frontend ----------
FROM node:22-bookworm-slim AS web-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ---------- stage 2: install server production deps ----------
FROM node:22-bookworm-slim AS server-deps
WORKDIR /app/server
# build-essential + python3 let better-sqlite3 compile if no prebuilt binary matches
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY server/package*.json ./
RUN npm ci --omit=dev

# ---------- stage 3: runtime ----------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# server code + its production node_modules
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/package*.json ./server/
COPY server/src ./server/src

# built SPA, served by the server at runtime (single-port deployment)
COPY --from=web-builder /app/web/dist ./web/dist

# SQLite lives here; mount a volume to persist data across restarts
ENV DB_PATH=/data/data.sqlite
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 4000
ENV PORT=4000

# basic container healthcheck
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

WORKDIR /app/server
CMD ["node", "src/index.js"]
