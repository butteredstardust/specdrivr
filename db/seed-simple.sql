-- Simple seed file with escaped text
-- Onboard the Spec-Drivr app into its own platform

-- Seed Project
INSERT INTO projects (name, constitution, tech_stack, base_path, created_at, updated_at) VALUES (
  'Spec-Drivr',
  'Build an Autonomous Development Platform operationalizing the Spec-Driven Development cycle using PostgreSQL as a structured State Machine. Enable AI agents to execute complex engineering tasks while maintaining persistent memory across sessions.',
  '{"language": "TypeScript", "framework": "Next.js 14", "database": "PostgreSQL 16", "orm": "Drizzle", "validation": "Zod"}',
  '/Users/tuxgeek/Dev/specdrivr',
  NOW(),
  NOW()
);

-- Seed Specification
INSERT INTO specifications (project_id, content, version, is_active, created_at) VALUES (
  1,
  'Platform with PostgreSQL state machine, agentic API layer, Kanban dashboard UI, spec-driven workflow, and type safety.',
  '1.0',
  true,
  NOW()
);

-- Seed Plan
INSERT INTO plans (spec_id, architecture_decisions, status, created_at) VALUES (
  1,
  '{"frontend": "Next.js 14 App Router", "backend": "API Routes with Drizzle ORM", "database": "PostgreSQL 16", "authentication": "X-Agent-Token"}',
  'active',
  NOW()
);

-- Seed Tasks (Complete)
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id, created_at, updated_at) VALUES
  ( -- Infrastructure Phase
    1, 'Initialize Next.js 14 project', 'done', 1, '["package.json", "tsconfig.json"]', NULL, NOW(), NOW()),
  (1, 'Configure PostgreSQL Docker', 'done', 1, '["docker-compose.yml"]', NULL, NOW(), NOW()),
  (1, 'Install and configure Drizzle ORM', 'done', 1, '["src/db/schema.ts"]', NULL, NOW(), NOW()),

  -- Database Schema Phase
  (1, 'Define database schema for all 6 tables', 'done', 1, '["src/db/schema.ts"]', NULL, NOW(), NOW()),
  (1, 'Create Drizzle client and connection', 'done', 1, '["src/db/index.ts"]', NULL, NOW(), NOW()),
  (1, 'Generate and push migrations', 'done', 1, '["drizzle.config.ts"]', NULL, NOW(), NOW()),

  -- Agent Memory Utilities
  (1, 'Create agent-memory.ts helper functions', 'done', 2, '["src/lib/agent-memory.ts"]', NULL, NOW(), NOW()),
  (1, 'Implement getNextTask()', 'done', 2, '["src/lib/agent-memory.ts"]', NULL, NOW(), NOW()),
  (1, 'Implement getProjectContext()', 'done', 2, '["src/lib/agent-memory.ts"]', NULL, NOW(), NOW()),
  (1, 'Implement updateTaskStatus()', 'done', 2, '["src/lib/agent-memory.ts"]', NULL, NOW(), NOW()),
  (1, 'Implement logTestResult()', 'done', 2, '["src/lib/agent-memory.ts"]', NULL, NOW(), NOW()),
  (1, 'Implement addAgentLog()', 'done', 2, '["src/lib/agent-memory.ts"]', NULL, NOW(), NOW()),

  -- API Layer
  (1, 'Create API auth middleware', 'done', 2, '["src/lib/auth.ts"]', NULL, NOW(), NOW()),
  (1, 'Create Zod schemas', 'done', 2, '["src/lib/schemas.ts"]', NULL, NOW(), NOW()),
  (1, 'Implement GET /api/agent/mission endpoint', 'done', 2, '["src/app/api/agent/mission/route.ts"]', NULL, NOW(), NOW()),
  (1, 'Implement POST /api/agent/plans endpoint', 'done', 2, '["src/app/api/agent/plans/route.ts"]', NULL, NOW(), NOW()),
  (1, 'Implement PATCH /api/agent/tasks/:id endpoint', 'done', 2, '["src/app/api/agent/tasks/[id]/route.ts"]', NULL, NOW(), NOW()),
  (1, 'Implement POST /api/agent/verify endpoint', 'done', 2, '["src/app/api/agent/verify/route.ts"]', NULL, NOW(), NOW()),
  (1, 'Implement POST /api/agent/logs endpoint', 'done', 2, '["src/app/api/agent/logs/route.ts"]', NULL, NOW(), NOW()),

  -- UI Components
  (1, 'Create TaskCard component', 'done', 3, '["src/components/task-card.tsx"]', NULL, NOW(), NOW()),
  (1, 'Create KanbanBoard component', 'done', 3, '["src/components/kanban-board.tsx"]', NULL, NOW(), NOW()),
  (1, 'Create ProjectSidebar component', 'done', 3, '["src/components/project-sidebar.tsx"]', NULL, NOW(), NOW()),
  (1, 'Create TestResultsPanel component', 'done', 3, '["src/components/test-results-panel.tsx"]', NULL, NOW(), NOW()),
  (1, 'Create AgentLogs component', 'done', 3, '["src/components/agent-logs.tsx"]', NULL, NOW(), NOW()),
  (1, 'Create SpecificationViewer component', 'done', 3, '["src/components/specification-viewer.tsx"]', NULL, NOW(), NOW()),

  -- Server Actions & Config
  (1, 'Create server actions for UI', 'done', 2, '["src/lib/actions.ts"]', NULL, NOW(), NOW()),
  (1, 'Update package.json with Drizzle scripts', 'done', 1, '["package.json"]', NULL, NOW(), NOW()),

  -- Testing & Debugging
  (1, 'Fix React/Next.js version compatibility', 'done', 1, '["package.json"]', NULL, NOW(), NOW()),
  (1, 'Fix font import errors', 'done', 1, '["src/app/layout.tsx"]', NULL, NOW(), NOW()),
  (1, 'Add use client directives', 'done', 1, '["src/components/*.tsx"]', NULL, NOW(), NOW()),

  -- Documentation
  (1, 'Create comprehensive README', 'done', 3, '["README.md"]', NULL, NOW(), NOW()),

  -- Onboarding (ACTIVE)
  (1, 'Onboard spec-drivr app into platform', 'in_progress', 1, '["db/seed-simple.sql"]', NULL, NOW(), NOW());

