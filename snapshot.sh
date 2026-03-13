#!/bin/bash
# snapshot.sh - Create an environment snapshot for faster container initialization and development startup.
# This script ensures dependencies are installed, database is ready, and schema is pushed.
# It can be used as an ENTRYPOINT or a postStart hook in a development container.

set -e

echo "=== Specdrivr Environment Snapshot Initialization ==="

# 1. Source nvm to ensure node and pnpm are available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
else
    echo "Warning: nvm.sh not found in $NVM_DIR"
fi

# Verify Node.js and pnpm
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH. Please run bootstrap.sh first."
    # Use return instead of exit if sourced, else exit
    (return 0 2>/dev/null) && return 1 || bash -c "exit 1"
fi

if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing..."
    npm install -g pnpm
fi

echo "Node.js version: $(node --version)"
echo "pnpm version: $(pnpm --version)"

# 2. Setup Environment Variables
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env.local from .env.example..."
        cp .env.example .env.local
    else
        echo "Error: .env.example not found"
        exit 1
    fi
fi

# Validate environment variables (check for placeholders)
echo "Validating environment variables..."
PLACEHOLDER_COUNT=$(grep -Eo 'your-|example-' .env.local | wc -l)
if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
    echo "⚠️  Warning: .env.local contains placeholder values that need to be replaced."
    echo "   Please edit .env.local and set real values for:"
    grep -Eo 'your-|example-' .env.local | sed 's/.*=//' | sort -u | while read -r var; do
        echo "   - $var"
    done
    echo ""
    echo "The application may not work correctly until these are updated."
fi

# 3. Install Dependencies
echo "Installing project dependencies..."
pnpm install --frozen-lockfile

# 4. Wait for PostgreSQL
echo "Checking PostgreSQL..."
if command -v sudo &> /dev/null && command -v systemctl &> /dev/null; then
    sudo systemctl start postgresql || true
fi

if command -v pg_isready &> /dev/null; then
    echo "Waiting for PostgreSQL to be ready..."
    until pg_isready -U postgres -h localhost >/dev/null 2>&1; do
        sleep 1
    done
    echo "PostgreSQL is ready."
else
    echo "Warning: pg_isready not found, skipping wait. Ensure PostgreSQL is running."
fi

# 4b. Wait for Redis (if redis-cli is available)
echo "Checking Redis..."
if command -v redis-cli &> /dev/null; then
    echo "Waiting for Redis to be ready..."
    until redis-cli ping &>/dev/null; do
        sleep 1
    done
    echo "Redis is ready."
else
    echo "Warning: redis-cli not found, skipping Redis check. Ensure Redis is running."
fi

# 5. Database Schema Push
echo "Applying database schema..."
pnpm run db:push

# 6. Database Seeding
# Seed only if a seed script is configured
if pnpm run db:seed --help &>/dev/null; then
    echo "Seeding demo data..."
    pnpm db:seed || echo "Seed failed or not fully configured"
else
    echo "Skipping database seeding (no seed script configured)."
fi

echo "=== Snapshot Initialization Complete ==="

# If arguments are passed, execute them (useful for ENTRYPOINT usage)
if [ $# -gt 0 ]; then
    echo "Executing command: $@"
    exec "$@"
fi
