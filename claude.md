# claude.md - Spec-Drivr Development Guide

**Project:** Spec-Drivr - Autonomous Development Platform  
**Status:** 40% complete (Phase 1 implementation in progress)  
**Last Updated:** March 4, 2026

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

- **[src/app/api/agent/plans/route.ts](src/app/api/agent/plans/route.ts)** - `POST /api/agent/plans`
  - Create or update architecture plans
  - Body: spec_id, architecture_decisions

- **[src/app/api/agent/tasks/[id]/route.ts](src/app/api/agent/tasks/[id]/route.ts)** - `PATCH /api/agent/tasks/:id`
  - Update task status (todo → in_progress → done)
  - Body: status, updated_at

- **[src/app/api/agent/verify/route.ts](src/app/api/agent/verify/route.ts)** - `POST /api/agent/verify`
  - Log test results after verification
  - Body: task_id, success, logs

- **[src/app/api/agent/logs/route.ts](src/app/api/agent/logs/route.ts)** - `POST /api/agent/logs`
  - Add agent execution logs
  - Body: task_id, level, message

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

## 🔄 Data Flow

### Normal Workflow
```
User Action
    ↓
Next.js Page/Component
    ↓
Server Action (src/lib/actions.ts)
    ↓
Drizzle Query (src/db/*)
    ↓
PostgreSQL
    ↓
Response to Component
    ↓
UI Update
```

### Agent Workflow
```
Agent API Request (X-Agent-Token header)
    ↓
Auth Check (src/lib/auth.ts)
    ↓
Zod Validation (src/lib/schemas.ts)
    ↓
Agent Memory Helper (src/lib/agent-memory.ts)
    ↓
Database Query/Update
    ↓
JSON Response
    ↓
Agent processes and acts on state
```

---

## 🎯 Current Implementation Status

### ✅ Complete
- [x] Database schema and migrations
- [x] Drizzle ORM setup
- [x] All API endpoints (5 routes)
- [x] Authorization middleware
- [x] Server actions framework
- [x] UI components structure
- [x] Project & task types

### ⚠️ In Progress / TODO
- [ ] **Phase 1: Critical Issues** (1-2 weeks)
  - [ ] Fix New Project button (project-sidebar.tsx)
  - [ ] Create project creation dialog
  - [ ] Add project detail page (`projects/[id]/page.tsx`)
  - [ ] Wire frontend to database (remove hardcoded data)
  - [ ] Implement project selection navigation

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

## 📝 Development Guidelines

### Code Style
- **TypeScript:** Always use strict mode, no `any`
- **Components:** Use functional components with hooks
- **Naming:** camelCase for variables/functions, PascalCase for components
- **Files:** Use kebab-case (e.g., `task-card.tsx`)
- **Imports:** Use absolute paths with `@/` alias

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

## 🚀 Common Tasks

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

## 📊 Current Issues

### Critical (Blocking)
1. **New Project button shows alert** instead of creating
   - Location: [src/components/project-sidebar.tsx](src/components/project-sidebar.tsx#L47)
   - Fix: Wire to `createProject` action
   - Effort: 2-3 hours

2. **Frontend shows hardcoded sample data**
   - Location: [src/app/page.tsx](src/app/page.tsx#L8-L45)
   - Fix: Call `getProjectTasks` from database
   - Effort: 2-3 hours

3. **Database not initialized**
   - Fix: Run `npm run db:push && psql ... < db/seed-simple.sql`
   - Effort: 5 minutes

### High Priority
4. Project selection doesn't navigate (2 hours)
5. No drag-and-drop on Kanban board (4-5 hours)
6. No error boundaries (2-3 hours)

See [plan.md](plan.md) for complete task list.

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

## 🎯 Success Criteria

**Phase 1 Complete When:**
- [ ] Database initialized and seeded
- [ ] New Project button creates projects
- [ ] Project selection navigates to detail page
- [ ] Kanban board shows real database tasks
- [ ] No hardcoded sample data

**Phase 2 Complete When:**
- [ ] Kanban board has drag-and-drop
- [ ] All form inputs work (create project/task/plan)
- [ ] Task details modal functional
- [ ] Test results can be logged

**MVP Complete When:**
- [ ] Phases 1-3 done
- [ ] Self-hosting on spec-drivr platform
- [ ] Agent can query state and act

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

**Last Updated:** March 4, 2026  
**Status:** Phase 1 implementation in progress  
**Next Task:** See [plan.md](plan.md#phase-1-fix-critical-issues-week-1)

🚀 **Ready to code. Let's build Spec-Drivr!**
