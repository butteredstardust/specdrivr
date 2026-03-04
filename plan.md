# Spec-Drivr Development Plan

**Last Updated:** March 5, 2026
**Current Status:** 80% Complete - Core infrastructure & Agent Control APIs complete

## Project Summary

**Goal:** Build an Autonomous Development Platform enabling AI agents and humans to collaboratively build software through a PostgreSQL state machine with spec-driven workflows.

**Status:** Core platform operational. Agent can execute tasks, humans can create/monitor projects via UI. Missing human feature parity for full collaboration.

## What Has Been Completed ✅ (Phases 1-3)

### Infrastructure Foundation
- ✅ Next.js 14 with App Router and TypeScript strict mode
- ✅ PostgreSQL 16 with Docker Compose
- ✅ Drizzle ORM configured with full schema
- ✅ Tailwind CSS styling with Shadcn/UI components

### Database Schema (6 Tables)
- ✅ `projects` - Project metadata (with agent control fields: agent_status, agent_started_at, agent_stopped_at)
- ✅ `specifications` - Versioned project specs (markdown content, is_active)
- ✅ `plans` - Architecture decisions (JSON, draft/active/completed/archived status)
- ✅ `tasks` - Implementation tasks (with retry_count, notes, completed_at, dependency_task_id)
- ✅ `test_results` - Test verification logs (success, logs, timestamp)
- ✅ `agent_logs` - Agent execution logs (with project_id for faster filtering)
- ✅ `users` - User accounts (username, password_hash, avatar, is_admin)

### Agent API Layer (Full Feedback Loop)
- ✅ `GET /api/agent/mission` - Retrieve active spec, plan, and next task
- ✅ `POST /api/agent/plans` - Create/update architecture plans
- ✅ `PATCH /api/agent/tasks/:id` - Update task status through workflow
- ✅ `POST /api/agent/verify` - Log test results
- ✅ `POST /api/agent/logs` - Add agent execution logs
- ✅ `X-Agent-Token` authentication middleware
- ✅ Zod validation schemas for all endpoints

### Agent Control System (NEW)
- ✅ Project-level controls: GET/POST /api/projects/:id/agent/{start,pause,stop,retry,status}
- ✅ Task-level controls: POST /api/tasks/:id/agent/{retry,skip}
- ✅ Real-time status polling for frontend
- ✅ Database fields for tracking agent state (status, uptime, errors)

### UI Components (Core Functionality)
- ✅ Drag-and-drop Kanban board (@dnd-kit implementation)
- ✅ Task cards with priority indicators and draggable between columns
- ✅ Project sidebar navigation with all projects listed
- ✅ Project detail pages with specification viewer
- ✅ Create project dialog with form validation
- ✅ Test results panel (placeholder structure)
- ✅ Agent logs panel (placeholder structure)

### Database Seeds
- ✅ seed-simple.sql - 2 basic projects for initial testing
- ✅ seed-demo.sql - 3 comprehensive projects with realistic data
- ✅ seed-onboarding.sql - Self-onboarding data (shows 100+ completed tasks)
- ✅ All seeds include projects, specs, plans, tasks, test results, and agent logs

## What Is NOT Working / Incomplete ❌

### Phase 4: Human Feature Parity (CRITICAL - Next)

The platform currently enables agents to perform operations that humans cannot via UI. For true collaboration, humans need equivalent capabilities:

#### 4.1 Human Task Creation (Agent: POST /api/agent/tasks, Human: ❌)
- **Problem:** Humans cannot create tasks via UI; must use SQL/API directly
- **Solution:** Create task creation dialog in Kanban board
- **Database:** Use existing `tasks` table (no schema changes needed)
- **Files:** New `src/components/create-task-dialog.tsx`, update Kanban board

#### 4.2 Human Plan Editor (Agent: POST /api/agent/plans, Human: ❌)
- **Problem:** Humans cannot create/edit architecture plans via UI
- **Solution:** Create plan editor form with JSON structure validation
- **Database:** Use existing `plans` table (no schema changes needed)
- **Files:** New `src/components/create-plan-dialog.tsx` integrated into project detail view

#### 4.3 Human Specification Editor (Agent: Create spec via POST /api/agent/projects, Human: ❌)
- **Problem:** Humans cannot edit specifications after project creation
- **Solution:** Add markdown editor for specifications with version management
- **Database:** Consider adding `updated_at` to `specifications` (optional, audit trail)
- **Files:** New `src/components/spec-editor.tsx`, update specification-viewer

