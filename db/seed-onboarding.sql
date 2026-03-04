-- Onboard Spec-Drivr into itself
-- This creates the project, specification, plan, and tasks for the Spec-Drivr platform we just built

-- Insert Project
INSERT INTO projects (name, constitution, tech_stack, base_path, created_at, updated_at) VALUES (
  'Spec-Drivr',
  '# Spec-Drivr Project Constitution

## Governing Principles
- **Spec-First**: Prohibited from writing feature code without entries in specifications and plans
- **Atomic Commits**: Each task must correspond to a single, testable change
- **Verification Loop**: After every implementation step, execute tests and update test_results
- **Lean Context**: Use SQL queries to retrieve only information required for task_id

## Objective
Build an Autonomous Development Platform operationalizing the "Spec-Driven Development" cycle using PostgreSQL as a structured State Machine. Enable an AI agent (Claude) to execute complex engineering tasks while maintaining lean context window and persistent memory across sessions.

## Key Pillars
- **Relational Memory vs. Context Bloat**: Shift "source of truth" to Postgres tables
- **Spec-Driven Rigor**: Enforce strict causality: Specification → Plan → Tasks → Implementation → Verification
- **Agentic Feedback Loop**: Establish closed loop with test result logging to database
- **Developer-in-the-Loop UI**: Human control via Kanban-style dashboard',
  '{"language": "TypeScript", "framework": "Next.js 14", "database": "PostgreSQL 16", "orm": "Drizzle", "validation": "Zod", "styling": "Tailwind CSS", "components": "Shadcn/UI"}'::jsonb,
  '/Users/tuxgeek/Dev/specdrivr',
  NOW(),
  NOW()
);

-- Insert Specification (from spec.md)
INSERT INTO specifications (project_id, content, version, is_active, created_at) VALUES (
  1,
  '# Spec-Drivr Platform Specification

## What is Spec-Drivr?
An Autonomous Development Platform that operationalizes the "Spec-Driven Development" cycle using PostgreSQL as a structured State Machine to enable AI agents to execute complex engineering tasks while maintaining persistent memory across sessions.

## Core Features

### 1. PostgreSQL as State Machine
- Store projects, specifications, plans, tasks
- Persist test results and agent logs
- Enable multi-session resumes without context loss

### 2. Agentic API Layer
- Context Hydration Protocol (GET /api/agent/mission)
- State Persistence endpoints for plans, tasks, logs
- X-Agent-Token authentication

### 3. Kanban Dashboard UI
- Real-time task tracking
- Drag-and-drop status updates
- Live agent logs viewer
- Test results panel

### 4. Spec-Driven Workflow
**Required sequence:**
1. Create project and constitution
2. Create functional specification (What/Why)
3. Create technical plan (How - folders, APIs, schema)
4. Decompose into atomic tasks
5. Implement → Test → Verify loop
6. Log all activity to agent_logs

### 5. Type Safety & Validation
- TypeScript strict mode
- Drizzle ORM for type-safe DB access
- Zod schemas for runtime validation
- Standardized error handling

## Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: API Routes, Drizzle ORM, Zod validation
- **Database**: PostgreSQL 16+ with Drizzle Kit
- **Development**: Git, Docker, Drizzle Studio

## Success Metrics
- Agent can query mission context from empty DB
- Tasks can be created and updated via API
- Dashboard renders real-time data
- Full workflow cycle tested end-to-end',
  '1.0',
  true,
  NOW()
);

-- Insert Plan
INSERT INTO plans (spec_id, architecture_decisions, status, created_at) VALUES (
  1,
  '{
    "frontend": "Next.js 14 App Router, TypeScript strict mode, Tailwind CSS, Shadcn/UI components",
    "backend": "API Routes in /app/api/agent/, Drizzle ORM for type-safe DB access, Zod runtime validation",
    "database": "PostgreSQL 16, Drizzle Kit for migrations and studio, 6 tables: projects, specifications, plans, tasks, test_results, agent_logs",
    "authentication": "X-Agent-Token header validation using AGENT_TOKEN env variable",
    "component_architecture": "Screaming Architecture with feature-based folder structure",
    "state_management": "Database as source of truth, React Server Components for data fetching",
    "testing": "No external test framework - verification via manual API testing and Drizzle Studio"
  }'::jsonb,
  'active',
  NOW()
);

-- Insert Tasks - Implementation Phase
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id, created_at, updated_at) VALUES
-- Phase 1: Infrastructure (COMPLETE)
(1, 'Initialize Next.js 14 project with TypeScript strict mode', 'done', 1, '["package.json", "tsconfig.json", "next.config.js"]', NULL, NOW(), NOW()),
(1, 'Configure Docker Compose for PostgreSQL 16', 'done', 1, '["docker-compose.yml", ".env.local"]', 1, NOW(), NOW()),
(1, 'Install and configure Drizzle ORM with pg driver', 'done', 1, '["src/db/schema.ts", "src/db/index.ts", "drizzle.config.ts"]', 1, NOW(), NOW()),

