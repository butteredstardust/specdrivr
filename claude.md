# claude.md - Spec-Drivr Development Guide

**Project:** Spec-Drivr - Autonomous Development Platform
**Status:** 70% complete (Core infrastructure + Project management + Agent Control APIs complete)
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
- **Frontend:** Next.js 14 App Router + React 18 + Tailwind CSS + @dnd-kit
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
  "validation": "Zod",
  "drag-drop": "@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities"
}
```

### Running Locally
```bash
# Setup
npm run db:push                    # Create database schema

# Seed Data Options:
## Option 1: Demo data (3 projects with realistic content)
psql $DATABASE_URL < db/seed-demo.sql

## Option 2: Simple test data (minimal)
psql $DATABASE_URL < db/seed-simple.sql

## Option 3: Plan implementation tasks (from original roadmap)
psql $DATABASE_URL < db/seed-plan.sql

# Development
npm run dev                        # Start dev server (http://localhost:3000)
npm run dev:clean                  # Kill existing processes and start fresh
npm run db:studio                  # Open database explorer

# Dev Server Management (NEW!)
npm run killall                    # Kill all Next.js dev processes
npm run kill:3000                  # Kill process on port 3000
npm run kill:3001                  # Kill process on port 3001

# Build & Deploy
npm run build                      # Production build
npm run start                      # Run production server
```

**Seed Data Summary:**
- **seed-demo.sql**: 3 comprehensive projects (Event Platform, IoT Dashboard, AI Code Review) with 24 tasks, test results, and logs
- **seed-simple.sql**: 2 basic projects for quick testing
- **seed-plan.sql**: 1 project with implementation tasks from the roadmap

**Note:** If you get "Port 3000 is in use," either:
1. Run `npm run killall` to clean up old processes
2. Or use `npm run dev:clean` to start fresh
3. The app will automatically use port 3001 if 3000 is busy

---

## 📁 Directory Structure

```
specdrivr/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage with Kanban dashboard
│   │   ├── projects/[id]/page.tsx # Project detail pages (with sidebar)
│   │   ├── api/
│   │   │   ├── agent/            # Agent API endpoints
│   │   │   │   ├── mission/      # GET - Get next task/project context
│   │   │   │   ├── plans/        # POST - Create/update plans
│   │   │   │   ├── tasks/[id]/   # PATCH - Update task status
│   │   │   │   ├── verify/       # POST - Log test results
│   │   │   │   └── logs/         # POST - Add agent logs
│   │   │   ├── projects/
│   │   │   │   └── [id]/agent/   # Agent control endpoints (NEW!)
│   │   │   │       ├── status/   # GET - Agent status
│   │   │   │       ├── start/    # POST - Start agent
│   │   │   │       ├── pause/    # POST - Pause agent
│   │   │   │       ├── stop/     # POST - Stop agent
│   │   │   │       └── retry/    # POST - Retry project
│   │   │   └── tasks/
│   │   │       └── [id]/agent/   # Task control endpoints (NEW!)
│   │   │           ├── retry/    # POST - Retry task
│   │   │           └── skip/     # POST - Skip task
│   │   └── layout.tsx            # Root layout
│   ├── components/               # React components
│   │   ├── kanban-board.tsx      # Drag-and-drop task board
│   │   ├── project-sidebar-wrapper.tsx # Client wrapper for navigation
│   │   ├── project-sidebar.tsx   # Project list navigation
│   │   ├── task-card.tsx         # Draggable task cards
│   │   ├── create-project-dialog.tsx # Project creation form
│   │   ├── test-results-panel.tsx
│   │   ├── agent-logs.tsx
│   │   └── specification-viewer.tsx
│   ├── lib/
│   │   ├── actions.ts            # Server actions (DB queries)
│   │   ├── agent-memory.ts       # Database context helpers
│   │   └── auth.ts               # Auth middleware
│   ├── db/
│   │   ├── index.ts              # Database client
│   │   └── schema.ts             # Drizzle schema definition
│   └── styles/
│       └── globals.css
├── db/
│   ├── seed-simple.sql           # Initial project data (2 projects)
│   └── seed-plan.sql             # Implementation tasks
├── public/                       # Static assets
├── documentation/
│   ├── specification.md          # Project vision
│   ├── plan.md                   # Implementation roadmap
│   ├── PROJECT_SUMMARY.md        # Overview
│   ├── QUICKSTART.md             # Setup guide
│   ├── INDEX.md                  # Documentation index
│   └── claude.md                 # This file
│
docker-compose.yml                # PostgreSQL setup
drizzle.config.ts                 # ORM configuration
package.json                      # Dependencies
tailwind.config.mjs              # Tailwind config

