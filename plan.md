# Spec-Drivr Development Plan

**Last Updated:** March 4, 2026  
**Current Status:** Core infrastructure complete, UI integration in progress

---

## Project Overview

**Goal:** Build an **Autonomous Development Platform** that operationalizes the "Spec-Driven Development" cycle by using PostgreSQL as a structured State Machine. The system enables AI agents (Claude) to execute complex engineering tasks while maintaining persistent memory across sessions.

**Current State:** The app is **core-feature complete** with a functioning database, API layer, and initial UI components. However, the frontend is not fully integrated with the backend, and several critical features are missing.

---

## What Has Been Completed ✅

### Infrastructure & Setup
- ✅ Next.js 14 project with App Router
- ✅ PostgreSQL 16 with Docker Compose
- ✅ Drizzle ORM configured and working
- ✅ TypeScript strict mode
- ✅ Tailwind CSS for styling
- ✅ ESLint and basic build configuration

### Database Layer
- ✅ Complete schema defined (projects, specifications, plans, tasks, test_results, agent_logs)
- ✅ Drizzle client and migrations set up
- ✅ Database seeded with initial project data
- ✅ Type-safe Drizzle types exported

### Agent Memory & API Layer
- ✅ Agent authentication middleware (`X-Agent-Token`)
- ✅ Agent memory utilities (`getNextTask`, `getProjectContext`, `updateTaskStatus`, etc.)
- ✅ Zod schemas for runtime validation
- ✅ API endpoints implemented:
  - `GET /api/agent/mission` - Get active specification, plan, and next task
  - `POST /api/agent/plans` - Create/update plans
  - `PATCH /api/agent/tasks/:id` - Update task status
  - `POST /api/agent/verify` - Log test results
  - `POST /api/agent/logs` - Add agent logs

### UI Components (Basic)
- ✅ ProjectSidebar component
- ✅ KanbanBoard component (with column grouping)
- ✅ TaskCard component
- ✅ TestResultsPanel component (basic)
- ✅ AgentLogs component (basic)
- ✅ SpecificationViewer component (basic)
- ✅ Home page layout

### Server-Side Logic
- ✅ Server actions for database operations
- ✅ Project CRUD (read, create)
- ✅ Task fetching and status updates

---

## What Is NOT Working / Incomplete ❌

### Critical Issues
1. **New Project button doesn't work** - Sidebar button shows alert instead of creating project
2. **Project selection not wired** - Clicking a project in sidebar doesn't load its data
3. **No project detail view** - Need a dedicated page for each project showing:
   - Active specification
   - Architecture plan
   - Tasks breakdown
4. **Kanban board shows hardcoded sample data** - Not pulling from actual project
5. **Environment configuration missing** - No `.env.local` setup instructions
6. **Database seed not run** - Need to execute migrations and seed data

### Feature Gaps
7. **Task creation from UI** - Can't create new tasks/plans from frontend
8. **Task drag-and-drop** - Kanban board doesn't allow status updates via UI
9. **Real-time updates** - No WebSocket or polling for live task updates
10. **Specification editor** - Can't create/edit specifications from UI
11. **Plan editor** - Can't create/edit plans from UI
12. **Test results integration** - No way to log test results from UI
13. **Agent logs viewer** - No pagination or search in agent logs

### Quality Gaps
14. **Error boundaries** - No global error handling
15. **Loading states** - Missing skeletons and loading indicators
16. **Form validation** - Need proper form components with Zod validation
17. **Database constraints** - Consider adding unique constraints, indexes
18. **API error handling** - Need standardized error responses
19. **Type safety gaps** - Some API routes may need better validation

---

## Implementation Plan (Priority Order)

### Phase 1: Fix Critical Issues (Week 1)

#### 1.1 Database Setup & Verification
- [ ] Create `.env.local` file with DATABASE_URL
- [ ] Run `npm run db:push` to create tables
- [ ] Execute `db/seed-simple.sql` to populate data
- [ ] Verify tables exist using `drizzle-kit studio`
- **Files:** `.env.local`, database state
- **Priority:** P0 (Blocking)
- **Dependencies:** None

