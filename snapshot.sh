#!/bin/bash
# snapshot.sh - Create an environment snapshot for faster container initialization and development startup.
# This script ensures dependencies are installed, database is ready, and schema is pushed.
# It can be used as an ENTRYPOINT or a postStart hook in a development container.

set -e
export DEBIAN_FRONTEND=noninteractive

echo "=== Specdrivr Environment Snapshot Initialization ==="

# Helper function: run command as postgres user
as_postgres() {
    if [ "$(id -u)" -eq 0 ]; then
        su -s /bin/bash -c "$*" postgres
    elif command -v sudo &> /dev/null; then
        sudo -u postgres "$@"
    else
        echo "Error: Cannot run as postgres user. Install sudo or run as root."
        exit 1
    fi
}

# Helper function: run command with sudo if needed
run_with_sudo() {
    if [ "$(id -u)" -eq 0 ]; then
        "$@"
    elif command -v sudo &> /dev/null; then
        sudo "$@"
    else
        echo "Error: Need root privileges to run: $*" >&2
        exit 1
    fi
}

# 1. Source nvm to ensure node and pnpm are available (if nvm is installed)
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
else
    echo "Warning: nvm.sh not found in $NVM_DIR"
fi

# 2. Ensure Node.js is installed (via nvm if available)
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing via nvm..."
    # Ensure nvm is available
    if ! command -v nvm &> /dev/null; then
        if [ ! -s "$NVM_DIR/nvm.sh" ]; then
            echo "Installing nvm..."
            # Ensure curl is available
            if ! command -v curl &> /dev/null; then
                echo "curl not found. Installing curl..."
                run_with_sudo apt-get update
                run_with_sudo apt-get install -y curl
            fi
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        fi
        # Source nvm after installation
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    fi
    # Install Node.js from .nvmrc
    if [ -f ".nvmrc" ]; then
        NODE_VERSION=$(cat .nvmrc | tr -d '\r')
        echo "Installing Node.js v$NODE_VERSION..."
        nvm install $NODE_VERSION
        nvm use $NODE_VERSION
    else
        echo "Error: .nvmrc not found and Node.js not installed"
        exit 1
    fi
fi

echo "Node.js version: $(node --version)"

# 3. Ensure pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing..."
    npm install -g pnpm
fi

echo "pnpm version: $(pnpm --version)"

# 4. Ensure essential build tools are available (needed for native modules)
if ! command -v git &> /dev/null || ! command -v make &> /dev/null || ! command -v g++ &> /dev/null || ! command -v python3 &> /dev/null; then
    echo "Installing essential build tools..."
    run_with_sudo apt-get update
    run_with_sudo apt-get install -y git build-essential python3
fi

# 5. Setup Environment Variables
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env.local from .env.example..."
        cp .env.example .env.local
    else
        echo "Error: .env.example not found"
        exit 1
    fi
fi

# Auto-replace placeholder values with generated ones for fresh setups
if [ -f ".env.local" ]; then
    # Helper functions to generate random strings using node crypto
    generate_secret_hex() {
        node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
    }
    generate_token_hex() {
        node -e "process.stdout.write(require('crypto').randomBytes(25).toString('hex'))"
    }
    # Replace known placeholders if present
    if grep -q "NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars" .env.local; then
        SECRET=$(generate_secret_hex)
        sed -i "s/your-nextauth-secret-min-32-chars/$SECRET/" .env.local
    fi
    if grep -q "BETTER_AUTH_SECRET=your-better-auth-secret-min-32-chars" .env.local; then
        SECRET=$(generate_secret_hex)
        sed -i "s/your-better-auth-secret-min-32-chars/$SECRET/" .env.local
    fi
    if grep -q "CRON_SECRET=your-cron-secret-min-32-chars" .env.local; then
        SECRET=$(generate_secret_hex)
        sed -i "s/your-cron-secret-min-32-chars/$SECRET/" .env.local
    fi
    if grep -q "your_password" .env.local; then
        sed -i "s/your_password/specdrivr_password/" .env.local
    fi
    if grep -q "RESEND_API_KEY=re_your_api_key_here" .env.local; then
        RAND=$(node -e "process.stdout.write(require('crypto').randomBytes(20).toString('hex'))")
        sed -i "s/re_your_api_key_here/re_$RAND/" .env.local
    fi
    if grep -q "GITHUB_TOKEN=ghp_your_github_token_here" .env.local; then
        TOKEN=$(generate_token_hex)
        sed -i "s/ghp_your_github_token_here/ghp_$TOKEN/" .env.local
    fi
    if grep -q "GITHUB_WEBHOOK_SECRET=your_github_webhook_secret_here" .env.local; then
        SECRET=$(generate_secret_hex)
        sed -i "s/your_github_webhook_secret_here/$SECRET/" .env.local
    fi