```

---

## 🗂️ Key Files & Their Purpose

### Database Layer
- **[src/db/schema.ts](src/db/schema.ts)** - Drizzle schema with 6 tables + agent control fields
  - `projects` - Projects metadata (with agent_status, agent_started_at, agent_stopped_at)
  - `specifications` - Project specs (versioned)
  - `plans` - Architecture decisions
  - `tasks` - Implementation tasks with status (with retry_count, notes, completed_at)
  - `test_results` - Test pass/fail logs
  - `agent_logs` - Agent execution logs (with project_id for faster filtering)

- **[src/db/index.ts](src/db/index.ts)** - Database client initialization

### API Layer - Agent Core (Implemented ✅)
- **[src/app/api/agent/mission/route.ts](src/app/api/agent/mission/route.ts)** - `GET /api/agent/mission?project_id=1`
  - Returns: active spec, plan, next task, project stats
  - Status: ✅ Working
  - Auth: Requires `X-Agent-Token` header
  - Used by: Agent to understand current context

- **[src/app/api/agent/plans/route.ts](src/app/api/agent/plans/route.ts)** - `POST /api/agent/plans`
  - Create or update architecture plans
  - Body: spec_id, architecture_decisions
  - Used by: Agent to publish architecture decisions
  - Status: ✅ Working

- **[src/app/api/agent/tasks/[id]/route.ts](src/app/api/agent/tasks/[id]/route.ts)** - `PATCH /api/agent/tasks/:id`
  - Update task status (todo → in_progress → done)
  - Body: status, updated_at
  - Used by: Agent to move task through workflow
  - Status: ✅ Working

- **[src/app/api/agent/verify/route.ts](src/app/api/agent/verify/route.ts)** - `POST /api/agent/verify`
  - Log test results after verification
  - Body: task_id, success, logs
  - Used by: Agent to record test pass/fail
  - Status: ✅ Working

- **[src/app/api/agent/logs/route.ts](src/app/api/agent/logs/route.ts)** - `POST /api/agent/logs`
  - Add agent execution logs
  - Body: task_id, level, message, context
  - Used by: Agent to provide execution visibility
  - Status: ✅ Working

### API Layer - Agent Control (NEW! ✅)
- **[src/app/api/projects/[id]/agent/status/route.ts](src/app/api/projects/[id]/agent/status/route.ts)** - `GET /api/projects/1/agent/status`
  - Returns: agent_status, current_task, uptime, recent_logs, error_count
  - Used by: Frontend to show agent status in real-time
  - Status: ✅ Working

- **[src/app/api/projects/[id]/agent/start/route.ts](src/app/api/projects/[id]/agent/start/route.ts)** - `POST /api/projects/1/agent/start`
  - Starts agent work on a project
  - Sets: agent_status = 'running', agent_started_at = now()
  - Used by: Frontend "Start Work" button
  - Status: ✅ Implemented

- **[src/app/api/projects/[id]/agent/pause/route.ts](src/app/api/projects/[id]/agent/pause/route.ts)** - `POST /api/projects/1/agent/pause`
  - Pauses agent work, keeps current task in progress state
  - Sets: agent_status = 'paused'
  - Status: ✅ Implemented

- **[src/app/api/projects/[id]/agent/stop/route.ts](src/app/api/projects/[id]/agent/stop/route.ts)** - `POST /api/projects/1/agent/stop`
  - Immediately stops agent, marks current task as blocked
  - Sets: agent_status = 'stopped', agent_stopped_at = now()
  - Status: ✅ Implemented

- **[src/app/api/projects/[id]/agent/retry/route.ts](src/app/api/projects/[id]/agent/retry/route.ts)** - `POST /api/projects/1/agent/retry`
  - Tells agent to retry the current or most recent failed task
  - Status: ✅ Implemented

- **[src/app/api/tasks/[id]/agent/retry/route.ts](src/app/api/tasks/[id]/agent/retry/route.ts)** - `POST /api/tasks/42/agent/retry`
  - Retry a failed or blocked task
  - Increments: retry_count, resets status to 'todo'
  - Status: ✅ Implemented

- **[src/app/api/tasks/[id]/agent/skip/route.ts](src/app/api/tasks/[id]/agent/skip/route.ts)** - `POST /api/tasks/42/agent/skip`
  - Mark task as done without execution
  - Sets: status = 'done', completed_at = now()
  - Status: ✅ Implemented

### API Layer - Missing (Need Implementation)
- **[ ] POST /api/agent/projects** - Agent project creation
  - Accept: name, mission, description, tech_stack, instructions, base_path
  - Return: { project_id, specification_id, plan_id }
  - Priority: 🔴 Critical for agent self-bootstrapping

- **[ ] PATCH /api/agent/projects/:id** - Agent project configuration
  - Accept: mission, description, instructions, tech_stack
  - Update: projects + specifications
  - Priority: 🔴 Critical for agent iteration

- **[ ] POST /api/agent/tasks** - Agent task creation
  - Accept: plan_id, description, priority, files_involved, dependency_task_id
  - Return: { task_id }
  - Priority: 🔴 Critical for task decomposition

- **[ ] POST /api/projects** - Developer project creation
  - Accept: name, mission, description, tech_stack, instructions
  - Return: { project_id }
  - Priority: 🟡 Medium (can use create-project-dialog.tsx for now)

- **[ ] POST /api/tasks** - Developer task creation
  - Accept: project_id, description, priority, files_involved, dependency_task_id
  - Return: { task_id }
  - Priority: 🟡 Medium (can create via database/API directly)

### Backend Utilities
- **[src/lib/agent-memory.ts](src/lib/agent-memory.ts)** - Database query helpers
  - `getProjectContext(projectId)` - Get spec, plan, tasks
  - `getNextTask(projectId)` - Get next todo task based on dependencies
  - `updateTaskStatus(taskId, status)` - Change task state
  - `logTestResult(taskId, success, logs)` - Record test run
  - `addAgentLog(taskId, level, message)` - Log agent action

- **[src/lib/actions.ts](src/lib/actions.ts)** - Server actions
  - `createProject(data)` - Create new project
  - `getProjects()` - Fetch all projects
  - `getProjectTasks(projectId)` - Get project tasks (WIP - needs fixing)
  - `updateTaskStatus(taskId, status)` - Update task

- **[src/lib/auth.ts](src/lib/auth.ts)** - Authentication
  - `validateAgentToken(request)` - Check X-Agent-Token header
  - Returns 401 if missing/invalid

- **[src/lib/schemas.ts](src/lib/schemas.ts)** - Zod validation
  - Request/response schemas for all endpoints
  - Type-safe validate at runtime

### Frontend Components
- **[src/app/page.tsx](src/app/page.tsx)** - Homepage with all projects Kanban
  - Shows all projects sidebar + Kanban dashboard
  - Fetches real data from database
  - Status: ✅ Working

- **[src/app/projects/[id]/page.tsx](src/app/projects/[id]/page.tsx)** - Project detail page
  - Shows project info, constitution, tech stack, specification
  - Shows Kanban board with project-specific tasks
  - Shows Test Results and Agent Logs panels
  - Fixed: Now includes ProjectSidebarWrapper for navigation
  - Status: ✅ Working

- **[src/components/kanban-board.tsx](src/components/kanban-board.tsx)** - Drag-and-drop Kanban
  - ✅ Drag-and-drop implemented (Phase 2 complete!)
  - Groups tasks by status (todo, in_progress, done, blocked)
  - Shows task counts per column
  - Updates database via updateTaskStatus server action
  - Status: ✅ Fully working with drag-and-drop

- **[src/components/task-card.tsx](src/components/task-card.tsx)** - Draggable task cards
  - ✅ Draggable with @dnd-kit
  - Shows priority (color-coded border), description, status badge
  - Shows files involved
  - Status: ✅ Working

- **[src/components/project-sidebar.tsx](src/components/project-sidebar.tsx)** - Project list
  - Shows all projects
  - "New Project" button wired to CreateProjectDialog
  - Click to navigate to project detail page
  - Status: ✅ Working

- **[src/components/project-sidebar-wrapper.tsx](src/components/project-sidebar-wrapper.tsx)** - Client wrapper
  - Enables client-side navigation between projects
  - Used on all pages
  - Status: ✅ Working

- **[src/components/create-project-dialog.tsx](src/components/create-project-dialog.tsx)** - Project creation form
  - Form fields: name, mission, description, techStack, instructions
  - Client component with server action
  - Success/error feedback
  - Status: ✅ Working

- **[src/components/test-results-panel.tsx](src/components/test-results-panel.tsx)** - Test results display
  - Placeholder component
  - Status: 🟡 Needs real data integration

- **[src/components/agent-logs.tsx](src/components/agent-logs.tsx)** - Agent logs display
  - Placeholder component
  - Status: 🟡 Needs real data integration

---

## 🔄 Data Flow & Workflows

### Developer Workflow (Web UI)
```
1. Developer opens homepage → sees all projects in sidebar
   ↓
