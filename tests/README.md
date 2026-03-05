# Spec-Drivr Testing Guide

## 📋 Overview

Comprehensive testing infrastructure for Spec-Drivr using Playwright (E2E) and Jest (unit tests).

## 🏗️ Testing Infrastructure

### Frameworks Used
- **Playwright** - End-to-end testing in real browsers
- **Jest + React Testing Library** - Unit and integration tests
- **Custom Test Utilities** - Helper functions and test data management

### Directory Structure
```
tests/
├── e2e/                    # End-to-end tests
│   └── auth.spec.ts       # Authentication tests
├── utils/                 # Test utilities
│   └── test-helpers.ts    # Helper functions
├── seed-test-data.mjs     # Database seeding script
├── run-tests.sh          # Test orchestration script
├── quickstart.sh         # One-time setup
└── README.md            # This file
```

## 🚀 Quick Start

### First Time Setup (5 minutes)
```bash
./tests/quickstart.sh
```

This will:
1. ✅ Install dependencies
2. ✅ Setup Playwright browsers
3. ✅ Configure database
4. ✅ Seed test data
5. ✅ Start dev server
6. ✅ Run first test

### Manual Setup
```bash
# 1. Install dependencies
npm install --save-dev @playwright/test
npx playwright install

# 2. Start dev server (Terminal 1)
npm run dev

# 3. Seed test data (Terminal 2)
node ./tests/seed-test-data.mjs

# 4. Run tests
npm run test:e2e
```

## 🔧 Test Scripts

### Run Tests
```bash
# E2E tests
npm run test:e2e

# Run specific test
npx playwright test tests/e2e/auth.spec.ts

# Debug mode (opens browser)
npm run test:ui

# Unit tests
npm run test:unit

# All tests
./tests/run-tests.sh all

# Generate report
npm run test:report
```

### Test Data Management
```bash
# Seed test data
node ./tests/seed-test-data.mjs

# or via npm script
npm run test:seed
```

## 🧪 Test Coverage

### Authentication Tests (`tests/e2e/auth.spec.ts`)
- ✅ Login page access
- ✅ Form validation
- ✅ Successful login
- ✅ Failed login errors
- ✅ Password show/hide
- ✅ Field auto-focus
- ✅ Session persistence
- ✅ Protected routes

### Test Utilities (`tests/utils/test-helpers.ts`)
- ✅ Login/logout helpers
- ✅ Test user credentials
- ✅ Navigation helpers
- ✅ Element selectors
- ✅ Custom assertions

## 📊 Test Data

### Test Users
```javascript
const testUsers = {
  admin: { username: 'test-admin', password: 'test123' },
  user: { username: 'test-user', password: 'test123' },
}
```

### Test Projects
1. **Test Project Alpha** - Task management with 5 tasks
2. **Test Project Beta** - Agent controls with 4 tasks

## 🔍 Debugging

### View Last Test Run
```bash
npx playwright show-report
```

### Debug Specific Test
```bash
# Opens browser for debugging
npx playwright test -g "test name" --debug

# UI mode
npm run test:ui
```

### Check Test Results
```bash
# Results directory
ls test-results/

# Screenshots
open test-results/*/test-failed-1.png

# Videos
open test-results/*/video.webm

# Error context
cat test-results/*/error-context.md
```

## 🐛 Common Issues

### Dev server not starting
```bash
# Kill any process on port 3001
lsof -ti:3001 | xargs kill -9

# Then restart
npm run dev
```

### Database connection error
```bash
# Check database is running
docker-compose up -d

# Verify connection
psql $DATABASE_URL -c "SELECT 1"

# Reset if needed
docker-compose down -v && docker-compose up -d
npm run db:push
```

### Tests failing to run
```bash
# Ensure dev server is running
curl http://localhost:3001

# Check test data is seeded
node ./tests/seed-test-data.mjs

# Reinstall playwright
npx playwright install
```

## 📖 Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('test description', async ({ page }) => {
  await page.goto('/path');
  await page.locator('selector').click();
  await expect(page).toHaveURL('/expected');
});
```

### Using Test Helpers
```typescript
import { testUsers, login } from '../utils/test-helpers';

test('protected route', async ({ page }) => {
  await login(page, testUsers.admin);
  await page.goto('/protected');
  // ... test logic
});
```

### Adding Data Test IDs
```tsx
// In your React component
<button data-testid="submit-button">Submit</button>

// In test
await page.locator('[data-testid="submit-button"]').click();
```

## 🎯 Continuous Integration

### CI/CD Integration
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    npm run test:seed
    npm run test:e2e
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
npm run test:unit
npx playwright test --grep-invert "@slow"
```

## 📚 Best Practices

### Test Writing
1. **Use descriptive test names** - what is being tested
2. **Add data-testid attributes** - makes tests resilient
3. **Clean up after tests** - reset state
4. **Use test helpers** - avoid duplication
5. **Document edge cases** - complex scenarios

### Database Testing
1. **Always seed fresh data** - avoid state pollution
2. **Use separate test data** - don't mix with dev data
3. **Clean up test records** - if needed
4. **Test with realistic data** - edge cases
5. **Validate constraints** - foreign keys, uniqueness

### Performance Testing
1. **Test loading states** - don't wait forever
2. **Use appropriate timeouts** - 30s for navigation, 5s for UI
3. **Run in parallel** - use test.describe.parallel
4. **Reuse contexts** - faster than recreating

## 🤝 Contributing

### Adding New Tests
1. Add test to `tests/e2e/` or `tests/unit/`
2. Follow existing patterns
3. Use test helpers
4. Update this README
5. Run full suite before committing

### Reporting Issues
1. Run test with `--debug`
2. Attach screenshots/videos
3. Include error context
4. Note reproduction steps

## 📞 Support

### Getting Help
1. Read `TESTING_PLAN.md` for strategy
2. Check `TESTING_SUMMARY.md` for status
3. Review test output
4. Check database connectivity
5. Verify dev server is running

### Commands Reference
```bash
# Development
npm run dev              # Start dev server
npm run dev:clean       # Clean start (kills existing)
npm run killall         # Kill all Next.js processes

# Database
npm run db:push         # Push schema
npm run db:studio       # Open Drizzle Studio
docker-compose up       # Start PostgreSQL

# Testing
npm run test:seed       # Seed test data
npm run test:e2e        # Run E2E tests
npm run test:ui         # Debug UI mode
npm run test:report     # Generate report
./tests/run-tests.sh    # Full orchestration
```

---

## 🎬 Quick Commands

```bash
# Run this once: ./tests/quickstart.sh

# Then use these commands:
npm run test:e2e        # Run E2E tests
npm run test:ui         # Debug mode
npm run test:seed       # Reseed data
npm run test:report     # View report
```

**Happy Testing! 🧪**