#### 4.4 Human Test Results Logging (Agent: POST /api/agent/verify, Human: ❌)
- **Problem:** Test results panel is placeholder; no UI for logging results
- **Solution:** Add "Log Test Result" button on each task card + results form
- **Database:** Use existing `test_results` table (no schema changes needed)
- **Files:** Enhance `src/components/test-results-panel.tsx`, modify task cards

#### 4.5 Human Agent Log Creation (Agent: POST /api/agent/logs, Human: ❌)
- **Problem:** Humans cannot manually log agent activities or notes
- **Solution:** Add "Add Log Entry" button for manual intervention logging
- **Database:** May add `is_internal` flag to `agent_logs` to distinguish internal vs agent logs
- **Files:** Enhance `src/components/agent-logs.tsx` with manual log entry form

#### 4.6 User Role Management (Database: `users` table exists, UI: ❌)
- **Problem:** Users table exists but authentication/login not implemented
- **Solution:** Add login state and user attribution to all operations
- **Database:** Use existing `users` table, add `created_by_user_id` to projects/specs/plans/tasks
- **Files:** New auth system (NextAuth or custom), update all tables to track ownership

### Phase 5: Agent Self-Bootstrapping (CRITICAL - Next)

Currently, agents cannot start from zero; they require pre-created project structures.

#### 5.1 Project Creation API
- `POST /api/agent/projects` - Create project + specification + plan in one call
- Returns: `{ project_id, specification_id, plan_id }`
- Schema: Accept `name`, `mission`, `description`, `tech_stack`, `instructions`, `base_path`

#### 5.2 Project Configuration API
- `PATCH /api/agent/projects/:id` - Update project configuration
- Allows refinement: Update `mission`, `description`, `tech_stack`, `instructions`, `specification.content`

#### 5.3 Task Creation API
- `POST /api/agent/tasks` - Create individual tasks under a plan
- Schema: Accept `plan_id`, `description`, `priority`, `files_involved`, `dependency_task_id`

### Phase 6: Polish & Quality (Medium Priority)

#### Quality Issues
- ❌ Loading states/skeletons for all data-fetching pages
- ❌ Global error boundaries (Next.js error.tsx)
- ❌ Standardized API error responses (400/404/500 with proper messages)
- ❌ Form validation feedback with error states
- ❌ Offline detection and retry logic
- ❌ Database indexes on foreign keys (performance)

#### UX Improvements
- ❌ Task dependency visualization (graph view)
- ❌ Search/filter across tasks, specs, logs
- ❌ Real-time updates via WebSocket or polling
- ❌ Export functionality (JSON/CSV)
- ❌ Keyboard shortcuts for power users

## Implementation Priority (Revised)

### Phase 4: Human Feature Parity (CRITICAL - 8-12 hours)
This phase ensures humans can do everything agents can do via UI. Blocks full collaboration.

#### 4.1 Task Creation Flow
- [ ] Create `src/components/create-task-dialog.tsx` with form
  - Fields: description, priority (1-5), files_involved (array), dependency_task_id
  - Form validation with Zod
  - Submit to `actions.createTask()` server action
- [ ] Add "Create Task" button to Kanban board header
- [ ] Update `src/lib/actions.ts` with `createTask()` server action
- [ ] Success toast and immediate Kanban refresh
- **Files:** New dialog component, actions.ts, kanban-board.tsx
- **Priority:** P0 (Core workflow)
- **Effort:** 2-3 hours
- **Dependencies:** None (can start immediately)

#### 4.2 Plan Editor
- [ ] Create `src/components/create-plan-dialog.tsx` with JSON editor
  - Fields: architecture_decisions (structured JSON/hierarchical)
  - JSON validation and formatting
  - POST to `/api/agent/plans` (agent API, humans can reuse)
- [ ] Add "Create Plan" button to project detail page
- [ ] Show active plan in project detail view
- **Files:** New dialog component, project detail page update
- **Priority:** P0 (Required for spec-driven workflow)
- **Effort:** 2-3 hours
- **Dependencies:** None

#### 4.3 Specification Editor
- [ ] Create `src/components/spec-editor.tsx` markdown editor
  - Markdown rendering preview
  - Version history view (read-only previous versions)
  - Save creates new version, marks as active
  - Integrated into specification-viewer
