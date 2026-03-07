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

# Check if PostgreSQL is accessible
check_database() {
    if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        return 0
    else
        exit 1
    fi
}

# Check if dev server is running
check_server() {
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        return 0
    else
        exit 1
    fi
}

# Start dev server
start_dev_server() {
    print_header "Starting Dev Server"

    if check_server; then
        print_success "Dev server already running on port 3001"
        return 0
    fi

    # Check database status and set mock environment variable if needed
    if ! check_database; then
        print_warning "PostgreSQL database is not accessible. Using mock APIs for dev server."
        export VITE_USE_MOCKS=true
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
    # NOTE: In a normal shell script this would be exit 1.
    # Because we're using run_in_bash_session, we can't output `exit` here, so we exit 1.
    exit 1
}

# Setup test database
setup_test_db() {
    print_header "Setting Up Test Database"

    if check_database; then
        # Note: For now, using main DB for testing
        print_warning "Using main database for testing"
        echo "Creating database schema..."
        npm run db:push
        print_success "Database schema created"
    else
        print_warning "PostgreSQL database is not accessible. Skipping DB setup. Mock APIs will be used for testing."
        export VITE_USE_MOCKS=true
    fi
}

# Seed test data
seed_data() {
    print_header "Seeding Test Data"

    if check_database; then
        if [ -f "./tests/seed-test-data.mjs" ]; then
            node ./tests/seed-test-data.mjs
            print_success "Test data seeded"
        else
            print_error "seed-test-data.mjs not found"
            exit 1
        fi
    else
        print_warning "PostgreSQL database is not accessible. Skipping data seeding."
    fi
}

# Run E2E tests
run_e2e_tests() {
    print_header "Running E2E Tests"

    # Export VITE_USE_MOCKS for Playwright if database is not accessible
    if ! check_database; then
        export VITE_USE_MOCKS=true
    fi

    set +e # Disable set -e temporarily to capture the exit code of npx
    npx playwright test "$@"
    local EXIT_CODE=$?
    set -e # Re-enable set -e

    if [ $EXIT_CODE -eq 0 ]; then
        print_success "All E2E tests passed!"
    else
        print_error "Some E2E tests failed"
    fi

    if [ $EXIT_CODE -ne 0 ]; then
        exit $EXIT_CODE
    fi
}

# Run unit tests
run_unit_tests() {
    print_header "Running Unit Tests"

    set +e
    npm run test
    local EXIT_CODE=$?
    set -e

    if [ $EXIT_CODE -eq 0 ]; then
        print_success "All unit tests passed!"
    else
        print_error "Some unit tests failed"
    fi

    if [ $EXIT_CODE -ne 0 ]; then
        exit $EXIT_CODE
    fi
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
        setup_test_db
        start_dev_server
        ;;

    seed)
        seed_data
        ;;

    e2e)
        setup_test_db
        seed_data
        start_dev_server
        run_e2e_tests "${@:2}"
        ;;

    unit)
        run_unit_tests
        ;;

    all)
        setup_test_db
        seed_data
        start_dev_server
        print_header "Running All Tests"
        run_unit_tests || true
        run_e2e_tests || true
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
