#!/bin/bash

#
# Spec-Drivr Quickstart Script
# One-time complete setup for testing
#

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Spec-Drivr Testing Quickstart                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
print_header "Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

# Check if docker is available (optional)
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3)
    print_success "Docker found: $DOCKER_VERSION"
else
    print_warning "Docker not found. Database must be running manually."
fi

# Check if PostgreSQL is running
DATABASE_URL=${DATABASE_URL:-"postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr"}
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    print_success "PostgreSQL database is accessible"
else
    print_error "Cannot connect to PostgreSQL database"
    print_warning "Start database with: docker-compose up -d"
    exit 1
fi

echo ""

# Install dependencies
print_header "Installing Dependencies"

if [ -f "package.json" ]; then
    echo "Installing npm packages..."
    npm install

    echo "Installing Playwright browsers..."
    npx playwright install

    print_success "Dependencies installed"
else
    print_error "package.json not found. Are you in the right directory?"
    exit 1
fi

echo ""

# Setup database
print_header "Setting Up Database"

echo "Creating database schema..."
npm run db:push
print_success "Database schema created"

echo ""

# Seed test data
print_header "Seeding Test Data"

node ./tests/seed-test-data.mjs
print_success "Test data seeded"

echo ""

# Verify dev server
print_header "Starting Dev Server"

echo "Starting Next.js dev server..."
echo "This will run in the background and take 30-60 seconds to start"
echo ""

# Check if server is already running
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "Dev server already running on port 3001"
else
    print_warning "Starting dev server in background..."
    npm run dev > /tmp/nextjs-dev.log 2>&1 &

    echo "Waiting for dev server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            print_success "Dev server started successfully!"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
fi

echo ""

# Run first test
print_header "Running First Test"

echo "Running E2E test suite..."
npx playwright test tests/e2e/auth.spec.ts --reporter=list

TEST_EXIT=$?

if [ $TEST_EXIT -eq 0 ]; then
    print_success "Tests passed!"
else
    print_warning "Some tests failed. This is expected initially."
fi

echo ""

# Summary
print_header "✅ Setup Complete!"

echo ""
echo "🚀 Quickstart Succeeded!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Keep the dev server running (Terminal 1)"
echo "   - Server: http://localhost:3001"
echo "   - Logs: tail -f /tmp/nextjs-dev.log"
echo ""
echo "2. Run all tests (Terminal 2):"
echo "   npm run test:e2e"
echo ""
echo "3. Run tests in debug mode:"
echo "   npm run test:ui"
echo ""
echo "4. Generate test report:"
echo "   npm run test:report"
echo ""
echo "5. Reset test data:"
echo "   npm run test:seed"
echo ""
echo "📖 For detailed documentation, see:"
echo "   - TESTING_PLAN.md (testing strategy)"
echo "   - tests/README.md (detailed guide)"
echo ""
echo "🎯 All tests are ready to run!"
echo ""