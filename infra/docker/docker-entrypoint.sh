#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Running database migrations..."
pnpm db:migrate

echo "[entrypoint] Checking seed status..."
USER_COUNT=$(node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT COUNT(*) FROM users')
  .then(r => { console.log(r.rows[0].count); pool.end(); })
  .catch(() => { console.log('0'); pool.end(); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" -eq 0 ] 2>/dev/null; then
  echo "[entrypoint] Seeding demo data..."
  pnpm db:seed
fi

echo "[entrypoint] Starting Next.js..."
exec pnpm start