#### 1.2 Fix New Project Button
- [ ] Create form modal/dialog component
- [ ] Wire up `createProject` action to button click
- [ ] Add form validation with Zod
- [ ] Success/error toast notifications
- [ ] Refresh project list after creation
- **Files:** `src/components/create-project-dialog.tsx`, `src/components/project-sidebar.tsx`
- **Priority:** P0 (User-facing)
- **Dependencies:** 1.1

#### 1.3 Add Project Selection & Routing
- [ ] Create dynamic project page: `src/app/projects/[id]/page.tsx`
- [ ] Add `onProjectSelect` handler in sidebar
- [ ] Update URL when project is selected
- [ ] Update layout to show active project context
- **Files:** `src/app/projects/[id]/page.tsx`, `src/components/project-sidebar.tsx`
- **Priority:** P0 (Navigation)
- **Dependencies:** 1.2

#### 1.4 Load Real Project Data into Kanban
- [ ] Update `getProjectTasks` action to actually query DB
- [ ] Wire project-specific data to KanbanBoard component
- [ ] Remove hardcoded sample data from page.tsx
- [ ] Show empty state when no tasks exist
- **Files:** `src/lib/actions.ts`, `src/app/projects/[id]/page.tsx`
- **Priority:** P0 (Core feature)
- **Dependencies:** 1.3

### Phase 2: Core Interactivity (Week 1-2)

#### 2.1 Interactive Kanban Board
- [ ] Add drag-and-drop library (react-beautiful-dnd or similar)
- [ ] Implement task status updates on drop
- [ ] Add optimistic UI updates with rollback
- [ ] Add animation for smooth transitions
- [ ] Show task details on click
- **Files:** `src/components/kanban-board.tsx`, `src/components/task-card.tsx`
- **Priority:** P1 (Core feature)
- **Dependencies:** 1.4

#### 2.2 Project Detail View Page
- [ ] Show selected project info (name, tech stack, base path)
- [ ] Display active specification with markdown rendering
- [ ] Show architecture decisions from plan
- [ ] Display task breakdown by status
- [ ] Add breadcrumb navigation
- **Files:** `src/app/projects/[id]/page.tsx`, new components
- **Priority:** P1 (UI completeness)
- **Dependencies:** 1.3

#### 2.3 View Task Details Modal
- [ ] Show full task description and details
- [ ] Display files involved in task
- [ ] Show dependencies (dependent and depended-on tasks)
- [ ] Show test results if available
- [ ] Show related agent logs
- **Files:** `src/components/task-details-modal.tsx`
- **Priority:** P1 (Usability)
- **Dependencies:** 2.1

### Phase 3: Advanced Features (Week 2-3)

#### 3.1 Create Plan Flow
- [ ] Add "Create Plan" button to project view
- [ ] Create plan designer form (JSON editor for architecture decisions)
- [ ] Validate plan structure
- [ ] Link spec to plan
- [ ] Mark plan as active
- **Files:** `src/components/create-plan-dialog.tsx`, `src/app/api/projects/[id]/plans/route.ts`
- **Priority:** P2 (Power user feature)
- **Dependencies:** 2.2

#### 3.2 Create Task Flow
- [ ] Add "Create Task" button in Kanban
- [ ] Create task form with:
  - Description
  - Files involved (array)
  - Priority
  - Dependency selection
- [ ] Link task to plan
- [ ] Validate inputs with Zod
- **Files:** `src/components/create-task-dialog.tsx`, `src/lib/actions.ts`
- **Priority:** P2 (Core workflow)
- **Dependencies:** 2.1

#### 3.3 Test Results Integration
- [ ] Add "Log Test Result" button on tasks
- [ ] Create test result form (success/fail, logs)
- [ ] Display test history for each task
- [ ] Show pass/fail badges on task cards
- [ ] Query and display test_results table
- **Files:** `src/components/test-results-panel.tsx`, `src/components/task-card.tsx`
- **Priority:** P2 (Verification loop)
- **Dependencies:** 2.3