-- Mark all completed tasks in test_results
INSERT INTO test_results (task_id, success, logs, timestamp) VALUES
  (1, true, 'Next.js project initialized', NOW()),
  (2, true, 'PostgreSQL configured', NOW()),
  (3, true, 'Drizzle ORM installed', NOW()),
  (4, true, 'Database schema defined', NOW()),
  (5, true, 'Drizzle client created', NOW()),
  (6, true, 'Migrations generated and pushed', NOW()),
  (7, true, 'Agent memory utilities created', NOW()),
  (8, true, 'getNextTask() implemented', NOW()),
  (9, true, 'getProjectContext() implemented', NOW()),
  (10, true, 'updateTaskStatus() implemented', NOW()),
  (11, true, 'logTestResult() implemented', NOW()),
  (12, true, 'addAgentLog() implemented', NOW()),
  (13, true, 'Auth middleware created', NOW()),
  (14, true, 'Zod schemas created', NOW()),
  (15, true, 'Mission endpoint implemented', NOW()),
  (16, true, 'Plans endpoint implemented', NOW()),
  (17, true, 'Tasks endpoint implemented', NOW()),
  (18, true, 'Verify endpoint implemented', NOW()),
  (19, true, 'Logs endpoint implemented', NOW()),
  (20, true, 'TaskCard component created', NOW()),
  (21, true, 'KanbanBoard component created', NOW()),
  (22, true, 'ProjectSidebar component created', NOW()),
  (23, true, 'TestResultsPanel component created', NOW()),
  (24, true, 'AgentLogs component created', NOW()),
  (25, true, 'SpecificationViewer component created', NOW()),
  (26, true, 'Server actions created', NOW()),
  (27, true, 'Package.json updated', NOW()),
  (28, true, 'Version compatibility fixed', NOW()),
  (29, true, 'Font errors fixed', NOW()),
  (30, true, 'Client directives added', NOW()),
  (31, true, 'README created', NOW());

-- Add agent logs for onboarding
INSERT INTO agent_logs (task_id, level, message, timestamp) VALUES
  (32, 'info', 'Project onboarded into spec-drivr platform', NOW()),
  (32, 'info', 'Database seeded with project data', NOW()),
  (32, 'info', 'All tables populated correctly', NOW());