2. Developer clicks "New Project" → CreateProjectDialog opens
   ↓
3. Developer fills form: name, mission, description, techStack, instructions
   ↓
4. Developer clicks "Create" → POST to server action createProject
   ↓
5. Database creates: project, specification (active), plan (draft)
   ↓
6. Sidebar revalidates → new project appears
   ↓
7. Developer clicks project → navigate to /projects/[id]
   ↓
8. Project detail page shows:
   - Project info (name, constitution, tech stack)
   - Specification viewer
   - Kanban board with real tasks from database
   - Test Results panel (placeholder)
   - Agent Logs panel (placeholder)
   ↓
9. Developer can drag-and-drop tasks between columns
   ↓
10. Drag triggers PATCH to updateTaskStatus → saves to database
```

### Agent Workflow (Agent API)
```
1. Agent starts work
   ↓
2. Agent calls GET /api/agent/mission?project_id=1
   ↓
3. Server validates X-Agent-Token header
   ↓
4. Server fetches from database:
   - Project details
   - Active specification
   - Plan
   - All tasks
   ↓
5. Server determines next task via getNextTask()
   ↓
6. Returns JSON: { project, specification, plan, nextTask, context }
   ↓
7. Agent executes task based on description
   ↓
8. Agent moves task to in_progress: PATCH /api/agent/tasks/:id
   ↓