-- Phase 2: Database Schema (COMPLETE)
(1, 'Define database schema for all 6 tables', 'done', 1, '["src/db/schema.ts"]', 2, NOW(), NOW()),
(1, 'Create Drizzle client and database connection', 'done', 1, '["src/db/index.ts", ".env.local"]', 3, NOW(), NOW()),
(1, 'Generate and push database migrations', 'done', 1, '["drizzle.config.ts"]', 5, NOW(), NOW()),

-- Phase 3: Agent Memory Utilities (COMPLETE)
(1, 'Create agent-memory.ts helper functions', 'done', 2, '["src/lib/agent-memory.ts"]', 4, NOW(), NOW()),
(1, 'Implement getNextTask() to query available tasks', 'done', 2, '["src/lib/agent-memory.ts"]', 7, NOW(), NOW()),
(1, 'Implement getProjectContext() for mission hydration', 'done', 2, '["src/lib/agent-memory.ts"]', 8, NOW(), NOW()),
(1, 'Implement updateTaskStatus() for task updates', 'done', 2, '["src/lib/agent-memory.ts"]', 7, NOW(), NOW()),
(1, 'Implement logTestResult() for verification logging', 'done', 2, '["src/lib/agent-memory.ts"]', 7, NOW(), NOW()),
(1, 'Implement addAgentLog() for activity tracking', 'done', 2, '["src/lib/agent-memory.ts"]', 7, NOW(), NOW()),

-- Phase 4: API Layer (COMPLETE)
(1, 'Create API authentication middleware', 'done', 2, '["src/lib/auth.ts"]', 6, NOW(), NOW()),
(1, 'Create Zod schemas for API validation', 'done', 2, '["src/lib/schemas.ts"]', 6, NOW(), NOW()),
(1, 'Implement GET /api/agent/mission endpoint', 'done', 2, '["src/app/api/agent/mission/route.ts"]', 13, NOW(), NOW()),
(1, 'Implement POST /api/agent/plans endpoint', 'done', 2, '["src/app/api/agent/plans/route.ts"]', 14, NOW(), NOW()),
(1, 'Implement PATCH /api/agent/tasks/:id endpoint', 'done', 2, '["src/app/api/agent/tasks/[id]/route.ts"]', 14, NOW(), NOW()),
(1, 'Implement POST /api/agent/verify endpoint', 'done', 2, '["src/app/api/agent/verify/route.ts"]', 14, NOW(), NOW()),
(1, 'Implement POST /api/agent/logs endpoint', 'done', 2, '["src/app/api/agent/logs/route.ts"]', 14, NOW(), NOW()),

-- Phase 5: UI Components (COMPLETE)
(1, 'Create TaskCard component', 'done', 3, '["src/components/task-card.tsx"]', 19, NOW(), NOW()),
(1, 'Create KanbanBoard component', 'done', 3, '["src/components/kanban-board.tsx"]', 21, NOW(), NOW()),
(1, 'Create ProjectSidebar component', 'done', 3, '["src/components/project-sidebar.tsx"]', 21, NOW(), NOW()),
(1, 'Create TestResultsPanel component', 'done', 3, '["src/components/test-results-panel.tsx"]', 21, NOW(), NOW()),
(1, 'Create AgentLogs component', 'done', 3, '["src/components/agent-logs.tsx"]', 21, NOW(), NOW()),
(1, 'Create SpecificationViewer component', 'done', 3, '["src/components/specification-viewer.tsx"]', 21, NOW(), NOW()),

-- Phase 6: Server Actions (COMPLETE)
(1, 'Create server actions for UI interactions', 'done', 2, '["src/lib/actions.ts"]', 27, NOW(), NOW()),
(1, 'Update package.json with Drizzle scripts', 'done', 1, '["package.json"]', 27, NOW(), NOW()),

-- Phase 7: Testing & Debugging (COMPLETE)
(1, 'Fix React 19 + Next.js 16 version incompatibility', 'done', 1, '["package.json"]', 28, NOW(), NOW()),
(1, 'Fix Geist font import errors', 'done', 1, '["src/app/layout.tsx"]', 30, NOW(), NOW()),
(1, 'Add "use client" directives to interactive components', 'done', 1, '["src/components/*.tsx"]', 30, NOW(), NOW()),
(1, 'Verify API endpoints with test queries', 'done', 2, '["All API routes"]', 33, NOW(), NOW()),
(1, 'Fix database query errors in agent-memory utilities', 'done', 2, '["src/lib/agent-memory.ts"]', 33, NOW(), NOW()),
(1, 'Test homepage render and Kanban dashboard', 'done', 2, '["src/app/page.tsx"]', 33, NOW(), NOW()),

-- Phase 8: Documentation (COMPLETE)
(1, 'Create comprehensive README.md', 'done', 3, '["README.md"]', 39, NOW(), NOW()),
(1, 'Create API documentation', 'done', 3, '["README.md"]', 40, NOW(), NOW()),
(1, 'Create setup and troubleshooting guides', 'done', 3, '["README.md"]', 40, NOW(), NOW()),

-- Phase 9: Onboarding (IN_PROGRESS)
(1, 'Onboard spec-drivr app into its own platform', 'in_progress', 1, '["db/seed-onboarding.sql"]', 40, NOW(), NOW());

COMMIT;
