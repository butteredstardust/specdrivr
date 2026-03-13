#!/bin/bash
# Specdrivr Bootstrap Script - Fresh Ubuntu Container

set -e

echo "=== Specdrivr Bootstrap ==="

# Check Ubuntu version
echo "Ubuntu version: $(lsb_release -d | cut -f2)"

# Install Node Version Manager (nvm)
echo "Installing nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
# Load nvm but don't auto-use from .nvmrc yet
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" --no-use

# Install Node.js from .nvmrc
if [ -f ".nvmrc" ]; then
  NODE_VERSION=$(cat .nvmrc | tr -d '\r')
  echo "Installing Node.js v$NODE_VERSION..."
  nvm install $NODE_VERSION
  nvm use $NODE_VERSION
else
  echo "Error: .nvmrc not found"
  exit 1
fi

# Verify Node.js
node --version

# Install pnpm
echo "Installing pnpm..."
npm install -g pnpm
pnpm --version

# Install PostgreSQL
echo "Installing PostgreSQL..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL using pg_ctlcluster
echo "Starting PostgreSQL..."
sudo pg_ctlcluster $(ls /etc/postgresql) main start

# Start Redis
echo "Starting Redis..."
sudo service redis-server start

# Create database and user
sudo -u postgres psql -c "CREATE USER specdrivr WITH PASSWORD 'specdrivr_password';" || echo "User might already exist"
sudo -u postgres psql -c "CREATE DATABASE specdrivr OWNER specdrivr;" || echo "Database might already exist"

# Install project dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Set up environment
echo "Setting up environment..."
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo "Created .env.local from .env.example"
  else
    echo "Error: .env.example not found"
    exit 1
  fi
fi

# Run migrations
echo "Applying database schema..."
pnpm db:migrate

# Optional: Seed demo data
echo "Seeding demo data..."
pnpm db:seed || echo "Seed failed or not configured"

# Build the project
echo "Building project..."
pnpm build

# Run unit tests
echo "Running unit tests..."
pnpm test:unit

# Run linting
echo "Running linting..."
pnpm lint

# Run type checking
echo "Running type checking..."
pnpm typecheck

echo "=== Bootstrap Complete ==="
echo "Next steps:"
echo "1. Review and update .env.local with any other required variables"
echo "2. Run: pnpm db:migrate (if new migrations exist)"
echo "3. Optional: pnpm db:seed"
echo "4. Start development: pnpm dev"