9. Agent executes tests and gets results
   ↓
10. Agent logs results: POST /api/agent/verify
    ↓
11. Agent moves task to done: PATCH /api/agent/tasks/:id
    ↓
12. Agent logs execution: POST /api/agent/logs
    ↓
13. Loop back to step 2 for next task
```

### Agent Self-Bootstrapping Workflow
```
1. Agent receives: "Build a feature for Spec-Drivr"
   ↓
2. Agent realizes it needs to create a project
   ↓
3. Agent calls: POST /api/agent/projects (⚠️ NOT YET IMPLEMENTED)
   ↓
4. Server creates project + specification + plan
   ↓
5. Agent calls: PATCH /api/agent/projects/:id (⚠️ NOT YET IMPLEMENTED)
   ↓
6. Agent calls: POST /api/agent/tasks multiple times (⚠️ NOT YET IMPLEMENTED)
   ↓
7. Agent loops through tasks via GET /api/agent/mission?project_id=:id
   ↓
8. Developer can monitor progress at http://localhost:3000/projects/:id
```

### Agent Control Workflow (NEW!)
```
1. Developer opens project detail page
   ↓
2. Developer clicks "Start Work" button
   ↓
3. Frontend calls: POST /api/projects/1/agent/start
   ↓
4. Server updates: agent_status = 'running', agent_started_at = now()
   ↓
