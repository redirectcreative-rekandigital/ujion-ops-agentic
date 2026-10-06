# 11 — Docker & Coolify Deployment

## Arsitektur Deployment

```
┌─── Coolify VPS ────────────────────────────────────────────┐
│                                                            │
│  ┌─── docker-compose ──────────────────────────────────┐   │
│  │                                                     │   │
│  │  ┌─── dashboard ─────────┐  ┌─── opencode ───────┐ │   │
│  │  │ Next.js (port 3000)   │  │ opencode serve     │ │   │
│  │  │ - shadcn/ui           │  │ port 4096          │ │   │
│  │  │ - SQLite (/data)      │  │ - agents           │ │   │
│  │  │ - Config sync         │  │ - skills           │ │   │
│  │  └───────┬───────────────┘  └────────┬───────────┘ │   │
│  │          │                           │             │   │
│  │          └───── HTTP proxy ──────────┘             │   │
│  │                                                     │   │
│  │  Volumes:                                           │   │
│  │  - ujion-data → /data (SQLite)                     │   │
│  │  - ~/proyek/ujion-ops → /workspace/ujion-ops       │   │
│  │  - ~/proyek/ujion-tka-apps → /workspace/ujion-tka-apps│ │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  Coolify: domain + SSL + reverse proxy → dashboard:3000   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Dockerfile

### dashboard/Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-slim AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Stage 2: Build
FROM node:20-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci && npm run build && npm prune --omit=dev

# Stage 3: Runtime
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Install opencode (for TUI access via SSH)
RUN npm install -g opencode@latest

# Create data directory
RUN mkdir -p /data /workspace

# Copy built Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy drizzle config & schema (for migrations)
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src/lib/db ./src/lib/db

# Expose ports
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start script: migrate + start + opencode serve
COPY <<'EOF' /app/start.sh
#!/bin/bash
set -e

# Run database migration
npx drizzle-kit push 2>/dev/null || true

# Run seed if DB is empty
node -e "
const Database = require('better-sqlite3');
const db = new Database('/data/ujion.db');
const count = db.prepare('SELECT count(*) as c FROM agents').get();
if (count.c === 0) {
  console.log('DB empty, running seed...');
  require('./src/lib/db/seed');
}
" 2>/dev/null || true

# Start opencode serve in background
cd /workspace/ujion-ops
opencode serve --hostname 0.0.0.0 --port 4096 &
echo "opencode serve started on port 4096"

# Start Next.js
cd /app
exec node server.js
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
```

## docker-compose.yml

### Root: `ujion-ops/docker-compose.yml`

```yaml
version: "3.8"

services:
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    container_name: ujion-dashboard
    ports:
      - "3000:3000"
    environment:
      # Auth
      DASHBOARD_PIN: ${DASHBOARD_PIN:-245100}
      JWT_SECRET: ${JWT_SECRET}
      MASTER_KEY: ${MASTER_KEY}

      # opencode
      OPENCODE_SERVER_URL: http://localhost:4096
      OPENCODE_SERVER_PASSWORD: ${OPENCODE_SERVER_PASSWORD}

      # Paths
      WORKSPACE_PATH: /workspace/ujion-ops
      UJION_OPS_PATH: /workspace/ujion-ops
      UJION_TKA_APPS_PATH: /workspace/ujion-tka-apps
      DB_PATH: /data/ujion.db

      # Provider API Keys (opsional, bisa di-set via dashboard UI)
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY:-}
      QWEN_API_KEY: ${QWEN_API_KEY:-}
      MISTRAL_API_KEY: ${MISTRAL_API_KEY:-}
      GROQ_API_KEY: ${GROQ_API_KEY:-}
      TOGETHER_API_KEY: ${TOGETHER_API_KEY:-}

      # Node
      NODE_ENV: production
    volumes:
      # Persistent SQLite data
      - ujion-data:/data
      # ujion-ops repo (read-write untuk .opencode/ sync)
      - ${UJION_OPS_HOST_PATH:-~/proyek/ujion-ops}:/workspace/ujion-ops
      # ujion-tka-apps repo (read-only untuk agent context)
      - ${UJION_TKA_APPS_HOST_PATH:-~/proyek/ujion-tka-apps}:/workspace/ujion-tka-apps:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  ujion-data:
    driver: local
```

## .env.example (untuk Coolify)

File ini tidak di-commit. Set sebagai environment variables di Coolify dashboard.

```env
# Auth
DASHBOARD_PIN=245100
JWT_SECRET=<generate: openssl rand -hex 32>
MASTER_KEY=<generate: openssl rand -hex 32>

# opencode
OPENCODE_SERVER_PASSWORD=<your-password>

# Host paths (untuk volume mounts)
UJION_OPS_HOST_PATH=/root/proyek/ujion-ops
UJION_TKA_APPS_HOST_PATH=/root/proyek/ujion-tka-apps

# Provider API Keys (opsional)
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
QWEN_API_KEY=
MISTRAL_API_KEY=
GROQ_API_KEY=
TOGETHER_API_KEY=
```