#### 3.4 Agent Logs Viewer
- [ ] Create paginated logs view
- [ ] Add filtering by task/level
- [ ] Add search functionality
- [ ] Show timestamp and level indicators
- [ ] Add export functionality (JSON)
- **Files:** `src/components/agent-logs.tsx`, `src/app/projects/[id]/logs/page.tsx`
- **Priority:** P2 (Debugging)
- **Dependencies:** 2.2

### Phase 4: Polish & Optimization (Week 3)

#### 4.1 Error Handling & Validation
- [ ] Add global error boundary
- [ ] Implement proper API error responses (400/404/500)
- [ ] Add form validation feedback
- [ ] Add offline detection
- [ ] Add retry logic for failed requests
- **Files:** `src/app/error.tsx`, `src/app/api/middleware`, all forms
- **Priority:** P3 (Quality)
- **Dependencies:** All previous phases

#### 4.2 Loading & Skeleton States
- [ ] Create skeleton component
- [ ] Add loading states to all data-fetching pages
- [ ] Add loading indicators to buttons
- [ ] Add page transitions/animations
- **Files:** `src/components/skeleton.tsx`, all data-fetching pages
- **Priority:** P3 (UX)
- **Dependencies:** All previous phases

#### 4.3 Database Optimization
- [ ] Add indexes on foreign keys (project_id, spec_id, plan_id, task_id)
- [ ] Add compound indexes on frequently joined tables
- [ ] Optimize queries with better join strategies
- [ ] Add database constraints (unique, check)
- **Files:** `drizzle.config.ts`, migrations
- **Priority:** P3 (Performance)
- **Dependencies:** 1.1

#### 4.4 Documentation
- [ ] Document API endpoints
- [ ] Add deployment guide
- [ ] Create environment setup guide
- [ ] Add troubleshooting section to README
- **Files:** `README.md`, `docs/`
- **Priority:** P3 (Maintenance)
- **Dependencies:** All previous phases

### Phase 5: Advanced Agent Integration (Week 4+)

#### 5.1 Agent Communication Protocol
- [ ] Implement proper request/response logging
- [ ] Add request queuing system
- [ ] Add webhook support for agent callbacks
- [ ] Implement distributed locking for concurrent tasks
- **Files:** New API routes, database tables
- **Priority:** P4 (Future)
- **Dependencies:** All Phase 1-3

#### 5.2 Specification & Plan Versioning
- [ ] Track specification versions with diff support
- [ ] Track plan iterations with change history
- [ ] Add version comparison UI
- [ ] Add rollback functionality
- **Files:** Database schema updates, new components
- **Priority:** P4 (Future)
- **Dependencies:** Phase 1-3

#### 5.3 Task Templates & Presets
- [ ] Create library of common task templates
- [ ] Add quick-create buttons for common tasks
- [ ] Save task configurations as templates
- **Files:** New tables, new UI components
- **Priority:** P4 (Future)
- **Dependencies:** Phase 3

---

## Technical Debt & Known Issues

1. **Missing environment validation** - App should fail gracefully if DATABASE_URL is missing
2. **No request/response logging** - Agent requests aren't logged for debugging
3. **Default project assumption** - Code assumes project_id=1 in sample data
4. **Type safety gaps** - Some API responses could be better typed with Zod
5. **No WebSocket support** - Real-time updates would require Socket.io setup
6. **Missing transaction safety** - Multi-step operations could fail mid-way
7. **No backup/restore functionality** - Database changes aren't version controlled

---

## Database Tasks to Onboard

The following tasks should be created in the database to track implementation:

