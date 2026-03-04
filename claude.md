# claude.md - Spec-Drivr Development Guide

**Project:** Spec-Drivr - Autonomous Development Platform  
**Status:** 50% complete (Core infrastructure + Project management in progress)  
**Last Updated:** March 5, 2026

---

## 🎯 Project Overview

Spec-Drivr is an **Autonomous Development Platform** that uses PostgreSQL as a state machine to enable AI agents (like Claude) to execute complex software engineering tasks autonomously while maintaining persistent memory across sessions.

**Key Innovation:** Instead of relying on chat history, the system uses a database as the "source of truth." The AI queries its current state rather than remembering it from previous conversations.

**See Also:**
- [specification.md](specification.md) - Full project vision and requirements
- [plan.md](plan.md) - 5-phase implementation roadmap
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Current status and findings

---

## 📚 Quick Reference

### Architecture
- **Frontend:** Next.js 14 App Router + React 18 + Tailwind CSS
- **Backend:** Next.js API Routes + Server Actions
- **Database:** PostgreSQL 16 + Drizzle ORM
- **Type Safety:** TypeScript (strict mode) + Zod validation
- **Container:** Docker Compose (PostgreSQL)

### Tech Stack
```json
{
  "runtime": "Node.js 18+",
  "framework": "Next.js 14",
  "database": "PostgreSQL 16",
  "orm": "Drizzle",
  "language": "TypeScript 5",
  "styling": "Tailwind CSS",
  "validation": "Zod"
}
```

### Running Locally
```bash
# Setup
npm run db:push                    # Create database schema
psql $DATABASE_URL < db/seed-simple.sql  # Load initial data
psql $DATABASE_URL < db/seed-plan.sql    # Load tasks

# Development
npm run dev                        # Start dev server (http://localhost:3000)
npm run db:studio                  # Open database explorer

# Build & Deploy
npm run build                      # Production build
npm run start                      # Run production server
```

---

## 📁 Directory Structure

```
specdrivr/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page (dashboard)
│   │   ├── projects/[id]/        # Project detail pages (TODO: create)
│   │   ├── api/
│   │   │   └── agent/            # Agent API endpoints
│   │   │       ├── mission/      # GET next task
│   │   │       ├── plans/        # POST create plan
│   │   │       ├── tasks/[id]/   # PATCH update task
│   │   │       ├── verify/       # POST test results
│   │   │       └── logs/         # POST agent logs
│   │   └── layout.tsx            # Root layout
│   ├── components/               # React components
│   │   ├── kanban-board.tsx      # Task board (TODO: add drag-drop)
│   │   ├── project-sidebar.tsx   # Project list (TODO: fix New button)
│   │   ├── task-card.tsx         # Task display
│   │   ├── task-details-modal.tsx# (TODO: create)
│   │   ├── create-project-dialog.tsx# (TODO: create)
│   │   ├── test-results-panel.tsx
│   │   ├── agent-logs.tsx
│   │   └── specification-viewer.tsx
│   ├── lib/
│   │   ├── actions.ts            # Server actions (DB queries)
│   │   ├── agent-memory.ts       # Database context helpers
│   │   ├── auth.ts               # Auth middleware
│   │   ├── schemas.ts            # Zod validation schemas
│   │   └── utils.ts              # Utility functions
│   └── db/
│       ├── index.ts              # Database client
│       └── schema.ts             # Drizzle schema definition
├── db/
│   ├── seed-simple.sql           # Initial project data
│   └── seed-plan.sql             # Implementation tasks
├── public/                        # Static assets
├── docs/                         # (TODO: create API docs)
├── docker-compose.yml            # PostgreSQL setup
├── drizzle.config.ts             # ORM configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.js                # Next.js config
├── tailwind.config.mjs           # Tailwind config
├── postcss.config.mjs            # CSS config
├── eslint.config.mjs             # Linting config
│
├── documentation/
│   ├── specification.md          # Project vision
│   ├── plan.md                   # Implementation roadmap
│   ├── EVALUATION.md             # Current state assessment
│   ├── PROJECT_SUMMARY.md        # Overview
│   ├── QUICKSTART.md             # Setup guide
│   ├── INDEX.md                  # Documentation index
│   └── claude.md                 # This file

```

---

## 🗂️ Key Files & Their Purpose

### Database Layer
- **[src/db/schema.ts](src/db/schema.ts)** - Drizzle schema with 6 tables
  - `projects` - Projects metadata
  - `specifications` - Project specs (versioned)
  - `plans` - Architecture decisions
  - `tasks` - Implementation tasks with status
  - `test_results` - Test pass/fail logs
  - `agent_logs` - Agent execution logs

- **[src/db/index.ts](src/db/index.ts)** - Database client initialization

- **[drizzle.config.ts](drizzle.config.ts)** - ORM configuration

### API Layer
- **[src/app/api/agent/mission/route.ts](src/app/api/agent/mission/route.ts)** - `GET /api/agent/mission`
  - Returns active spec, plan, and next task for a project
  - Auth: Requires `X-Agent-Token` header
  - Used by: Agent to understand current context

- **[src/app/api/agent/plans/route.ts](src/app/api/agent/plans/route.ts)** - `POST /api/agent/plans`
  - Create or update architecture plans
  - Body: spec_id, architecture_decisions
  - Used by: Agent to publish architecture decisions

- **[src/app/api/agent/tasks/[id]/route.ts](src/app/api/agent/tasks/[id]/route.ts)** - `PATCH /api/agent/tasks/:id`
  - Update task status (todo → in_progress → done)
  - Body: status, updated_at
  - Used by: Agent to move task through workflow

- **[src/app/api/agent/verify/route.ts](src/app/api/agent/verify/route.ts)** - `POST /api/agent/verify`
  - Log test results after verification
  - Body: task_id, success, logs
  - Used by: Agent to record test pass/fail

