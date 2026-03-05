# Spec-Drivr Testing Guide

## Overview
Comprehensive testing documentation for Spec-Drivr web application. This guide covers infrastructure, test plans, and systematic testing procedures.

## Table of Contents
1. [Testing Infrastructure](#testing-infrastructure)
2. [API Testing](#api-testing)
3. [UI Testing](#ui-testing)
4. [Quick Start](#quick-start)
5. [Systematic Testing Workflow](#systematic-testing-workflow)

---

## Testing Infrastructure

### Frameworks Used
- **Playwright** - End-to-end (E2E) testing in real browsers
- **Jest + React Testing Library** - Unit and integration tests
- **Custom utilities** - Database seeding and state management

### Configuration Files
- `playwright.config.ts` - E2E test configuration
- `jest.config.js` - Unit test configuration
- `jest.setup.js` - Jest setup with mocks

### Test Scripts
- `tests/seed-test-data.js` - Seeds test database
- `tests/run-tests.sh` - Complete test orchestration
- `tests/quickstart.sh` - One-time setup script

### Package.json Scripts
```bash
npm run test:seed    # Seed test data
npm run test:e2e     # Run E2E tests
npm run test:unit    # Run unit tests
npm run test:all     # All tests
npm run test:ui      # Debug UI mode
npm run test:report  # View HTML report
```

Complete test script reference:
```bash
# Setup
./tests/quickstart.sh                # One-time full setup
./tests/run-tests.sh setup          # Setup test DB only
./tests/run-tests.sh seed           # Seed data only

# Execute Tests
./tests/run-tests.sh unit           # Unit tests only
./tests/run-tests.sh e2e            # E2E tests only
./tests/run-tests.sh all            # All tests (comprehensive)
npm run test:e2e                    # Simple E2E execution

# Reports
./tests/run-tests.sh report         # Generate HTML report
npm run test:ui                     # Debug with UI
```

---

## API Testing

### Agent Core APIs
- [ ] GET `/api/agent/mission?project_id=1`
- [ ] POST `/api/agent/projects` - Create agent-controlled project
- [ ] POST `/api/agent/plans` - Create plan for agent
- [ ] PATCH `/api/agent/tasks/:id` - Update task status
- [ ] POST `/api/agent/verify` - Log test results
- [ ] POST `/api/agent/logs` - Add agent logs
- [ ] GET `/api/agent/projects/:id` - Agent queries project state
- [ ] PATCH `/api/agent/projects/:id` - Agent updates project config
- [ ] POST `/api/agent/tasks` - Agent creates tasks

### Admin APIs
- [x] GET `/api/admin/users` - List users (Tested - PASSED)
- [x] POST `/api/admin/users` - Create user (Tested - PASSED)
- [x] PATCH `/api/admin/users/:id` - Update user (Tested - PASSED, Bug #5 found & fixed)
- [x] DELETE `/api/admin/users/:id` - Delete user (Tested - PASSED)

### Authentication APIs
- [ ] POST `/api/auth/login` - User login
- [ ] GET `/api/auth/session` - Get session
- [ ] POST `/api/auth/logout` - Logout
- [ ] POST `/api/auth/auto-login` - Dev mode auto-login (Tested - PASSED, Bug found & fixed)

### Project APIs
- [x] GET `/api/projects/:id/agent/status` - Agent control status (Tested - PASSED)
- [x] POST `/api/projects/:id/agent/start` - Start agent (created)
- [x] POST `/api/projects/:id/agent/pause` - Pause agent (created)
- [x] POST `/api/projects/:id/agent/stop` - Stop agent (created)
- [x] POST `/api/projects/:id/agent/retry` - Retry agent (created)
- [x] POST `/api/tasks/:id/agent/retry` - Retry task (created)
- [x] POST `/api/tasks/:id/agent/skip` - Skip task (created)

### Task APIs
- [ ] POST `/api/tasks/:id/tests` - Log task test results
- [ ] POST `/api/tasks/:id/logs` - Add task logs

### Webhook APIs
- [ ] POST `/api/webhooks/git` - Git webhook (created)

### Testing Priority Order
1. **GET endpoints** (data fetching)
2. **POST endpoints** (data creation)
3. **PATCH endpoints** (data updates)
4. **DELETE endpoints** (data removal)

Testing methodology:
1. Make request (with proper auth via cookies)
2. Check status code
3. Check response body
4. Verify database state
5. Document result
6. Move to next endpoint

---

## UI Testing

### Critical User Flows

#### 1. Authentication Flow
- [ ] User can access login page at `/auth/login`
- [ ] Login form validates username/password
- [ ] Successful login redirects to homepage
- [ ] Failed login shows error messages
- [ ] User session persists across page refreshes
- [ ] User can logout and session is cleared

#### 2. Project Management
- [ ] User can view list of all projects in sidebar
- [ ] User can create new project via "New Project" button
- [ ] New project appears in sidebar after creation
- [ ] User can navigate to project detail page
- [ ] User can archive/delete projects (if functionality exists)

#### 3. Project Detail Page
- [ ] Project name displays correctly
- [ ] Project description/mission displays correctly
- [ ] Constitution displays and can be edited
- [ ] Tech stack displays and can be edited
- [ ] Specifications can be viewed and edited
- [ ] Plans can be viewed and edited
- [ ] All editable fields save changes successfully

#### 4. Task Management
- [ ] Tasks display in Kanban board (todo, in_progress, done, blocked columns)
- [ ] Tasks can be dragged and dropped between columns
- [ ] Task status persists after drag-and-drop
- [ ] User can create new tasks
- [ ] Task details display correctly (description, priority, files involved)
- [ ] Task priority is color-coded correctly
- [ ] User can mark tasks as retry/skip via agent controls

#### 5. Agent Control Panel
- [ ] Agent status displays correctly (idle, running, paused, stopped, error)
- [ ] User can start agent via "Start Work" button
- [ ] Agent status updates in real-time when started
- [ ] User can pause agent
- [ ] User can stop agent
- [ ] User can retry project
- [ ] Current task being executed displays correctly
- [ ] Uptime counter works correctly
- [ ] Recent agent logs display correctly

#### 6. Test Results & Logs
- [ ] Test results panel displays test data
- [ ] Agent logs panel displays execution logs
- [ ] User can manually add test results
- [ ] User can manually add agent logs

#### 7. Data Persistence
- [ ] All changes persist after page refresh
- [ ] Database has correct indexes for performance
- [ ] No console errors in browser DevTools
- [ ] No network errors in browser DevTools

### Test Data Setup

#### Required Sample Data
1. **Users**: 1 admin, 1 developer, 1 viewer (✅ Created via provisioning)
2. **Project**: Test project with status='active' (✅ Created via seeding)
3. **Tasks**: Multiple tasks in different statuses (✅ Created via seeding)
4. **Logs**: Agent logs with project_id (Need to create)

#### Test Users Created:
- `test-admin` / `test123` (admin role)
- `test-user` / `test123` (user role)

#### Test Projects Created:
- **Test Project Alpha** - Task management system with 5 tasks
- **Test Project Beta** - Agent control features with 4 tasks

All projects have:
- Specifications (markdown docs)
- Architecture plans (JSON)
- Tasks in various statuses
- Test data for E2E testing

---

## Quick Start

### Prerequisites
1. Start the dev server: `npm run dev`
2. Ensure database is running: `docker-compose up -d`
3. Seed initial data: `psql $DATABASE_URL < db/seed-demo.sql`

### One-Time Setup
Run the quickstart script:
```bash
./tests/quickstart.sh
```

**Expected output:**
```
🚀 Spec-Drivr Testing Quickstart

Step 1: Checking environment...
  ✓ .env.local exists or created
  ✓ Node.js: v18.x.x
  ✓ npm: 9.x.x

Step 2: Installing dependencies...
  ✓ Packages installed

Step 3: Starting database...
  ✓ Database container running

Step 4: Setting up database schema...
  ✓ Database schema pushed

Step 5: Seeding test data...
  ✓ Created admin user: test-admin / test123
  ✓ Created regular user: test-user / test123
  ✓ Created project: Test Project Alpha
  ✓ Created project: Test Project Beta

✅ Setup complete!
```

**If you see errors:**
- Docker not running? → `docker-compose up -d`
- Port conflict? → `npm run killall`
- Database error? → `npm run db:push`

### Manual Setup
```bash
# 1. Start database
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Push schema
npm run db:push

# 4. Seed test data
npm run test:seed

# 5. Start app (Terminal 1)
npm run dev

# 6. Run tests (Terminal 2)
npm run test:e2e
```

### Verify Setup
```bash
# Check dev server is running
curl -I http://localhost:3001
# Should show HTTP 200 OK

# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Check test data
psql $DATABASE_URL -c "SELECT username FROM users;"
# Should show: test-admin, test-user
```

### Run Tests
```bash
# Run all tests
npm test

# Run E2E tests only
npm run test:e2e

# Run unit tests only
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## Systematic Testing Workflow

### The Cycle (Write → Run → Fix → Retest)

```
1. Write test → Define expected behavior
2. Run test → See if it passes
3. If fails → Debug (use --debug or --ui)
4. Identify bug → Root cause analysis
5. Fix bug → Apply minimal fix
6. Re-run test → Verify fix works
7. Repeat → Until test passes
8. Add more tests → Coverage grows
9. End result → Working application ✅
```

### Step-by-Step Process

#### Step 1: Setup (5 minutes)
```bash
./tests/quickstart.sh
```

#### Step 2: Start Application (Terminal 1)
```bash
npm run dev
```

**Verify it's working:**
```bash
curl -I http://localhost:3001
# Should show HTTP 200 OK
```

Leave this terminal running. ✅

#### Step 3: Run First Test Suite (Terminal 2)
We'll start with just auth tests:

```bash
# Run just the auth tests
npx playwright test tests/e2e/auth.spec.ts
```

**Expected output:**

### If passing:
```
Running 7 tests using 1 worker

  ✓  1 User can access login page (2.3s)
  ✓  2 Login form validates required fields (2.1s)
  ✓  3 Successful login with test credentials (3.2s)
  ✓  4 Failed login shows error message (2.5s)
  ✓  5 Show/hide password functionality (1.7s)
  ✓  6 Username field should be focused on load (1.4s)
  ✓  7 Session persists after refresh (2.8s)

  7 passed (15.6s)
```

### If failing (expected - we need bugs to fix!):
```
Running 7 tests using 1 worker

  ✓  1 User can access login page (2.3s)
  ✓  2 Login form validates required fields (2.1s)
  ✗  3 Successful login with test credentials (3.2s)
  ✓  4 Failed login shows error message (2.5s)
  ✓  5 Show/hide password functionality (1.7s)

  5 passed, 1 failed (12.4s)

  1) auth.spec.ts:71:9 › Authentication Flow › Successful login with test credentials

    Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
```

This is **EXACTLY** what we want! Now we have specific bugs to fix.

#### Step 4: Identify and Document Bugs

For each failing test, document:

```markdown
**Bug Report #1: Brief description**
- **Test**: Test name
- **Failure**: Expected vs actual behavior
- **Root Cause**: Why it's happening
- **Fix**: Solution or action needed
- **Status**: 🔴 Open / 🟡 In Progress / 🟢 Fixed
```

#### Step 5: Debug Individual Test

```bash
# Run with debug mode to see what's happening
npx playwright test tests/e2e/auth.spec.ts:71 --debug
```

This opens a browser and shows you exactly what's happening.

**What to look for:**
1. Does the page load? ✅
2. Are the form fields present? ✅
3. Does clicking submit work? ✅
4. Is the error message correct? ✅

#### Step 6: Apply Fix

Common issues and fixes:

**Issue #1: Wrong error message text**
- **Test expects**: "Please enter your username"
- **Actually shows**: "Username is required"
- **Fix**: Update component text to match test expectation

**Issue #2: Wrong port number**
- **Test expects**: http://localhost:3001
- **Server actually on**: http://localhost:3000
- **Fix**: Change `playwright.config.ts` baseURL to match server

**Issue #3: Missing data-testid**
- **Test looks for**: `[data-testid="project-sidebar"]`
- **Component doesn't have**: data-testid attribute
- **Fix**: Add missing data-testid to component

**Issue #4: Delayed redirect**
- **Test expects**: Immediate redirect after login
- **Actually happens**: Redirect takes 2 seconds
- **Fix**: Add explicit wait in test

#### Step 7: Re-run Test After Fix

```bash
# After fixing bugs, run full suite
npx playwright test tests/e2e/auth.spec.ts
```

**Expected:** All tests pass

```
Running 7 tests using 1 worker

  ✓  1 User can access login page
  ✓  2 Login form validates required fields
  ✓  3 Successful login with test credentials
  ✓  4 Failed login shows error message
  ✓  5 Show/hide password functionality
  ✓  6 Username field should be focused on load
  ✓  7 Session persists after refresh

  7 passed (12.4s)
```

🎉 **Success!** You've completed one full testing cycle.

#### Step 8: Expand to More Features

Repeat the cycle for each feature:
1. Project management
2. Task management (drag-and-drop)
3. Agent controls
4. Test results & logs
5. Data persistence

### During Development

```bash
# Debug mode
npx playwright test --debug

# UI mode (interactive debugging)
npm run test:ui

# Watch mode (auto-rerun on changes)
npm run test:unit -- --watch

# Single test file
npx playwright test tests/e2e/auth.spec.ts

# Single test by name
npx playwright test -g "specific test name"
```

### For Bug Investigation

```bash
# View test trace
npx playwright show-trace tests-results/...trace.zip

# Database explorer
npm run db:studio

# View logs
psql $DATABASE_URL -c "SELECT * FROM agent_logs ORDER BY timestamp DESC LIMIT 20;"
```

---

## Tools Available

### Quick Reference

```bash
# Full workflow - Just run this!
./tests/quickstart.sh    # Setup
npm run dev             # Terminal 1 - Start app
npm run test:e2e        # Terminal 2 - Run tests

# Individual steps
npm run test:seed       # Seed data
docker-compose up -d    # Start DB
npm run db:push         # Push schema
npx playwright test     # Run all E2E tests

# Debug
npm run test:ui         # Debug mode
npx playwright test --debug tests/file.ts:line

# Reports
npm run test:report     # HTML report
npx playwright show-report
```

---

## Success Criteria

### Definition of "Working Application"
- ✅ All critical flows have tests
- ✅ >90% of tests pass
- ✅ No critical bugs
- ✅ No console errors in normal use
- ✅ Users can complete their tasks
- ✅ No crashes or hangs

### When to Stop Testing
Stop when:
- [X] Core features work reliably
- [X] Known bugs are documented (not necessarily all fixed)
- [X] Test coverage is comprehensive
- [X] Edge cases are covered
- [X] No high-severity bugs
- [X] App is production-ready (or demo-ready)

---

## Test Coverage Plan

### Phase 1: Authentication (✅ Tests Written)
- [x] User can access login page
- [x] Login form validates required fields
- [x] Successful login with test credentials
- [x] Failed login shows error message
- [x] Password show/hide functionality
- [x] Username field auto-focus
- [x] Session persists after refresh
- [x] Login with Enter key
- [x] Login with disabled account shows error
- [x] Protected routes redirect

### Phase 2: Project Management (📝 Ready to Write)
- [ ] View project list in sidebar
- [ ] Create new project via dialog
- [ ] Navigate to project detail page
- [ ] Edit project description
- [ ] Edit project constitution
- [ ] Edit tech stack

### Phase 3: Task Management (📝 Ready to Write)
- [ ] Drag-and-drop between columns
- [ ] Create new task
- [ ] View task details
- [ ] Edit task description
- [ ] Change task priority
- [ ] Add/remove files involved
- [ ] Mark task as done
- [ ] Mark task as blocked

### Phase 4: Agent Controls (📝 Ready to Write)
- [ ] View agent status
- [ ] Start agent work
- [ ] Pause agent work
- [ ] Stop agent work
- [ ] View current task being executed
- [ ] View agent uptime
- [ ] View recent agent logs

### Phase 5: Data Persistence (📝 Ready to Write)
- [ ] Changes persist after refresh
- [ ] No console errors
- [ ] No network errors
- [ ] Proper loading states

---

## Additional Resources

- `TESTING_SUMMARY.md` - Testing infrastructure status/dashboard
- `tests/` - Test code directory
- `claude.md` - Developer guide (see Testing section)

## 🎬 Ready to Start Testing!

1. **Setup**: Run `./tests/quickstart.sh`
2. **Start**: `npm run dev` (Terminal 1)
3. **Test**: `npm run test:e2e` (Terminal 2)
4. **Review**: Document failures
5. **Fix**: Address bugs
6. **Iterate**: Retest until passing

**Goal**: End with an application that works reliably with no critical bugs.