5. Frontend polls: GET /api/projects/1/agent/status (every 5s)
   ↓
6. Frontend shows real-time updates:
   - Current task being executed
   - Uptime counter
   - Recent logs
   - Error count
   ↓
7. Developer can click "Pause" → agent_status = 'paused'
   ↓
8. Developer can click "Stop" → agent_status = 'stopped', task = 'blocked'
   ↓
9. Developer can click "Retry Task" → retry_count++, status = 'todo'
   ↓
10. Agent can self-report status via POST /api/agent/logs
```

---

## 🎮 Agent Control & Visibility Panel (IMPLEMENTED!)

### Developer-Visible Agent Operations

The web UI provides **complete visibility into agent execution** with control capabilities:

#### Project-Level Controls & Status
```
┌─────────────────────────────────────────────────────┐
│  Project: "Spec-Drivr" | Status: 🟢 Running         │
├─────────────────────────────────────────────────────┤
│  Agent Uptime: 18 minutes                          │
│  Current Task: #42 - "Update UI components"        │
│  Last Heartbeat: 2 seconds ago                     │
│  Recent Errors: 0                                  │
│                                                    │
│  ┌─ Controls ───────────────────────────────────┐ │
│  │  [🚀 Start] [⏸️ Pause] [⛔ Stop] [🔄 Retry] │ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
│  Recent Logs:                                      │
│  ┌──────────────────────────────────────────────┐ │
│  │ [19:45:23] INFO: Starting task execution     │ │
│  │ [19:45:28] DEBUG: Analyzing requirements     │ │
│  │ [19:46:12] INFO: Writing components          │ │
│  │ [19:47:23] INFO: Running tests (4/5 passing) │ │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Implementation:**
- GET /api/projects/1/agent/status - Real-time status polling
- POST /api/projects/1/agent/start - Start agent
- POST /api/projects/1/agent/pause - Pause agent
- POST /api/projects/1/agent/stop - Stop agent
- POST /api/projects/1/agent/retry - Retry project
- Database stores agent_status, agent_started_at, agent_stopped_at
- Agent logs automatically populate via POST /api/agent/logs

---

## 👥 Dual-Purpose Architecture

This platform serves **two distinct users:**

1. **The Developer** - Human using the web UI to manage projects
2. **The Agent** - AI calling APIs to execute tasks

Both work from the **same PostgreSQL database**, ensuring perfect synchronization.

---

## 📊 Implementation Status

### ✅ Phase 1: Infrastructure Foundation (COMPLETE)
- [x] Database schema and migrations (6 tables, proper relationships)
- [x] Drizzle ORM setup with TypeScript types
- [x] Authorization middleware (`X-Agent-Token` validation)
- [x] Server actions framework for safe data operations
- [x] Basic UI components structure
- [x] Core API endpoints for agent feedback loop
- [x] Project sidebar navigation
- [x] Create project dialog (New Project button wired)
- [x] Project detail pages with sidebar navigation
- [x] Database seeding with 2 sample projects
- [x] All pages have consistent sidebar navigation

### ✅ Phase 2: Enhanced Interactivity (COMPLETE)
- [x] **Drag-and-drop Kanban board** (@dnd-kit implementation)
- [x] Task cards are draggable between columns
- [x] Drag updates database via server actions
- [x] Smooth UX with DragOverlay preview
- [x] TypeScript compilation fixes
- [x] Self-referencing foreign key resolved
- [x] Conditional rendering type fixes
- [x] All drag-and-drop features working end-to-end

### 🟡 Phase 3: Agent Control APIs (COMPLETE - NEW!)
**All agent control APIs have been implemented and are working:**

Project-Level Control:
- [x] GET /api/projects/:id/agent/status - Get real-time agent status
- [x] POST /api/projects/:id/agent/start - Start agent work
- [x] POST /api/projects/:id/agent/pause - Pause agent work
- [x] POST /api/projects/:id/agent/stop - Stop agent immediately
- [x] POST /api/projects/:id/agent/retry - Retry entire project

Task-Level Control:
- [x] POST /api/tasks/:id/agent/retry - Retry individual task
- [x] POST /api/tasks/:id/agent/skip - Skip individual task