- **[src/app/api/agent/logs/route.ts](src/app/api/agent/logs/route.ts)** - `POST /api/agent/logs`
  - Add agent execution logs
  - Body: task_id, level, message
  - Used by: Agent to provide execution visibility

### API Layer Extensions (NEEDED FOR MVP)
- **`POST /api/agent/projects`** - Create new project (⚠️ MISSING)
  - Payload: name, mission, description, tech_stack, instructions, base_path
  - Returns: { project_id, specification_id, plan_id }
  - Priority: 🔴 Critical for agent and developer

- **`PATCH /api/agent/projects/:id`** - Configure existing project (⚠️ MISSING)
  - Payload: mission, description, instructions, tech_stack
  - Returns: Updated project config
  - Priority: 🔴 Critical for agent iteration

- **`POST /api/agent/tasks`** - Create task for agent (⚠️ MISSING)
  - Payload: plan_id, description, priority, files_involved, dependency_task_id
  - Returns: { task_id }
  - Priority: 🔴 Critical for task decomposition

- **`POST /api/projects`** - Developer project creation (⚠️ MISSING)
  - Payload: name, mission, description, tech_stack, instructions
  - Returns: { project_id }
  - Priority: 🔴 Critical for developer workflow

- **`POST /api/tasks`** - Developer task creation (⚠️ MISSING)
  - Payload: project_id, description, priority, files_involved, dependency_task_id
  - Returns: { task_id }
  - Priority: 🔴 Critical for manual task addition

### Agent Control API (NEEDED FOR MVP)
- **`POST /api/projects/:id/agent/start`** - Start agent work (⚠️ MISSING)
  - Tells agent to begin working on this project
  - Returns: { status: 'started', project_id }
  - Priority: 🔴 Critical for developer control

- **`POST /api/projects/:id/agent/pause`** - Pause agent work (⚠️ MISSING)
  - Pauses agent, keeps current task in progress state
  - Returns: { status: 'paused', current_task_id }
  - Priority: 🔴 Critical for developer control

- **`POST /api/projects/:id/agent/stop`** - Stop agent work (⚠️ MISSING)
  - Immediately stops agent, marks task as blocked
  - Returns: { status: 'stopped', last_task_id, reason }
  - Priority: 🔴 Critical for developer control

- **`POST /api/projects/:id/agent/retry`** - Retry current/last task (⚠️ MISSING)
  - Tells agent to retry the current or most recent failed task
  - Returns: { status: 'retrying', task_id }
  - Priority: 🔴 Critical for developer control

- **`POST /api/tasks/:id/agent/start`** - Start specific task (⚠️ MISSING)
  - Tell agent to work on this specific task
  - Returns: { status: 'started', task_id }
  - Priority: 🟡 High for task-level control

- **`POST /api/tasks/:id/agent/pause`** - Pause specific task (⚠️ MISSING)
  - Pause this task execution
  - Returns: { status: 'paused', task_id }
  - Priority: 🟡 High for task-level control

- **`POST /api/tasks/:id/agent/skip`** - Skip task execution (⚠️ MISSING)
  - Mark task as done without executing
  - Returns: { status: 'done', task_id, reason: 'skipped' }
  - Priority: 🟡 High for task-level control

- **`POST /api/tasks/:id/agent/retry`** - Retry task (⚠️ MISSING)
  - Retry failed or blocked task
  - Returns: { status: 'retrying', task_id }
  - Priority: 🟡 High for task-level control

- **`GET /api/projects/:id/agent/status`** - Get agent status (⚠️ MISSING)
  - Get current status of agent working on this project
  - Returns: { status, current_task_id, uptime, last_update, errors }
  - Priority: 🔴 Critical for UI visibility

- **`GET /api/agent/logs`** - Stream/fetch agent logs (⚠️ MISSING)
  - Fetch recent logs (with pagination, filtering)
  - Query params: task_id, level, limit, offset, stream=true
  - Returns: { logs: [...], total, hasMore }
  - Priority: 🔴 Critical for visibility

### Backend Utilities
- **[src/lib/agent-memory.ts](src/lib/agent-memory.ts)** - Database query helpers
  - `getProjectContext(projectId)` - Get spec, plan, tasks
  - `getNextTask(projectId)` - Get next todo task
  - `updateTaskStatus(taskId, status)` - Change task state
  - `logTestResult(taskId, success, logs)` - Record test run
  - `addAgentLog(taskId, level, message)` - Log agent action

- **[src/lib/actions.ts](src/lib/actions.ts)** - Server actions
  - `getProjects()` - Fetch all projects
  - `createProject(data)` - Create new project
  - `getProjectTasks(projectId)` - Get project tasks
  - `updateTaskStatus(taskId, status)` - Update task

- **[src/lib/auth.ts](src/lib/auth.ts)** - Authentication
  - `validateAgentToken(request)` - Check X-Agent-Token header

- **[src/lib/schemas.ts](src/lib/schemas.ts)** - Zod validation
  - Request/response schemas for all endpoints
  - Type-safe validate at runtime

### Frontend Components
- **[src/app/page.tsx](src/app/page.tsx)** - Home/dashboard page
  - Shows projects sidebar and kanban board
  - **TODO:** Load real project data (currently hardcoded)

- **[src/components/kanban-board.tsx](src/components/kanban-board.tsx)** - Kanban UI
  - Groups tasks by status (todo, in_progress, done, blocked)
  - **TODO:** Add drag-and-drop functionality

- **[src/components/project-sidebar.tsx](src/components/project-sidebar.tsx)** - Project list
  - Shows all projects
  - **TODO:** Fix New Project button (currently shows alert)
  - **TODO:** Implement `onProjectSelect` navigation

- **[src/components/task-card.tsx](src/components/task-card.tsx)** - Task display
  - Shows priority, description, status
  - **TODO:** Add click handler for details modal

---