- **Files:** New editor component, update specification-viewer
- **Priority:** P1 (Power user feature)
- **Effort:** 3-4 hours
- **Dependencies:** May need `updated_at` field in specifications

#### 4.4 Test Results Logging UI
- [ ] Add "Log Test Result" button to task cards/selection
- [ ] Create `src/components/log-test-result-dialog.tsx`
  - Fields: success/fail boolean, logs (text area), task_id
  - Calls `POST /api/agent/verify` (agent API, humans can reuse)
- [ ] Update test-results-panel to show real data (query test_results table)
- **Files:** New dialog component, update test-results-panel, task cards
- **Priority:** P0 (Core verification loop)
- **Effort:** 2-3 hours
- **Dependencies:** task creation complete

#### 4.5 Agent Log Creation UI
- [ ] Add "Add Log Entry" button to agent-logs panel
- [ ] Create `src/components/add-log-dialog.tsx`
  - Fields: level (info/warn/error/debug), message, task_id
  - May add context JSON field for structured data
  - Calls `POST /api/agent/logs` (agent API, humans can reuse)
- [ ] Optionally add `is_internal` flag to agent_logs table
- **Files:** New dialog component, update agent-logs, schema update
- **Priority:** P1 (Improve debugging/troubleshooting)
- **Effort:** 1-2 hours
- **Dependencies:** None

#### 4.6 User Authentication & Authorization (MAY BREAK DOWN)
- [ ] Implement authentication system (NextAuth or custom)
- [ ] Create login page and middleware
- [ ] Add `created_by_user_id` foreign key to:
  - projects, specifications, plans, tasks tables
- [ ] Track user actions in audit log
- [ ] Differentiate UI: user actions vs agent actions
- **Files:** Auth setup, schema updates, middleware, toast notifications
- **Priority:** P2 (Nice to have for multi-user)
- **Effort:** 4-6 hours
- **Dependencies:** Test results logging complete
- **Note:** Could be postponed if single-user for now

### Phase 5: Agent Self-Bootstrapping (CRITICAL - 6-8 hours)
These APIs unlock autonomous agent startup from natural language requests.

#### 5.1 Agent Project Creation API
- [ ] Implement `POST /api/agent/projects` endpoint
  - Accept: `name`, `mission`, `description`, `constitution`, `tech_stack`, `base_path`
  - Creates: project + specification + plan (all with proper relationships)
  - Returns: `{ project_id, specification_id, plan_id }`
  - Agent token authentication required
- [ ] Add bulk insert transactions (rollback on partial failure)
- **Files:** New route handler, schema validation
- **Priority:** P0 (Foundation for agent autonomy)
- **Effort:** 2 hours
- **Dependencies:** Database schema stable

#### 5.2 Agent Project Configuration API
- [ ] Implement `PATCH /api/agent/projects/:id` endpoint
  - Accept: `mission`, `description`, `constitution`, `tech_stack`, `instructions`
  - Optionally update specification content (creates new version)
- **Files:** New route handler, update logic for specs/plans
- **Priority:** P0 (Agent needs refinement capability)
- **Effort:** 2 hours
- **Dependencies:** Project creation API

#### 5.3 Agent Task Creation API
- [ ] Implement `POST /api/agent/tasks` endpoint
  - Accept: `plan_id`, `description`, `priority`, `files_involved`, `dependency_task_id`
  - Returns: `{ task_id }`
  - Validate: plan exists, dependency task is valid
- [ ] Support bulk task creation (array of tasks)
- **Files:** New route handler, validation, insert logic
- **Priority:** P0 (Agent must decompose work)
- **Effort:** 1.5 hours
- **Dependencies:** None (standalone)

### Phase 6: Polish & Optimization (Optional - 4-6 hours)
Can implement based on user feedback and pain points.

#### 6.1 Loading States & Skeletons
- [ ] Create `src/components/skeleton.tsx` component
- [ ] Add loading.tsx files to all route directories
- [ ] Apply to: Kanban board, project detail, task lists
- **Priority:** P1 (UX polish)
- **Effort:** 1-2 hours

#### 6.2 Error Boundaries
- [ ] Create `src/app/error.tsx` global error boundary
- [ ] Create `src/app/not-found.tsx` for 404 pages
- [ ] Standardize API error responses with proper HTTP codes
- **Priority:** P1 (Quality)
- **Effort:** 1-2 hours