Database Schema Extensions:
- [x] projects.agent_status enum (idle/running/paused/stopped/error)
- [x] projects.agent_started_at timestamp
- [x] projects.agent_stopped_at timestamp
- [x] tasks.retry_count integer (tracks retry attempts)
- [x] tasks.notes text (agent can add notes)
- [x] tasks.completed_at timestamp
- [x] agent_logs.project_id (denormalized for faster filtering)

### 🟡 Phase 4: Features (Partially Complete)
- [x] Agent control APIs and endpoints
- [x] Agent status tracking in database
- [x] Retry and skip functionality
- [ ] Real-time agent logs viewer (placeholder exists)
- [ ] Test results logging UI (placeholder exists)
- [ ] Specification editor (not started)
- [ ] Plan editor (not started)

### 🔴 Phase 5: Agent Self-Bootstrapping (Blocked)
These APIs are required for an agent to create a project from scratch:

- [ ] **POST /api/agent/projects** - Agent project creation
  - Blocker: Agent cannot self-bootstrap without this
  - Priority: 🔴 CRITICAL
  - Effort: 2 hours

- [ ] **PATCH /api/agent/projects/:id** - Agent project configuration
  - Blocker: Agent cannot refine project config
  - Priority: 🔴 CRITICAL
  - Effort: 2 hours

- [ ] **POST /api/agent/tasks** - Agent task creation
  - Blocker: Agent cannot decompose work
  - Priority: 🔴 CRITICAL
  - Effort: 1.5 hours

### 🔴 Phase 6: Developer Convenience APIs (Nice to Have)
These are duplicate functionality but provide cleaner REST interface:

- [ ] POST /api/projects - Developer project creation
  - Alternative: create-project-dialog.tsx already works
  - Priority: 🟡 Medium

- [ ] POST /api/tasks - Developer task creation
  - Alternative: Can create via database directly
  - Priority: 🟡 Medium

---

## 🎯 Critical Path to Fully Autonomous Agent

### Goal: Agent can create and manage projects without human intervention

**Current Blockers:**

1. **Agent cannot create projects**
   - Missing: `POST /api/agent/projects`
   - Impact: Agent must be "assigned" to existing project
   - Cannot self-bootstrap from natural language request

2. **Agent cannot update project configuration**
   - Missing: `PATCH /api/agent/projects/:id`
   - Impact: Agent cannot refine project scope mid-execution
   - Must get it right on first attempt

3. **Agent cannot create tasks**
   - Missing: `POST /api/agent/tasks`
   - Impact: Agent must have all tasks pre-created
   - Cannot decompose work dynamically

**Once these 3 endpoints exist:**

```
Human: "Build a real-time chat app"
    ↓
Agent calls: POST /api/agent/projects
    ↓
Server creates: project, spec, plan
    ↓
Agent reads: GET /api/agent/mission
    ↓
Agent creates tasks: POST /api/agent/tasks (multiple)
    ↓
Agent executes: PATCH /api/agent/tasks/:id, POST /api/agent/verify, POST /api/agent/logs
    ↓
Agent monitors: GET /api/agent/mission (loop)
    ↓
Human monitors: visits http://localhost:3000/projects/:id
    ↓
Human controls: clicks Pause/Stop buttons (POST /api/projects/:id/agent/pause)
    ↓
Agent responds: gracefully pauses, saves state to DB
```

### Implementation Priority (Updated)

**Phase 5 - CRITICAL (2-3 hours total):**
1. Implement `POST /api/agent/projects` (2 hours)
2. Implement `PATCH /api/agent/projects/:id` (2 hours)
3. Implement `POST /api/agent/tasks` (1.5 hours)

**Phase 6 - Nice to have (if time permits):**
4. Add loading states and skeleton components
5. Add error boundaries
6. Add specification editor
7. Add plan editor

---

## 🧪 Testing & Validation

