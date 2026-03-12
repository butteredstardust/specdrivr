#!/bin/bash
set -e

# Specdrivr Local CI Simulator
# Mirrors GitHub Actions environment exactly

echo "🚀 Starting Local CI Simulation..."

# Ensure we are in the root directory
cd "$(dirname "$0")/.."

# Build and start services
echo "📦 Building and starting Docker services..."
docker-compose -f docker-compose.ci.yml up -d --build runner

# Helper to run commands in the runner
function run_in_runner() {
  echo "🏃 Executing: $1"
  docker-compose -f docker-compose.ci.yml exec -T runner bash -c "$1"
}

# 1. Install dependencies
run_in_runner "pnpm install"

# 2. Lint
echo "🔍 Running Lint..."
run_in_runner "pnpm lint --max-warnings 0"

# 3. Type Check
echo "🏷️ Running Type Check..."
run_in_runner "pnpm tsc --noEmit"

# 4. Database Setup
echo "🗄️ Setting up database..."
run_in_runner "pnpm db:migrate"

# 5. Run Tests
echo "🧪 Running Unit Tests..."
run_in_runner "pnpm vitest run"

# 6. E2E Tests (Optional, slow)
# echo "🎭 Running E2E Tests..."
# run_in_runner "pnpm exec playwright install --with-deps && pnpm test:e2e"

echo "✅ Local CI Simulation passed!"

# Optionally stop services
# docker-compose -f docker-compose.ci.yml down
