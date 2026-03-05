#!/bin/bash

#
# Spec-Drivr Test Orchestrator
# Complete test management: setup, seed, run, report, cleanup
#

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DATABASE_URL=${DATABASE_URL:-"postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr"}
TEST_DATABASE_URL="postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr_test"

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
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

# Check if dev server is running
check_server() {
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Start dev server
start_dev_server() {
    print_header "Starting Dev Server"

    if check_server; then
        print_success "Dev server already running on port 3001"
        return 0
    fi

    print_warning "Starting dev server in background..."
    npm run dev > /tmp/nextjs-dev.log 2>&1 &

    # Wait for server
    echo "Waiting for dev server..."
    for i in {1..30}; do
        if check_server; then
            print_success "Dev server started!"
            return 0
        fi
        echo -n "."
        sleep 2
    done

    print_error "Failed to start dev server"
    exit 1
}

# Setup test database
setup_test_db() {
    print_header "Setting Up Test Database"

    # Note: For now, using main DB for testing
    print_warning "Using main database for testing (test DB setup skipped)"
    print_success "Database ready"
}

# Seed test data
seed_data() {
    print_header "Seeding Test Data"

    if [ -f "./tests/seed-test-data.mjs" ]; then
        node ./tests/seed-test-data.mjs
        print_success "Test data seeded"
    else
        print_error "seed-test-data.mjs not found"
        exit 1
    fi
}

# Run tests
run_e2e_tests() {
    print_header "Running E2E Tests"

    npx playwright test "$@"
    local EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        print_success "All E2E tests passed!"
    else
        print_error "Some E2E tests failed"
        return $EXIT_CODE
    fi

    return $EXIT_CODE
}

run_unit_tests() {
    print_header "Running Unit Tests"

    npm run test:unit
    local EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        print_success "All unit tests passed!"
    else
        print_error "Some unit tests failed"
        return $EXIT_CODE
    fi

    return $EXIT_CODE
}

# Generate report
generate_report() {
    print_header "Generating Test Report"

    if [ -d "./test-results" ]; then
        npx playwright show-report
        print_success "Report opened in browser"
    else
        print_warning "No test results found to generate report"
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup    - Setup test environment"
    echo "  seed     - Seed test data"
    echo "  e2e      - Run E2E tests"
    echo "  unit     - Run unit tests"
    echo "  all      - Run all tests"
    echo "  report   - Generate HTML report"
    echo "  help     - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 setup"
    echo "  $0 seed"
    echo "  $0 e2e"
    echo "  $0 all"
    echo "  $0 report"
}

# Main command handler
case "${1:-all}" in
    setup)
        start_dev_server
        setup_test_db
        ;;

    seed)
        seed_data
        ;;

    e2e)
        start_dev_server
        run_e2e_tests "${@:2}"
        ;;

    unit)
        run_unit_tests
        ;;

    all)
        start_dev_server
        setup_test_db
        seed_data
        print_header "Running All Tests"
        run_unit_tests
        run_e2e_tests
        ;;

    report)
        generate_report
        ;;

    help|--help|-h)
        usage
        ;;

    *)
        echo "Unknown command: $1"
        usage
        exit 1
        ;;
esac