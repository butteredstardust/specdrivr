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

# Start PostgreSQL using robust method
echo "Starting PostgreSQL..."
if command -v service &> /dev/null; then
    sudo service postgresql start
elif command -v systemctl &> /dev/null; then
    sudo systemctl start postgresql
elif command -v pg_ctlcluster &> /dev/null; then
    sudo pg_ctlcluster $(ls /etc/postgresql | head -n1) main start
else
    echo "Error: Could not start PostgreSQL automatically. Please start it manually."
    exit 1
fi

# Install Redis
echo "Installing Redis..."
sudo apt install -y redis-server

# Start Redis
echo "Starting Redis..."
if command -v service &> /dev/null; then
    sudo service redis-server start
elif command -v systemctl &> /dev/null; then
    sudo systemctl start redis-server
else
    echo "Error: Could not start Redis automatically. Please start it manually."
    exit 1
fi

# Create database and user (ignore errors if they exist)
echo "Creating database user and database..."
sudo -u postgres psql -c "CREATE USER specdrivr WITH PASSWORD 'specdrivr_password';" 2>/dev/null || echo "User might already exist"
sudo -u postgres psql -c "CREATE DATABASE specdrivr OWNER specdrivr;" 2>/dev/null || echo "Database might already exist"

# Set up environment early (needed for subsequent steps)
echo "Setting up environment..."
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo "Created .env.local from .env.example"
  else
    echo "Error: .env.example not found"
    exit 1
  fi
else
    echo ".env.local already exists, skipping copy."
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
    # Continue anyway to allow bootstrapping, but warn
fi

# Install project dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Check that required binaries are available
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm is not installed or not in PATH"
    exit 1
fi

# Push database schema
echo "Applying database schema..."
pnpm run db:push

# Optional: Seed demo data (only if seed script exists)
if pnpm run db:seed --help &>/dev/null; then
    echo "Seeding demo data..."
    pnpm db:seed || echo "Seed failed or not fully configured"
else
    echo "Skipping database seeding (no seed script configured)."
fi

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
echo "2. Verify .env.local values are not placeholders"
echo "3. Optional: modify .env.local for your specific setup"
echo "4. Start development: pnpm dev"