## .dockerignore

### dashboard/.dockerignore

```
node_modules
.next
.git
.env.local
.env*.local
data/
*.md
docs/
contoh/
```

## Health Check Endpoint

### src/app/api/health/route.ts

```typescript
export async function GET() {
  return Response.json({
    healthy: true,
    timestamp: new Date().toISOString(),
  });
}
```

## Coolify Deployment Steps

### 1. Persiapan VPS

```bash
# Pastikan kedua repo ada di VPS
ls -la ~/proyek/
# harus ada: ujion-ops/ dan ujion-tka-apps/

# Clone jika belum ada
cd ~/proyek
git clone git@github.com:YOU/ujion-ops.git
git clone git@github.com:YOU/ujion-tka-apps.git
```

### 2. Setup di Coolify

1. Login ke Coolify dashboard (biasanya `http://<VPS-IP>:8000`)
2. **New Resource** → **Docker Compose Empty**
3. **Name**: `ujion-dashboard`
4. **Docker Compose File**: paste isi `docker-compose.yml` di atas
5. Atau pilih **From Git Repository**:
   - Repository: `ujion-ops`
   - Branch: `main`
   - Build Pack: `Docker Compose`
   - Docker Compose Location: `/docker-compose.yml`

### 3. Set Environment Variables

Di Coolify → project → Environment Variables:

| Variable | Value |
|---|---|
| `DASHBOARD_PIN` | `245100` |
| `JWT_SECRET` | (generate random 64 hex) |
| `MASTER_KEY` | (generate random 64 hex) |
| `OPENCODE_SERVER_PASSWORD` | (your password) |
| `UJION_OPS_HOST_PATH` | `/root/proyek/ujion-ops` (atau path VPS Anda) |
| `UJION_TKA_APPS_HOST_PATH` | `/root/proyek/ujion-tka-apps` |
| `OPENAI_API_KEY` | (opsional, bisa via dashboard UI) |
| `DEEPSEEK_API_KEY` | (opsional) |

### 4. Domain & SSL

Di Coolify:
1. Set domain: `dashboard.yourdomain.com` (ataau pakai IP)
2. Coolify auto-provision SSL via Let's Encrypt
3. Expose port 3000

### 5. Deploy

1. Click **Deploy**
2. Tunggu build selesai (5-10 menit pertama)
3. Check logs di Coolify untuk error
4. Akses `https://dashboard.yourdomain.com`
5. Masukkan PIN: `245100`

### 6. Post-Deploy Verification

```bash
# Check container status
docker ps | grep ujion

# Check dashboard health
curl http://localhost:3000/api/health

# Check opencode serve
curl http://localhost:4096/global/health

# Check SQLite
docker exec ujion-dashboard sqlite3 /data/ujion.db "SELECT count(*) FROM agents;"

# Check .opencode/ generated
ls -la ~/proyek/ujion-ops/.opencode/agents/
cat ~/proyek/ujion-ops/opencode.json
```

## Persistent Data

| Data | Location | Backup |
|---|---|---|
| SQLite DB | Docker volume `ujion-data` → `/data/ujion.db` | Coolify volume backup |
| .opencode/ agents | Host: `~/proyek/ujion-ops/.opencode/` | Git (di-commit oleh sync) |
| opencode.json | Host: `~/proyek/ujion-ops/opencode.json` | Git |
| tugas/marketing/maintenance .md | Host: `~/proyek/ujion-ops/tugas/` dll | Git |
| opencode sessions | Host: `~/.local/share/opencode/` | Manual backup |

## Update Deployment

```bash
# Pull latest code
cd ~/proyek/ujion-ops
git pull origin main

# Coolify auto-rebuild jika using Git
# Atau manual: Coolify → Deploy → Redeploy
```

## SSH Access untuk opencode TUI

opencode TUI tetap bisa dipakai via SSH:

```bash
# SSH ke VPS
ssh root@your-vps

# Pastikan opencode config ada
cd ~/proyek/ujion-ops
ls -la .opencode/agents/
cat opencode.json

# Run opencode TUI
opencode
# atau dengan agent spesifik
opencode run --agent joko-manager "Buat kampanye IG 2 minggu"
```

opencode TUI akan membaca `.opencode/` yang sama dengan yang di-generate dashboard.

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Dashboard tidak bisa connect ke opencode | Cek `OPENCODE_SERVER_URL` env var. Di single-container, harus `http://localhost:4096` |
| SQLite locked | Pastikan hanya satu process yang akses DB. Next.js di container, opencode di host |
| .opencode/ tidak ter-generate | Cek `WORKSPACE_PATH` env var. Pastikan volume mount benar |
| Permission denied writing .opencode/ | Cek permission host directory. `chmod -R 777 ~/proyek/ujion-ops/.opencode/` |
| opencode TUI tidak baca agent | Pastikan `.opencode/agents/` ada di working directory saat run opencode |
| Build timeout di Coolify | Tambah `timeout` di Coolify build settings. Next.js build butuh 5-10 menit |
