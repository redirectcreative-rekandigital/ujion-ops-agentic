# dashboard-v2/Dockerfile — image VPS/Coolify (11-DOCKER-COOLIFY.md).
# Model: container HANYA Next.js. opencode serve jalan di HOST via systemd
# (dashboard-v2/deploy/pasang-opencode-serve.sh), dijangkau via host.docker.internal:4096.
# Stage 1: Dependencies
FROM node:20-slim AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (builder butuh full deps termasuk dev)
RUN npm ci || npm install

# Stage 2: Build
FROM node:20-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (standalone)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

# Stage 3: Runtime
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /data /workspace

# Prod dependencies penuh (agar npx drizzle-kit / tsx valid termasuk .bin)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Built Next.js standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Drizzle: config + schema + seed untuk migrate/seed saat start
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src/lib/db ./src/lib/db

# Start script: migrate + seed + start
COPY --from=builder /app/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 3000

# Healthcheck (node:20-slim tanpa wget → pakai node fetch)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["/app/start.sh"]
