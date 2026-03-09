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
        echo "Warning: .env.example not found. Ensure environment variables are set."
    fi
fi

# 3. Install Dependencies
echo "Installing project dependencies..."
# We use pnpm install to ensure node_modules is up to date based on pnpm-lock.yaml
pnpm install --frozen-lockfile

# 4. Wait for PostgreSQL and setup database
echo "Checking PostgreSQL..."
# Start postgresql service if not running (useful in some container environments based on ubuntu)
if command -v sudo &> /dev/null && command -v systemctl &> /dev/null; then
    sudo systemctl start postgresql || true
fi

# Wait until pg_isready is successful
if command -v pg_isready &> /dev/null; then
    echo "Waiting for PostgreSQL to be ready..."
    until pg_isready -U postgres -h localhost >/dev/null 2>&1; do
        sleep 1
    done
    echo "PostgreSQL is ready."
else
    echo "Warning: pg_isready not found, skipping wait. Ensure PostgreSQL is running."
fi

# 5. Database Schema Push
echo "Applying database schema..."
pnpm run db:push

# 6. Database Seeding
# Currently, there is no active database seed script.
# Setup documentation for `db:seed` commands should be avoided until a seed script is formally introduced.
# We skip the seed step to respect current project state.
echo "Skipping database seeding (no seed script configured)."

echo "=== Snapshot Initialization Complete ==="

# If arguments are passed, execute them (useful for ENTRYPOINT usage)
if [ $# -gt 0 ]; then
    echo "Executing command: $@"
    exec "$@"
fi