fi

# Validate environment variables (check for remaining placeholders)
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

# Load environment variables from .env.local into this shell
if [ -f ".env.local" ]; then
    set -a
    . .env.local
    set +a
fi

# 6. Install project dependencies
echo "Installing project dependencies..."
pnpm install --frozen-lockfile

# 7. Setup and start PostgreSQL
echo "Setting up PostgreSQL..."

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL not found. Installing..."
    run_with_sudo apt-get update
    run_with_sudo apt-get install -y postgresql postgresql-contrib
fi

# Start PostgreSQL using available method
started_pg=false
if command -v service &> /dev/null; then
    run_with_sudo service postgresql start && started_pg=true || true
fi
if [ "$started_pg" = false ] && command -v systemctl &> /dev/null; then
    run_with_sudo systemctl start postgresql && started_pg=true || true
fi
if [ "$started_pg" = false ] && command -v pg_ctlcluster &> /dev/null; then
    PG_VERSION=$(ls /etc/postgresql | head -n1)
    run_with_sudo pg_ctlcluster $PG_VERSION main start && started_pg=true || true
fi
if [ "$started_pg" = false ]; then
    echo "Warning: Could not start PostgreSQL automatically. Please start it manually."
fi

# Wait for PostgreSQL to be ready
if command -v pg_isready &> /dev/null; then
    echo "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if as_postgres pg_isready &>/dev/null; then
            echo "PostgreSQL is ready."
            break
        fi
        sleep 1
    done
    if ! as_postgres pg_isready &>/dev/null; then
        echo "Error: PostgreSQL did not become ready in time."
        exit 1
    fi
else
    echo "Warning: pg_isready not found, skipping wait. Ensure PostgreSQL is running."
fi

# Create database user and database (if they don't exist)
DB_USER="specdrivr"
DB_PASSWORD="specdrivr_password"
DB_NAME="specdrivr"

echo "Creating database user and database..."
as_postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User $DB_USER might already exist"
as_postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Database $DB_NAME might already exist"

# 8. Setup and start Redis
echo "Setting up Redis..."

# Install Redis if not present
if ! command -v redis-server &> /dev/null; then
    echo "Redis not found. Installing..."
    run_with_sudo apt-get install -y redis-server
fi

# Start Redis
started_redis=false
if command -v service &> /dev/null; then
    run_with_sudo service redis-server start && started_redis=true || true
fi
if [ "$started_redis" = false ] && command -v systemctl &> /dev/null; then
    run_with_sudo systemctl start redis-server && started_redis=true || true
fi
if [ "$started_redis" = false ]; then
    echo "Warning: Could not start Redis automatically. Ensure Redis is running."
fi

# Wait for Redis to be ready if redis-cli is available
if command -v redis-cli &> /dev/null; then
    echo "Waiting for Redis to be ready..."
    for i in {1..30}; do
        if redis-cli ping &>/dev/null; then
            echo "Redis is ready."
            break
        fi
        sleep 1
    done
    if ! redis-cli ping &>/dev/null; then
        echo "Error: Redis did not become ready in time."
        exit 1
    fi
else
    echo "Warning: redis-cli not found, skipping wait. Ensure Redis is running."
fi

# 9. Database Schema Push
echo "Applying database schema..."
pnpm run db:push

# 10. Database Seeding (optional)
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