## 🔄 Data Flow & Workflows

### Developer Workflow (Web UI)
```
1. Developer clicks "New Project"
   ↓
2. Fills form: name, mission, description, tech_stack, instructions
   ↓
3. Clicks "Create" → POST /api/projects
   ↓
4. Server creates project + specification + plan in database
   ↓
5. Navigate to /projects/[id] to see project detail
   ↓
6. Developer can:
   - View active specification and plan
   - Click "Add Task" to create task manually
   - See Kanban board of all tasks
   - Monitor agent progress in real-time
```

### Agent Workflow (API)
```
1. Agent starts work
   ↓
2. Agent calls GET /api/agent/mission?project_id=1
   ↓
3. Receives: active specification, plan, next todo task
   ↓
4. Agent executes task:
   - Parse specification to understand "What"
   - Read plan to understand "How"
   - Implement code based on task description
   ↓
5. Agent moves task: PATCH /api/agent/tasks/:id with status=in_progress
   ↓
6. Agent executes tests and gets results
   ↓
7. Agent moves task: PATCH /api/agent/tasks/:id with status=done
   ↓
8. Agent logs results: POST /api/agent/verify with success=true/false
   ↓
9. Loop back to step 2 for next task
```

### Agent Self-Bootstrapping Workflow
```
1. Agent receives: "Build a feature for Spec-Drivr"
   ↓
2. Agent calls: POST /api/agent/projects with:
   - name: "Website Redesign"
   - mission: "Modernize the marketing website"
   - description: "Full design and implementation"
   - instructions: "Use Next.js 14, Tailwind CSS"
   ↓
3. Server creates project and returns: project_id=42
   ↓
4. Agent calls: PATCH /api/agent/projects/42 with:
   - description: "More detailed specification..."
   ↓
5. Agent calls: POST /api/agent/tasks multiple times:
   - Task 1: Design database schema
   - Task 2: Create API endpoints
   - Task 3: Build UI components
   ↓
6. Agent loops through tasks via GET /api/agent/mission?project_id=42
   ↓
7. Developer can monitor progress at http://localhost:3000/projects/42
```

---

## 🎮 Agent Control & Visibility Panel (NEW)

### Developer-Visible Agent Operations

The web UI must provide **complete visibility into agent execution** with control capabilities:

#### Project-Level Controls & Visibility
```
┌─────────────────────────────────────────────────────┐
│  Project: "Spec-Drivr" | Status: 🟢 Agent Working   │
├─────────────────────────────────────────────────────┤
│  Mission:       [Edit] Autonomous Development Platform
│  Description:   [Edit] Build an AI-driven dev platform
│  Instructions:  [Edit] Use Next.js 14, TypeScript...
│  Tech Stack:    [Edit] Next.js, PostgreSQL, Drizzle
│  Agent Config:  Claude CLI (installed at /usr/local/bin/claude)
│                 
│  ┌─ Project Controls ─────────────────────────────┐
│  │  [🚀 Start Work] [⏸️ Pause] [⛔ Stop] [🔄 Retry] │
│  └────────────────────────────────────────────────┘
│
│  ┌─ Agent Status ─────────────────────────────────┐
│  │  Currently Working: Task #42 - Update UI       │
│  │  Time Elapsed: 18 minutes                      │
│  │  Last Heartbeat: 2 seconds ago                 │
│  │  Status: 🟢 Running                           │
│  └────────────────────────────────────────────────┘
│
│  ┌─ Real-time Logs (Last 20) ─────────────────────┐
│  │  [INFO] Starting task: Update UI components    │
│  │  [INFO] Analyzed current codebase               │
│  │  [DEBUG] Found 12 components to update          │
│  │  [INFO] Creating component updates...          │
│  │  [WARN] Component missing prop type validation │
│  │  [INFO] Wrote 3 files successfully             │
│  │  [INFO] Running tests...                       │
│  │  [INFO] 4 of 5 tests passing                   │
│  │  [ERROR] Test failure: TaskCard not rendering   │
│  │  > Scroll for more logs [Auto-refresh: ON]     │
│  └────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────┘
```

#### Task-Level Controls & Visibility
```
┌─ Task #42: Update UI Components ────────────────────────────┐
│  Status: ⏳ in_progress (started 18 min ago)                │
│  Description: Create project detail page with edit forms  │
│  Priority: 1 (Highest)                                     │
│  Assigned: Claude Agent                                    │
│                                                             │
│  ┌─ Task Controls ──────────────────────────────────────┐ │
│  │ [▶️ Start] [⏸️ Pause] [✓ Skip] [↩️ Retry] [❌ Block] │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Task Progress ──────────────────────────────────────┐ │
│  │  Test Results: 4/5 passing (80%)                    │ │
│  │  Files Modified: 3 (kanban-board.tsx, ...)          │ │
│  │  Lines Added: 247 | Lines Removed: 89               │ │
│  │  Last Update: 2 seconds ago                         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Related Logs ────────────────────────────────────────┐ │
│  │  [19:45:23] INFO: Analyzing task requirements       │ │
│  │  [19:45:28] INFO: Reading 5 related files           │ │
│  │  [19:46:12] INFO: Writing kanban-board.tsx          │ │
│  │  [19:46:45] DEBUG: Modified component structure     │ │
│  │  [19:47:01] INFO: Running test suite                │ │
│  │  [19:47:23] ERROR: TaskCard test: Expected ...      │ │
│  │  [19:48:10] INFO: Fixing test issues              │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Required Features for Visibility & Control

1. **Live Agent Status Display**
   - Current task being executed
   - Time elapsed on current task
   - Last heartbeat/update time
   - Agent status (running, paused, stopped, error)

2. **Real-time Log Viewer**
   - Stream or poll agent logs
   - Color-coded by level (debug, info, warn, error)
   - Searchable and filterable
   - Auto-scroll with manual override
   - Timestamps on each entry

3. **In-place Editing**
   - Edit mission, description, instructions while agent is running
   - Changes take effect immediately (agent reads from DB next query)
   - Edit indicator showing "unsaved changes"
   - Confirmation when changing while agent is working

4. **Project-Level Controls**
   - Start Work: Tell agent to begin working on this project
   - Pause: Pause current execution, keep state
   - Stop: Stop immediately, mark current task as blocked
   - Retry: Retry the current or last failed task

5. **Task-Level Controls**
   - Start Task: Begin working on a specific task
   - Pause Task: Pause this specific task
   - Skip Task: Mark as done without execution
   - Retry Task: Retry a failed or blocked task
   - Block Task: Manually mark as blocked

### Configuration Page (Agent Settings)

```
┌─────────────────────────────────────────────────────┐
│  ⚙️  Agent Configuration                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Agent Selection:                                  │
│  ○ Claude (via Claude CLI)                         │
│  ○ GPT-4 (not configured)                         │
│  ○ Custom (API endpoint)                           │
│                                                     │
│  Claude CLI Settings:                              │
│  CLI Path: [/usr/local/bin/claude      ✓ Verified]│
│  Version:  Claude 3.5 (latest)                     │
│                                                     │
│  Execution Settings:                               │
│  Default Project: [Spec-Drivr            ▼]        │
│  Max Retries:     [3                     ]         │
│  Timeout (min):   [60                    ]         │
│  Logs Level:      [Debug                 ▼]        │
│                                                     │
│  API Token (Project):                              │
│  [X-Agent-Token: dev-agent-token-12345 ]          │
│  [🔄 Regenerate]                                   │
│                                                     │
│  [Test Connection] [Save Settings] [Reset to Default]
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 👥 Dual-Purpose Architecture