#### 6.3 Database Optimization
- [ ] Add indexes on common foreign keys: `tasks.project_id`, `specifications.project_id`, `plans.spec_id`, `agent_logs.project_id`, `agent_logs.task_id`
- [ ] Add compound indexes: (`project_id`, `status`) on tasks
- [ ] Review query patterns and add optimization
- **Priority:** P1 (Performance)
- **Effort:** 1 hour

#### 6.4 Enhanced Features (Future)
- [ ] Task dependency visualization (graph/chart)
- [ ] Search and filtering across all entities
- [ ] Real-time WebSocket updates
- [ ] Export to JSON/CSV
- [ ] Keyboard shortcuts
- **Priority:** P2+ (Future enhancements)

## Database Schema Additions Required

### Potential Changes (REVIEW BEFORE IMPLEMENTING)

#### Table: agent_logs
**Addition:**
```sql
-- To distinguish manual human logs from agent logs
ALTER TABLE agent_logs ADD COLUMN is_internal BOOLEAN DEFAULT false;
```
**Reason:** When humans add logs manually, mark as internal for filtering
**Breaks:** No - default value handles existing rows

#### Table: specifications
**Addition:**
```sql
-- Track when specs are updated
ALTER TABLE specifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
```
**Reason:** Version history tracking for spec editor
**Breaks:** No - nullable field
**Alternative:** Could use created_at of newer versions to track update time

#### Tables: projects, specifications, plans, tasks
**Addition:**
```sql
-- Track who created what (human or agent)
ALTER TABLE projects ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);
ALTER TABLE specifications ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);
ALTER TABLE plans ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);
```
**Reason:** Attribution for multi-user environments
**Breaks:** No - nullable fields
**Priority:** Only needed if implementing user auth (Phase 4.6)

**Decision:** Hold off on these changes until we decide on user auth implementation.

## Success Criteria

### Phase 4 Complete (Human-Agent Parity)
- [ ] Humans can create, read, update, delete projects, specs, plans, tasks via UI
- [ ] All agent operations have equivalent UI controls
- [ ] Test results and logs can be manually entered and viewed
- [ ] All changes persist to PostgreSQL database
- [ ] Agent and human can collaborate on same project seamlessly

### Phase 5 Complete (Agent Autonomy)
- [ ] Agent can self-bootstrap from natural language request
- [ ] Agent can create complete project structure: project + spec + plan
- [ ] Agent can decompose work by creating tasks dynamically
- [ ] Developer can monitor agent progress through UI
- [ ] Human can pause, resume, or stop agent execution

### MVP Complete (All Phases)
- [ ] Full spec-driven workflow operational end-to-end
- [ ] Human+Agent can build software together
- [ ] All data persisted in PostgreSQL state machine
- [ ] Type-safe API with comprehensive validation
- [ ] UI provides visibility into all operations

## Architecture Decisions (Updated)

| Decision | Reasoning | Trade-off |
| -------- | --------- | --------- |
| **Human-Agent API Parity** | Same APIs for humans and agents ensures consistency | Slightly more complex API design to support both use cases |
| **Server Actions + API Routes** | Server actions for UI, API routes for agents | Dual patterns but optimal for each user type |
| **No Auth Phase 4** | Simpler to postpone user management | Single-user assumption for now |
| **Reusing Agent APIs** | Humans call same POST endpoints as agents | Agent endpoints must be more robust |
| **Denormalized agent_logs.project_id** | Faster queries when filtering by project | Minor data duplication |

## Next Immediate Actions (Pick One to Start)

1. **Start Phase 4.1:** Create task creation dialog (2-3 hours, independent)
2. **Start Phase 4.2:** Create plan editor dialog (2-3 hours, independent)
3. **Start Phase 4.4:** Implement test results logging UI (2-3 hours, shows verification loop)
4. **Start Phase 5.1:** Implement agent project creation API (2 hours, unlocks autonomy)

**Recommendation:** Start with **Phase 4.1** (task creation) as it's most visible to users and shows immediate value. Then **Phase 4.4** (test results) to complete the verification loop.

---

**Last Updated:** March 5, 2026
**Status:** 80% Complete
**Next:** Phase 4 - Human Feature Parity (8-12 hours)

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

