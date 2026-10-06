#!/bin/bash
# Start script container dashboard-v2.
# Model deploy: opencode serve jalan di HOST via systemd (deploy/pasang-opencode-serve.sh),
# container ini HANYA Next.js dan menjangkau serve via host.docker.internal:4096.
set -e

echo "[start] DB_PATH=${DB_PATH:-./data/ujion.db}"
mkdir -p "$(dirname "${DB_PATH:-/data/ujion.db}")"

# 1. Migrasi schema (idempoten)
echo "[start] drizzle-kit push..."
npx drizzle-kit push 2>&1 | tail -2 || true

# 2. Seed bila tabel models masih kosong
EMPTY=$(node -e "
try {
  const D = require('better-sqlite3');
  const db = D(process.env.DB_PATH || './data/ujion.db');
  console.log(db.prepare('SELECT count(*) AS c FROM models').get().c);
} catch (e) { console.log('ERR'); }
" 2>/dev/null || echo ERR)
if [ "$EMPTY" = "0" ]; then
  echo "[start] DB kosong, seed..."
  npx tsx src/lib/db/seed.ts
else
  echo "[start] DB sudah terisi (models=${EMPTY}), seed dilewati."
fi

# 3. Jalan sebagai Next.js standalone
echo "[start] node server.js"
exec node server.js