This platform  (Infrastructure Foundation)
- [x] Database schema and migrations (6 tables, proper relationships)
- [x] Drizzle ORM setup with TypeScript types
- [x] Authorization middleware (`X-Agent-Token` validation)
- [x] Server actions framework for safe data operations
- [x] Basic UI components structure
- [x] Core API endpoints for agent feedback loop

### 🔴 Critical Priority: Developer Project Management (This Sprint)
**Goal:** Enable developers to create and manage projects with full configuration

- [ ] **Project Creation UI** (Developer Priority #1)
  - [ ] Create project dialog with form (name, mission, description, tech stack, instructions)
  - [ ] Implement `createProject` action with full config
  - [ ] Wire "New Project" button to dialog
  - [ ] Show success/error feedback
  - **Effort:** 3-4 hours
  - **Why:** Without this, developers can't onboard projects

- [ ] **Project Configuration Page** (Developer Priority #2)
  - [ ] Create `projects/[id]/page.tsx` detail view
  - [ ] Display project info, mission, description, instructions
  - [ ] Allow editing project configuration
  - [ ] Show active specification and plan
  - **Effort:** 3-4 hours
  - **Why:** Developers need to see and adjust project context

- [ ] **Manual Task Creation** (Developer Priority #3)
  - [ ] Create task form in project view (description, priority, dependencies)
  - [ ] Implement `createTask` action
  - [ ] Add tasks to project plan
  - [ ] Link tasks to specification
  - **Effort:** 2-3 hours
  - **Why:** Developers must be able to decompose work manually

- [ ] **Task Status Board** (Developer Priority #4)
  - [ ] Display real data in kanban (remove sample data)
  - [ ] Show tasks grouped by status
  - [ ] Display task priorities, descriptions, due dates
  - [ ] Click task for details
  - **Effort:** 2 hours
  - **Why:** Developers need visibility into agent progress

### 🔵 Critical Priority: Agent API Completeness (This Sprint)
**Goal:** Enable agent to bootstrap and manage entire project lifecycle

- [ ] **Agent Project Creation API** (Agent Priority #1)
  - [ ] `POST /api/agent/projects` - Full project creation with config
  - [ ] Payload: name, mission, description, tech_stack, base_path, instructions
  - [ ] Return: project_id and created specification/plan
  - **Effort:** 2 hours
  - **Why:** Agent can't self-bootstrap without this

- [ ] **Agent Project Config API** (Agent Priority #2)
  - [ ] `PATCH /api/agent/projects/:id` - Update project config
  - [ ] Support: mission, description, instructions, tech_stack
  - [ ] Support: Add/update active specification
  - **Effort:** 2 hours
  - **Why:** Agent needs to refine project config during execution

- [ ] **Agent Task Creation API** (Agent Priority #3)
  - [ ] `POST /api/agent/tasks` - Create task in project
  - [ ] Payload: plan_id, description, priority, files_involved, dependency_task_id
  - [ ] Return: task_id for tracking
  - **Effort:** 1.5 hours
  - **Why:** Agent needs to decompose plans into atomic tasks

- [ ] **Agent Task Status Update** (Already exists)
  - [ ] `PATCH /api/agent/tasks/:id` - Move task between statuses
  - [ ] Support: todo → in_progress → done/blocked
  - [ ] Already implemented ✅

- [ ] **Agent Mission API** (Already exists)
  - [ ] `GET /api/agent/mission?project_id=1` - Get current state
  - [ ] Returns: spec, plan, next task with dependencies resolved
  - [ ] Already implemented ✅

### ⚠️ High Priority: Enhanced Interactivity (Next Sprint)
- [ ] Add drag-and-drop kanban board (developer workflow smoothness)
- [ ] Add task details modal (viewing full context)
- [ ] Add specification editor (managing requirements)
- [ ] Add plan editor (managing architecture)
- [ ] Test result logging UI (seeing verification results)

### ⚠️ Medium Priority: Quality & Polish (Future Sprints)
- [ ] Error boundaries and global error handling
- [ ] Loading states and skeleton components
- [ ] Form validation with visual feedback
- [ ] Database indexes for performance
- [ ] Agent logs viewer with pagination and filtering
- [ ] Automated tests (unit, integration, E2E)
- [ ] **Phase 2: Interactivity** (1-2 weeks)
  - [ ] Add drag-and-drop to kanban-board
  - [ ] Create task details modal
  - [ ] Implement task creation form
  - [ ] Add plan creation form

- [ ] **Phase 3: Features** (1-2 weeks)
  - [ ] Test result logging UI
  - [ ] Agent logs viewer with pagination
  - [ ] Specification editor
  - [ ] Plan editor

- [ ] **Phase 4: Polish** (1 week)
  - [ ] Error boundaries
  - [ ] Loading states
  - [ ] Form validation
  - [ ] Database indexes

### ❌ Not Started
- [ ] Automated tests (unit, integration, E2E)
- [ ] Production deployment
- [ ] Monitoring/logging infrastructure

**See [plan.md](plan.md) for complete task list**

---

## 🎯 Critical Path to MVP

### Phase 1A: Developer Project Management (Week 1) 🔴 HIGHEST PRIORITY
**Goal:** Developers can create, configure, and manage projects through the web UI

1. **Update `createProject` action** (2 hours)
   - Accept: name, mission, description, tech_stack, instructions, base_path
   - Create: project, specification, plan in one transaction
   - Return: project with relationships

2. **Create Project Creation UI** (2-3 hours)
   - `src/components/create-project-dialog.tsx` - form component
   - Wire "New Project" button in sidebar
   - Show success/error toasts

3. **Create Project Detail Page** (3-4 hours)
   - `src/app/projects/[id]/page.tsx` - project overview
   - Display: name, mission, description, tech stack, instructions
   - Show: active spec, plan, task count
   - Edit buttons for each field

4. **Create Task Creation UI** (2-3 hours)
   - `src/components/create-task-dialog.tsx` - task form
   - Fields: description, priority, files, dependency_task_id
   - Button in project detail page
   - Link to project plan

5. **Load Real Data in Kanban** (2 hours)
   - Update home/projects pages to fetch from database
   - Remove hardcoded sample data
   - Show tasks for selected project

**Result:** Developers can fully manage projects through UI ✅

### Phase 1B: Agent API Completeness (Week 1) 🔴 HIGHEST PRIORITY
**Goal:** Agent can bootstrap projects and manage them through API

1. **Implement `POST /api/agent/projects`** (2 hours)
   - Accept: name, mission, description, tech_stack, instructions, base_path
   - Create project + specification + plan
   - Return: { project_id, specification_id, plan_id }
   - Example: `curl -X POST http://localhost:3000/api/agent/projects \
     -H "X-Agent-Token: dev-agent-token-12345" \
     -H "Content-Type: application/json" \
     -d '{"name":"MyProject","mission":"Build X",...}'`

2. **Implement `PATCH /api/agent/projects/:id`** (2 hours)
   - Accept: mission, description, instructions, tech_stack
   - Update project and specification
   - Return: updated project
   - Example: `curl -X PATCH http://localhost:3000/api/agent/projects/1 \
     -H "X-Agent-Token: dev-agent-token-12345" \
     -d '{"mission":"Updated mission",...}'`

3. **Implement `POST /api/agent/tasks`** (1.5 hours)
   - Accept: plan_id, description, priority, files_involved, dependency_task_id
   - Create task
   - Return: { task_id }
   - Example: `curl -X POST http://localhost:3000/api/agent/tasks \
     -H "X-Agent-Token: dev-agent-token-12345" \
     -d '{"plan_id":1,"description":"Implement feature",...}'`

4. **Update existing endpoints for consistency** (1 hour)
   - Ensure all responses follow same format
   - Add proper error codes (400, 404, 500)
   - Add request/response logging

**Result:** Agent can fully manage projects without UI ✅

### Phase 2: Enhanced Interactivity (Week 2)
- Add drag-and-drop to kanban (4 hours)
- Task details modal (2 hours)
- Edit forms for specifications (3 hours)
- Real-time task status updates (2 hours)

### Phase 3-4: Polish & Testing
- Error boundaries and loading states
- Automated tests
- Performance optimization
- Deployment readiness

### Code Style
- **TypeScript:** Always use strict mode, no `any`
- **Components:** Use functional components with hooks
- **Naming:** camelCase for variables/functions, PascalCase for components
- **Files:** Use kebab-case (e.g., `task-card.tsx`)
- **Imports:** Use absolute paths with `@/` alias
- **Error Handling:** Always use try/catch in server actions
- **Validation:** Always validate with Zod before data operations

### Type Safety
```typescript
// ✅ Good - Typed from database
import { TaskSelect, ProjectSelect } from '@/db/schema';

function MyComponent({ task }: { task: TaskSelect }) {
  // ...
}

// ❌ Bad - Using `any`
function MyComponent({ task }: any) {
  // ...
}
```

### Database Operations
```typescript
// ✅ Good - Use server actions
export async function updateTask(id: number, status: string) {
  'use server';
  try {
    const result = await db.update(tasks).set({ status }).where(...);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to update' };
  }
}

// ❌ Bad - Direct DB from component
app.get('/tasks/:id', async (req, res) => {
  // Client-side direct access
});
```

### Validation
```typescript
// ✅ Good - Validate with Zod
import { TaskUpdateSchema } from '@/lib/schemas';

const result = TaskUpdateSchema.safeParse(input);
if (!result.success) {
  return { error: result.error.flatten() };
}

// ❌ Bad - No validation
const status = req.body.status; // Could be anything
```

### Components
```typescript
// ✅ Good - Typed, modular, single responsibility
'use client';

import { TaskSelect } from '@/db/schema';
import { TaskCard } from './task-card';

interface TaskListProps {
  tasks: TaskSelect[];
  onTaskSelect?: (task: TaskSelect) => void;
}

export function TaskList({ tasks, onTaskSelect }: TaskListProps) {
  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={onTaskSelect}
        />
      ))}
    </div>
  );
}

// ❌ Bad - Inline logic, no types
export function TaskList(props: any) {
  return (
    <div>
      {props.tasks.map((t: any) => (
        <div onClick={() => alert('TODO')}>
          {t.description}
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing & Validation

### Running Tests
```bash
# (Tests not yet implemented, see Phase 4)
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests
```

### Manual Testing Checklist
- [ ] Database connection works: `npm run db:studio`
- [ ] API endpoint responds: `curl http://localhost:3000/api/agent/mission?project_id=1 -H "X-Agent-Token: dev-agent-token-12345"`
- [ ] Home page loads: `http://localhost:3000`
- [ ] Projects load from database (sidebar shows "Spec-Drivr")
- [ ] Kanban board displays tasks from database
- [ ] No console errors in browser DevTools

### Debugging Database
```bash
# Open database explorer
npm run db:studio

# Direct database access
psql $DATABASE_URL
  \dt                          # List tables
  SELECT * FROM projects;      # View projects
  SELECT * FROM tasks WHERE status = 'todo'; # View pending tasks
```

---

## 🔐 Environment Variables

Located in `.env.local`:

```env
# Database connection
DATABASE_URL=postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr

# Agent authentication token
AGENT_TOKEN=dev-agent-token-12345

# Next.js
NEXTAUTH_URL=http://localhost:3000
```

**Note:** Keep `.env.local` out of version control (in .gitignore)

---

## �️ Required API Implementations for MVP

### 1. POST /api/agent/projects
**Purpose:** Agent can bootstrap entire projects

```typescript
// src/app/api/agent/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken } from '@/lib/auth';
import { ProjectCreateSchema } from '@/lib/schemas'; // Define this schema
import { db } from '@/db';
import { projects, specifications, plans } from '@/db/schema';

export async function POST(request: NextRequest) {
  if (!validateAgentToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = ProjectCreateSchema.parse(body);

    // Create project, specification, and plan in one transaction
    const [project] = await db
      .insert(projects)
      .values({
        name: validated.name,
        constitution: validated.instructions || '',
        techStack: validated.tech_stack || {},
        basePath: validated.base_path || '',
      })
      .returning();

    const [spec] = await db
      .insert(specifications)
      .values({
        projectId: project.id,
        content: `# ${validated.name}\n\n${validated.description || ''}`,
        isActive: true,
      })
      .returning();

    const [plan] = await db
      .insert(plans)
      .values({
        specId: spec.id,
        status: 'active',
        architectureDecisions: {},
      })
      .returning();

    return NextResponse.json({
      success: true,
      project_id: project.id,
      specification_id: spec.id,
      plan_id: plan.id,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
```

### 2. PATCH /api/agent/projects/:id
**Purpose:** Agent can update project configuration

```typescript
// src/app/api/agent/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken } from '@/lib/auth';
import { db } from '@/db';
import { projects, specifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!validateAgentToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projectId = parseInt(params.id, 10);
    const body = await request.json();

    // Update project
    const [updatedProject] = await db
      .update(projects)
      .set({
        constitution: body.instructions || undefined,
        techStack: body.tech_stack || undefined,
      })
      .where(eq(projects.id, projectId))
      .returning();

    // Update specification if description provided
    if (body.description) {
      await db
        .update(specifications)
        .set({
          content: body.description,
        })
        .where(eq(specifications.projectId, projectId));
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
```

### 3. POST /api/agent/tasks
**Purpose:** Agent can decompose work into atomic tasks

```typescript
// src/app/api/agent/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken } from '@/lib/auth';
import { TaskCreateSchema } from '@/lib/schemas'; // Define this schema
import { db } from '@/db';
import { tasks } from '@/db/schema';

export async function POST(request: NextRequest) {
  if (!validateAgentToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = TaskCreateSchema.parse(body);

    const [newTask] = await db
      .insert(tasks)
      .values({
        planId: validated.plan_id,
        description: validated.description,
        priority: validated.priority || 1,
        filesInvolved: validated.files_involved || [],
        dependencyTaskId: validated.dependency_task_id || null,
        status: 'todo',
      })
      .returning();

    return NextResponse.json({
      success: true,
      task_id: newTask.id,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Required UI Implementations for MVP

### 1. CreateProjectDialog Component

```typescript
// src/components/create-project-dialog.tsx
'use client';

import { useState } from 'react';
import { createProject } from '@/lib/actions';

export function CreateProjectDialog({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    mission: '',
    description: '',
    techStack: '',
    instructions: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createProject({
        name: formData.name,
        constitution: formData.instructions,
        techStack: { stack: formData.techStack },
        basePath: process.cwd(),
      });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Project</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mission</label>
            <input
              type="text"
              required
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tech Stack</label>
            <input
              type="text"
              value={formData.techStack}
              onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
              placeholder="Next.js, React, PostgreSQL..."
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Instructions</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
```

### 2. Project Detail Page

```typescript
// src/app/projects/[id]/page.tsx
import { getProjects } from '@/lib/actions';
import { KanbanBoard } from '@/components/kanban-board';
import { TaskCreateDialog } from '@/components/create-task-dialog';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const result = await getProjects();
  const projectId = parseInt(params.id, 10);

  if (!result.success || !result.projects) {
    return <div>Error loading project</div>;
  }

  const project = result.projects.find((p) => p.id === projectId);

  if (!project) {
    return <div>Project not found</div>;
  }

  // TODO: Fetch tasks for this project
  const tasks = []; // Replace with actual task data

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        {project.constitution && (
          <p className="text-gray-600 mb-6">{project.constitution}</p>
        )}

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="font-semibold mb-2">Tech Stack</h3>
            <pre className="bg-white p-4 rounded border text-sm">
              {JSON.stringify(project.techStack, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Tasks</h2>
            <TaskCreateDialog projectId={projectId} />
          </div>
          <KanbanBoard tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
```

### Creating a New API Endpoint
1. Create file: `src/app/api/agent/[feature]/route.ts`
2. Export handler: `export async function POST(request: NextRequest)`
3. Validate auth: `validateAgentToken(request)`
4. Parse body: `await request.json()`
5. Validate input: Use Zod schema
6. Query database: Use Drizzle from `src/db`
7. Return response: Use `NextResponse.json()`

See [src/app/api/agent/mission/route.ts](src/app/api/agent/mission/route.ts) for example.

### Creating a New Component
1. Create file: `src/components/new-component.tsx`
2. Add `'use client'` if interactive
3. Import types: `import { TaskSelect } from '@/db/schema'`
4. Define props interface
5. Export component with proper types
6. Style with Tailwind classes

See [src/components/task-card.tsx](src/components/task-card.tsx) for example.

### Adding a Database Table
1. Add table to [src/db/schema.ts](src/db/schema.ts)
2. Export types: `export type NewTableInsert = ...`
3. Run migration: `npm run db:generate`
4. Push to database: `npm run db:push`
5. Update [src/lib/agent-memory.ts](src/lib/agent-memory.ts) with query helpers

### Creating a Server Action
1. Create/edit file in `src/lib/actions.ts`
2. Add `'use server'` at top
3. Use `try/catch` for error handling
4. Call `revalidatePath()` to update cache
5. Return `{ success: boolean, data?: T, error?: string }`

See [src/lib/actions.ts](src/lib/actions.ts) for examples.

---

## 🔍 Key Patterns

### Database Query Pattern
```typescript
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Query
const result = await db
  .select()
  .from(tasks)
  .where(eq(tasks.projectId, 1));

// Insert
const [newTask] = await db
  .insert(tasks)
  .values({ projectId: 1, description: 'Fix button' })
  .returning();

// Update
const [updated] = await db
  .update(tasks)
  .set({ status: 'done' })
  .where(eq(tasks.id, taskId))
  .returning();
```

### Error Handling Pattern
```typescript
'use server';

export async function myAction(input: unknown) {
  try {
    // Validate
    const validated = MySchema.parse(input);
    
    // Process
    const result = await db.insert(...).values(...);
    
    // Return success
    return { success: true, data: result };
  } catch (error) {
    console.error('Action error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### Component Data Fetching Pattern
```typescript
'use client';

import { useEffect, useState } from 'react';
import { getProjectTasks } from '@/lib/actions';

interface Task { id: number; description: string; }

export function TaskList({ projectId }: { projectId: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectTasks(projectId).then((result) => {
      if (result.success) {
        setTasks(result.tasks);
      }
      setLoading(false);
    });
  }, [projectId]);

  if (loading) return <div>Loading...</div>;
  if (!tasks.length) return <div>No tasks</div>;

  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id}>{task.description}</div>
      ))}
    </div>
  );
}
```

---

## 📊 Current Issues & Blockers

### CRITICAL - Developer Workflow Blocked
1. **New Project button shows alert** instead of creating
   - Location: [src/components/project-sidebar.tsx](src/components/project-sidebar.tsx)
   - Blocks: All developer workflows
   - Impact: Cannot create projects through UI
   - Fix: Wire to new dialog and `createProject` action
   - Effort: 2-3 hours

2. **No project detail page**
   - Missing: `src/app/projects/[id]/page.tsx`
   - Blocks: Cannot view individual projects
   - Impact: No project management interface
   - Fix: Create detail page with edit forms
   - Effort: 3-4 hours

3. **No task creation UI**
   - Missing: `src/components/create-task-dialog.tsx`
   - Blocks: Cannot manually add tasks
   - Impact: Cannot decompose work from UI
   - Fix: Create task form dialog
   - Effort: 2-3 hours

### CRITICAL - Agent Workflow Blocked
4. **Missing `POST /api/agent/projects` endpoint**
   - Impact: Agent cannot create projects
   - Blocks: Self-bootstrapping capability
   - Fix: Create endpoint with full project setup
   - Effort: 2 hours

5. **Missing `PATCH /api/agent/projects/:id` endpoint**
   - Impact: Agent cannot configure projects
   - Blocks: Project iteration
   - Fix: Create endpoint to update config
   - Effort: 2 hours

6. **Missing `POST /api/agent/tasks` endpoint**
   - Impact: Agent cannot create tasks
   - Blocks: Task decomposition
   - Fix: Create endpoint for task creation
   - Effort: 1.5 hours

### HIGH - Frontend Data Integration
7. **Hardcoded sample data in home page**
   - Location: [src/app/page.tsx](src/app/page.tsx)
   - Impact: UI doesn't reflect database
   - Fix: Load real data from `getProjectTasks()`
   - Effort: 2-3 hours

8. **Project selection doesn't navigate**
   - Location: [src/components/project-sidebar.tsx](src/components/project-sidebar.tsx)
   - Impact: Cannot switch between projects in UI
   - Fix: Implement `onProjectSelect` handler
   - Effort: 1-2 hours

### MEDIUM - Quality Issues
9. **No error handling**
   - Impact: Errors crash the page
   - Fix: Add error boundaries and proper error responses
   - Effort: 2-3 hours

10. **No loading states**
    - Impact: Users don't know if page is working
    - Fix: Add skeleton loaders
    - Effort: 2 hours

---

## 🎓 Learning Resources

### Understanding the Project
1. [specification.md](specification.md) - Project vision and requirements
2. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Current status
3. [plan.md](plan.md) - Implementation roadmap

### References
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Zod Validation](https://zod.dev)

---

## ⚠️ Important Constraints

1. **Type Safety First** - No `any` types, use strict TypeScript
2. **Database as Source of Truth** - All state lives in PostgreSQL
3. **Server Actions for Data** - All database writes through server actions
4. **Authentication Required** - Agent endpoints need `X-Agent-Token`
5. **Validation Always** - Use Zod for all external input
6. **Components are Dumb** - UI components fetch data via actions/props
7. **No Direct API Calls** - Components use server actions, not fetch()

---

## 🔗 Quick Links

**Documentation:**
- [INDEX.md](INDEX.md) - Documentation index
- [specification.md](specification.md) - Project vision
- [plan.md](plan.md) - Development roadmap
- [QUICKSTART.md](QUICKSTART.md) - Setup guide
- [EVALUATION.md](EVALUATION.md) - Current state analysis

**Source Code:**
- [Database Schema](src/db/schema.ts)
- [Agent Memory](src/lib/agent-memory.ts)
- [API Endpoints](src/app/api/agent/)
- [Components](src/components/)

**Development:**
- [docker-compose.yml](docker-compose.yml) - PostgreSQL setup
- [drizzle.config.ts](drizzle.config.ts) - ORM config
- [package.json](package.json) - Dependencies
- [tsconfig.json](tsconfig.json) - TypeScript config

---

## 📞 When You're Stuck

1. **Database issues?** → Run `npm run db:studio` to inspect state
2. **API not working?** → Check auth token and Zod validation
3. **Component not updating?** → Check if using `revalidatePath()`
4. **Build errors?** → Run `npm run build` to see full errors
5. **Database schema wrong?** → Delete and rerun `npm run db:push`
6. **Type errors?** → Check [src/db/schema.ts](src/db/schema.ts) and Zod schemas

See [QUICKSTART.md#troubleshooting](QUICKSTART.md#troubleshooting) for detailed help.

---

---

## 🎯 Success Criteria

### Phase 1A: Developer Capabilities (Week 1)
Developer should be able to:
- [ ] Create new project through "New Project" button
- [ ] See "Create Project" form with all fields (name, mission, description, tech, instructions)
- [ ] Successfully create project and see it in sidebar
- [ ] Click project to navigate to detail page
- [ ] View project details (mission, description, tech stack, instructions)
- [ ] Edit project configuration
- [ ] See active specification and plan
- [ ] See Kanban board with real tasks from database
- [ ] Create new task with description, priority, dependencies
- [ ] See newly created tasks appear in Kanban

**Success Indicator:** Developer can go through complete project setup and task management workflow without API

### Phase 1B: Agent Capabilities (Week 1)
Agent should be able to:
- [ ] Call `POST /api/agent/projects` and create new project
- [ ] Receive project_id in response
- [ ] Call `GET /api/agent/mission?project_id={id}` and get project context
- [ ] Call `PATCH /api/agent/projects/:id` to update project config
- [ ] Call `POST /api/agent/tasks` to create new tasks
- [ ] Call `PATCH /api/agent/tasks/:id` to move task to in_progress
- [ ] Call `POST /api/agent/verify` to log test results
- [ ] Call `POST /api/agent/logs` to add execution logs
- [ ] Work through complete project without any manual intervention

**Success Indicator:** Agent can bootstrap a project completely from scratch and manage it through API

### Phase 2: Combined System
- [ ] Developer creates base project with mission and instructions
- [ ] Agent picks it up via API
- [ ] Agent creates detailed tasks
- [ ] Developer monitors progress in real-time Kanban
- [ ] Agent moves tasks through workflow
- [ ] Developer sees agent logs and test results
- [ ] Developer can adjust project mid-execution

**Success Indicator:** Complete feedback loop between developer UI and agent API

### MVP Complete (Phase 1-2)
- [ ] Phases 1A and 1B fully complete
- [ ] Phase 2 integration working
- [ ] App self-hosting on spec-drivr platform
- [ ] Agent can autonomously plan, create, execute, verify
- [ ] Developer can monitor and adjust at any point

---

## 📝 File Checklist

Before committing changes:
- [ ] Code follows TypeScript strict mode
- [ ] All imports use `@/` alias
- [ ] Components are typed with interfaces
- [ ] Server actions have error handling
- [ ] Database queries use Drizzle properly
- [ ] No console.log in production code (debug → agent_logs table)
- [ ] UI tested in browser
- [ ] No TypeScript errors: `npm run build`

---

## 📝 File Checklist

Before committing changes:
- [ ] Code follows TypeScript strict mode
- [ ] All imports use `@/` alias
- [ ] Components are typed with interfaces
- [ ] Server actions have error handling
- [ ] Database queries use Drizzle properly
- [ ] No console.log in production code (debug → agent_logs table)
- [ ] UI tested in browser
- [ ] No TypeScript errors: `npm run build`

---

## 🔗 Implementation Priorities (TLDR)

### 🔴 Do These First (Week 1)
1. **Implement 3 critical APIs** (5 hours total)
   - `POST /api/agent/projects` - Agent project creation
   - `PATCH /api/agent/projects/:id` - Agent project configuration
   - `POST /api/agent/tasks` - Agent task creation

2. **Implement Developer UIs** (10 hours total)
   - Create project dialog + "New Project" button wire-up
   - Project detail page at `/projects/[id]`
   - Task creation dialog in project view
   - Load real data in home page Kanban

3. **Test End-to-End Workflows** (2 hours)
   - Developer creates project → Agent sees it via API → Agent creates tasks
   - Developer monitors progress → Agent moves tasks between statuses
   - Both workflows work in parallel

### 🟡 Do These Next (Week 2)
- Add drag-and-drop to Kanban
- Task details modal
- Test results logging UI
- Agent logs viewer

### 🟢 Nice to Have (Week 3+)
- Error boundaries
- Loading states
- Automated tests
- Database optimization

---

**Last Updated:** March 5, 2026  
**Status:** Phase 1 implementation starting  
**Next:** Build critical APIs and developer UIs
