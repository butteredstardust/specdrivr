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
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Install Node.js from .nvmrc
if [ -f ".nvmrc" ]; then
  NODE_VERSION=$(cat .nvmrc)
  echo "Installing Node.js v$NODE_VERSION..."
  nvm install $NODE_VERSION
  nvm use $NODE_VERSION
else
  echo "Error: .nvmrc not found"
  exit 1
fi

# Verify Node.js and npm
node --version
npm --version

# Install PostgreSQL 16
echo "Installing PostgreSQL 16..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER specdrivr WITH PASSWORD 'specdrivr_password';"
sudo -u postgres psql -c "CREATE DATABASE specdrivr OWNER specdrivr;"

# Install project dependencies
echo "Installing dependencies..."
npm ci

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

# DATABASE_URL already correct in .env.example, no need to update

# Push database schema
echo "Applying database schema..."
npm run db:push

# Optional: Seed demo data
echo "Seeding demo data..."
npm run db:seed || echo "Seed failed or not configured"

# Build the project
echo "Building project..."
npm run build

echo "=== Bootstrap Complete ==="
echo "Next steps:"
echo "1. Review and update .env.local with any other required variables"
echo "2. Run: npm run db:push"
echo "3. Optional: npm run db:seed"
echo "4. Start development: npm run dev"
