# Spec-Drivr UI Testing Plan

## Overview
Systematic testing of the Spec-Drivr web application to ensure all user-facing features work correctly. We'll test with a systematic approach: write tests → run tests → identify bugs → fix bugs → retest.

## Testing Infrastructure
We'll use:
- **Playwright** for end-to-end (E2E) tests - tests the full user flow in a real browser
- **Jest + React Testing Library** for unit/integration tests - tests individual components
- **Custom test utilities** for seeding test data and managing database state

## Critical User Flows to Test

### 1. Authentication Flow
- [ ] User can access login page at `/auth/login`
- [ ] Login form validates username/password
- [ ] Successful login redirects to homepage
- [ ] Failed login shows error messages
- [ ] User session persists across page refreshes
- [ ] User can logout and session is cleared

### 2. Project Management
- [ ] User can view list of all projects in sidebar
- [ ] User can create new project via "New Project" button
- [ ] New project appears in sidebar after creation
- [ ] User can navigate to project detail page
- [ ] User can archive/delete projects (if functionality exists)

### 3. Project Detail Page
- [ ] Project name displays correctly
- [ ] Project description/mission displays correctly
- [ ] Constitution displays and can be edited
- [ ] Tech stack displays and can be edited
- [ ] Specifications can be viewed and edited
- [ ] Plans can be viewed and edited
- [ ] All editable fields save changes successfully

### 4. Task Management
- [ ] Tasks display in Kanban board (todo, in_progress, done, blocked columns)
- [ ] Tasks can be dragged and dropped between columns
- [ ] Task status persists after drag-and-drop
- [ ] User can create new tasks
- [ ] Task details display correctly (description, priority, files involved)
- [ ] Task priority is color-coded correctly
- [ ] User can mark tasks as retry/skip via agent controls

### 5. Agent Control Panel
- [ ] Agent status displays correctly (idle, running, paused, stopped, error)
- [ ] User can start agent via "Start Work" button
- [ ] Agent status updates in real-time when started
- [ ] User can pause agent
- [ ] User can stop agent
- [ ] User can retry project
- [ ] Current task being executed displays correctly
- [ ] Uptime counter works correctly
- [ ] Recent agent logs display correctly

### 6. Test Results & Logs
- [ ] Test results panel displays test data
- [ ] Agent logs panel displays execution logs
- [ ] User can manually add test results
- [ ] User can manually add agent logs

### 7. Data Persistence
- [ ] All changes persist after page refresh
- [ ] Database has correct indexes for performance
- [ ] No console errors in browser DevTools
- [ ] No network errors in browser DevTools

## Testing Process

### Phase 1: Setup & Infrastructure
1. Install Playwright and Jest
2. Create test utilities for database seeding
3. Create test configuration files
4. Set up test environment (separate test database)

### Phase 2: Write E2E Tests
1. Write login/logout tests
2. Write project creation/navigation tests
3. Write task management tests (drag-and-drop, create, edit)
4. Write agent control tests
5. Write data persistence tests

### Phase 3: Write Unit/Integration Tests
1. Test individual React components
2. Test API endpoints
3. Test database queries
4. Test authentication middleware

### Phase 4: Run Tests & Identify Issues
1. Run full test suite
2. Document all failures
3. Prioritize bugs by severity
4. Create bug fix tickets

### Phase 5: Fix Bugs & Retest
1. Fix critical bugs first
2. Fix high-priority bugs
3. Fix medium-priority bugs
4. Fix low-priority bugs
5. Retest after each fix

## Sample Test Data

We need sample data to test with:
- 1 admin user (username: `test-admin`, password: `test123`)
- 1 regular user (username: `test-user`, password: `test123`)
- 3+ projects (to test navigation and data loading)
- 10+ tasks per project (to test Kanban functionality)
- Test results and agent logs for existing tasks

## Getting Started

### Prerequisites
1. Start the dev server: `npm run dev`
2. Ensure database is running: `docker-compose up -d`
3. Seed initial data: `psql $DATABASE_URL < db/seed-demo.sql`

### Setup Testing Environment
```bash
# Install dependencies
npm install --save-dev @playwright/test @testing-library/react @testing-library/jest-dom

# Install Playwright browsers
npx playwright install

# Create test database
export TEST_DATABASE_URL="postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr_test"
```

### Run Tests
```bash
# Run all tests
npm run test

# Run E2E tests only
npm run test:e2e

# Run unit tests only
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Expected Timeline

- **Phase 1: Setup**: 2 hours
- **Phase 2: E2E Tests**: 6 hours
- **Phase 3: Unit Tests**: 4 hours
- **Phase 4: Bug Discovery**: 2 hours
- **Phase 5: Bug Fixes**: 6-12 hours (depends on bugs found)
- **Total**: 20-24 hours

## Success Criteria

- [ ] All critical user flows have E2E tests
- [ ] All key components have unit tests
- [ ] All critical bugs are fixed
- [ ] No console errors in production
- [ ] All user flows work end-to-end
- [ ] Test coverage > 80% for critical paths
- [ ] CI/CD pipeline runs tests automatically
- [ ] Documentation is complete and accurate
- [ ] Sample data can be seeded reliably
- [ ] Tests run in < 10 minutes total

## Next Steps

1. Set up testing infrastructure (playwright.config.ts, jest.config.js)
2. Create test utilities and helpers
3. Write first test: user can login
4. Run test and document results
5. Fix any issues found
6. Repeat for all critical flows
7. Create comprehensive test report

## Notes

- Use test database separate from development database
- Reset database before each test run
- Mock external services (if any)
- Use deterministic test data
- Document any manual testing steps needed
- Keep tests idempotent (can run multiple times without side effects)