### Manual Testing Checklist
- [x] Database connection works: `npm run db:studio`
- [x] API endpoints respond: `curl -H "X-Agent-Token: dev-agent-token-12345" http://localhost:3000/api/agent/mission?project_id=1`
- [x] Home page loads: `http://localhost:3000`
- [x] Projects load from database (sidebar shows "Spec-Drivr" and "Website Redesign")
- [x] Kanban board displays tasks from database
- [x] Drag-and-drop works between columns
- [x] Task status updates persist after refresh
- [x] No console errors in browser DevTools
- [x] Project detail pages load: `/projects/1`
- [x] Create project dialog creates new project
- [x] Sidebar navigation works on all pages

### Test Agent Workflow
```bash
# Get mission
curl "http://localhost:3000/api/agent/mission?project_id=1" \
  -H "X-Agent-Token: dev-agent-token-12345"

# Update task status
curl -X PATCH "http://localhost:3000/api/agent/tasks/1" \
  -H "X-Agent-Token: dev-agent-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'

# Log test result
curl -X POST "http://localhost:3000/api/agent/verify" \
  -H "X-Agent-Token: dev-agent-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"task_id":1,"success":true,"logs":"All tests passing"}'

# Get agent status
curl "http://localhost:3000/api/projects/1/agent/status"
```

### Debugging Database
```bash
# Open database explorer
npm run db:studio

# Direct database access
psql $DATABASE_URL
  \dt                          # List tables
  SELECT * FROM projects;      # View projects
  SELECT * FROM tasks WHERE project_id = 1;  # View tasks
  SELECT * FROM agent_logs ORDER BY timestamp DESC LIMIT 20;  # Recent logs
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

**Security:** Keep `.env.local` out of version control (included in .gitignore)

---

## 🎨 Component & API Quick Reference

### Creating a New Component
1. Create file: `src/components/new-component.tsx`
2. Add `'use client'` if interactive
3. Import types: `import { TaskSelect } from '@/db/schema'`
4. Define props interface
5. Export component with proper types
6. Use Tailwind for styling

See [src/components/task-card.tsx](src/components/task-card.tsx) for example.

### Creating a New API Endpoint
1. Create dir: `src/app/api/[feature]/route.ts`
2. Add auth check: `validateAgentToken(request)` for agent APIs
3. Parse body: `await request.json()`
4. Validate input: Use Zod schema
5. Query database: Use Drizzle from `src/db`
6. Return: `NextResponse.json({ success: true, data: ... })`

See [src/app/api/agent/mission/route.ts](src/app/api/agent/mission/route.ts) for example.

### Creating a Server Action
1. Create/edit file in `src/lib/actions.ts`
2. Add `'use server'` at top
3. Use `try/catch` for error handling
4. Call `revalidatePath()` to update cache
5. Return: `{ success: boolean, data?: T, error?: string }`

See [src/lib/actions.ts](src/lib/actions.ts) for examples.

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
const [newProject] = await db
  .insert(projects)
  .values({ name: 'My Project' })
  .returning();

// Update
await db
  .update(tasks)
  .set({ status: 'done' })
  .where(eq(tasks.id, 42));
```

---

## ⚠️ Known Issues & Limitations

### Current Known Issues
1. **Circular dependency in schema** (workaround implemented)
   - Location: schema.ts line 51
   - Issue: Self-referencing foreign key in tasks table
   - Workaround: Commented out, using plain integer field instead
   - Impact: No referential integrity for dependency_task_id
   - Fix: Could use deferred constraints or application-level validation

2. **getProjectTasks server action is broken**
   - Location: src/lib/actions.ts line 55
   - Issue: FlatMap chaining doesn't work with TypeScript type inference
   - Impact: Cannot fetch tasks by projectId via this action
   - Workaround: Use getProjectContext() from agent-memory.ts instead
   - Fix: Refactor to use proper Drizzle relations or write raw SQL

3. **No loading states or skeleton components**
   - Impact: Users see blank screen while data loads
   - Priority: Low (app works, just not polished)
   - Fix: Add loading.tsx files in route directories

4. **No error boundaries**
   - Impact: Errors crash the entire page
   - Priority: Low (no known errors in production flow)
   - Fix: Add error.tsx files in route directories

### Performance Considerations
- Agent logs are fetched synchronously - could add pagination
- No database indexes beyond primary keys - could add composite indexes
- Project detail page fetches all projects for sidebar on every load - could cache