```sql
-- Phase 1 Tasks (Critical)
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id) VALUES
  (1, 'Set up .env.local with DATABASE_URL', 'todo', 1, '[".env.local"]', NULL),
  (1, 'Run database migrations (npm run db:push)', 'todo', 1, '["drizzle.config.ts"]', NULL),
  (1, 'Execute seed-simple.sql to populate data', 'todo', 1, '["db/seed-simple.sql"]', NULL),
  (1, 'Fix New Project button - wire up action', 'todo', 1, '["src/components/project-sidebar.tsx"]', NULL),
  (1, 'Create create-project-dialog component', 'todo', 1, '["src/components/create-project-dialog.tsx"]', NULL),
  (1, 'Add project routing - create [id]/page.tsx', 'todo', 1, '["src/app/projects/[id]/page.tsx"]', NULL),
  (1, 'Load real project data in Kanban board', 'todo', 1, '["src/lib/actions.ts"]', NULL);

-- Phase 2 Tasks (High Priority)
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id) VALUES
  (1, 'Add drag-and-drop to Kanban board', 'todo', 2, '["src/components/kanban-board.tsx"]', 38),
  (1, 'Create project detail view component', 'todo', 2, '["src/app/projects/[id]/page.tsx"]', 37),
  (1, 'Create task details modal component', 'todo', 2, '["src/components/task-details-modal.tsx"]', 40),
  (1, 'Add markdown rendering for specifications', 'todo', 2, '["src/components/specification-viewer.tsx"]', 40),
  (1, 'Display architecture decisions in UI', 'todo', 2, '["src/app/projects/[id]/page.tsx"]', 40),
  (1, 'Add breadcrumb navigation', 'todo', 2, '["src/components/breadcrumb.tsx"]', 40);

-- Phase 3 Tasks (Medium Priority)
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id) VALUES
  (1, 'Create plan designer form', 'todo', 2, '["src/components/create-plan-dialog.tsx"]', 41),
  (1, 'Create task creation form', 'todo', 2, '["src/components/create-task-dialog.tsx"]', 39),
  (1, 'Implement test result logging UI', 'todo', 2, '["src/components/test-results-panel.tsx"]', 42),
  (1, 'Build paginated agent logs viewer', 'todo', 2, '["src/components/agent-logs.tsx"]', 42),
  (1, 'Add search and filter to logs', 'todo', 3, '["src/components/agent-logs.tsx"]', 51);

-- Phase 4 Tasks (Polish)
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id) VALUES
  (1, 'Implement global error boundary', 'todo', 3, '["src/app/error.tsx"]', NULL),
  (1, 'Add API error handling standard', 'todo', 3, '["src/app/api/**"]', NULL),
  (1, 'Create skeleton/loading components', 'todo', 3, '["src/components/skeleton.tsx"]', NULL),
  (1, 'Add database indexes for performance', 'todo', 3, '["drizzle.config.ts"]', NULL),
  (1, 'Create API documentation', 'todo', 3, '["docs/API.md"]', NULL);
```

---

## Success Criteria

By the end of Phase 1, the app will:
- ✅ Have a functioning database with seed data
- ✅ Allow users to create new projects through the UI
- ✅ Display project-specific tasks in the Kanban board
- ✅ Show project details and specifications

By the end of Phase 3, the app will:
- ✅ Support full project lifecycle (create spec → plan → tasks → execute)
- ✅ Allow real-time collaboration on tasks
- ✅ Track and display test results
- ✅ Provide visibility into agent operations via logs

---

## Architecture Decisions

| Decision                  | Reasoning                                        | Trade-off                       |
| ------------------------- | ------------------------------------------------ | ------------------------------- |
| **Next.js 14 App Router** | Modern React patterns, better DX                 | Slightly larger bundle          |
| **Drizzle ORM**           | Type-safe, lightweight, great DX                 | Less ecosystem than TypeORM     |
| **PostgreSQL**            | State machine reliability, JSONB for flexibility | More setup than SQLite          |
| **Tailwind CSS**          | Utility-first, rapid iteration                   | Large CSS output                |
| **Server Actions**        | Simpler data fetching, reduced API boilerplate   | Less control over network layer |

---

## Next Immediate Actions

1. Verify `.env.local` exists with `DATABASE_URL`
2. Run `npm run db:push` to ensure migrations are applied
3. Execute `db/seed-simple.sql` or create seeding utility
4. Test `GET /api/agent/mission?project_id=1` to verify API works
5. Implement the Phase 1 tasks in order of dependency

---

## Questions to Resolve

1. Should tasks have estimated time/effort points?
2. Do we need task comments/discussions?
3. Should projects have multiple active specifications?
4. Do we need role-based access control (admin, developer, viewer)?
5. Should the agent be able to auto-assign tasks based on rules?

