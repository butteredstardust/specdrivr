#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not installed"; exit 1; }

# Detect compose command
if docker compose version >/dev/null 2>&1; then DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then DC="docker-compose"
else echo "ERROR: docker compose not found"; exit 1; fi

echo "[specdrivr] Building and starting all services..."
$DC up --build -d

echo "[specdrivr] Waiting for app to be ready on port 3000..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:3000 >/dev/null 2>&1; then break; fi
  if [ "$i" -eq 60 ]; then echo "ERROR: app did not start in time"; $DC logs app; exit 1; fi
  sleep 2
done

echo ""
echo "  App ready:  http://localhost:3000"
echo "  Login:      alex@specdrivr.dev / Password123!"
echo ""
echo "  Logs:  docker compose logs -f app"
echo "  Stop:  docker compose down"