---

## 📞 When You're Stuck

### Common Issues

**Database issues?**
```bash
# Reset database (destructive!)
docker-compose down -v
docker-compose up -d
npm run db:push
psql $DATABASE_URL < db/seed-simple.sql
```

**Dev server won't start?**
```bash
# Kill any hanging processes
pkill -f "npm run dev"
npm run dev
```

**TypeScript errors?**
```bash
# Check specific file
npx tsc --noEmit --incremental false src/components/kanban-board.tsx

# Full type check
npm run build
```

**Build fails?**
```bash
# Check for circular dependencies
npm run build 2>&1 | grep "error"

# Clear cache
rm -rf .next
npm run build
```

**Agent API returns 401?**
```bash
# Check your token
cat .env.local | grep AGENT_TOKEN

# Test manually
curl -H "X-Agent-Token: dev-agent-token-12345" http://localhost:3000/api/agent/mission?project_id=1
```

**More help?**
- Drizzle errors: Check [drizzle.config.ts](drizzle.config.ts)
- Auth errors: Check [src/lib/auth.ts](src/lib/auth.ts)
- Schema errors: Check [src/db/schema.ts](src/db/schema.ts)
- Component errors: Check for missing 'use client' directives

---

## 📚 Learning Resources

### Understanding the Project
1. [specification.md](specification.md) - Project vision and requirements
2. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Current status
3. [plan.md](plan.md) - Implementation roadmap
4. [QUICKSTART.md](QUICKSTART.md) - Setup guide
5. [EVALUATION.md](EVALUATION.md) - Architecture assessment

### Technology References
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Zod Validation](https://zod.dev)
- [@dnd-kit Drag & Drop](https://dndkit.com)

---

## 🔗 Quick Links

**Documentation:**
- [specification.md](specification.md) - Project vision
- [plan.md](plan.md) - Development roadmap
- [QUICKSTART.md](QUICKSTART.md) - Setup guide

**Source Code:**
- [Database Schema](src/db/schema.ts)
- [Agent Memory](src/lib/agent-memory.ts)
- [Agent APIs](src/app/api/agent/)
- [Control APIs](src/app/api/projects/[id]/agent/)
- [Components](src/components/)

**Development:**
- [docker-compose.yml](docker-compose.yml) - PostgreSQL setup
- [drizzle.config.ts](drizzle.config.ts) - ORM config
- [package.json](package.json) - Dependencies

---

## ✅ File Checklist (Before Committing)

- [ ] Code follows TypeScript strict mode
- [ ] All imports use `@/` alias
- [ ] Components are typed with interfaces
- [ ] Server actions have error handling
- [ ] Database queries use Drizzle properly
- [ ] No console.log in production code
- [ ] UI tested in browser
- [ ] No TypeScript errors: `npm run build`
- [ ] Code formatted (consistent spacing)
- [ ] Git commit message follows convention

---

## 📝 Success Criteria (Updated)

### Phase 1-3: Complete! ✅
- [x] Developers can create projects via UI
- [x] Developers can navigate between all projects
- [x] Developers can view project details
- [x] Kanban board shows real data with drag-and-drop
- [x] Agent APIs work for mission, plans, tasks, verify, logs
- [x] Agent control APIs implemented (start, pause, stop, status, retry)
- [x] Database tracks agent state (agent_status, retry_count, etc)

### Phase 5: Critical (Next)
- [ ] Agent can create projects via API
- [ ] Agent can update project config via API
- [ ] Agent can create tasks via API
- [ ] Agent can self-bootstrap from natural language

### MVP Complete (When Phase 5 done)
- [ ] Agent receives natural language request
- [ ] Agent creates full project structure
- [ ] Agent executes all tasks autonomously
- [ ] Developer monitors via web UI
- [ ] Developer can pause/resume/stop agent
- [ ] Agent completes entire project

---

**Last Updated:** March 5, 2026
**Status:** Phase 1, 2, 3 Complete! 🎉
**Next:** Phase 5 - Agent Self-Bootstrapping (3 endpoints, 5.5 hours)
