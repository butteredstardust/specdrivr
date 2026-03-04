-- Seed file to onboard plan tasks into spec-drivr database
-- This adds all implementation tasks from plan.md

-- Phase 1: Critical Issues (Week 1)
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id, created_at, updated_at) VALUES
(1, 'Set up .env.local with DATABASE_URL', 'todo', 1, '[".env.local"]', NULL, NOW(), NOW()),
(1, 'Run database migrations (npm run db:push)', 'todo', 1, '["drizzle.config.ts"]', 33, NOW(), NOW()),
(1, 'Execute seed-simple.sql to populate data', 'todo', 1, '["db/seed-simple.sql"]', 34, NOW(), NOW()),
(1, 'Fix New Project button - wire up createProject action', 'todo', 1, '["src/components/project-sidebar.tsx"]', 35, NOW(), NOW()),
(1, 'Create create-project-dialog component with Zod validation', 'todo', 1, '["src/components/create-project-dialog.tsx"]', 36, NOW(), NOW()),
(1, 'Add project routing - create projects/[id]/page.tsx', 'todo', 1, '["src/app/projects/[id]/page.tsx"]', 36, NOW(), NOW()),
(1, 'Wire up onProjectSelect handler to navigate to project', 'todo', 1, '["src/components/project-sidebar.tsx"]', 37, NOW(), NOW()),
(1, 'Load real project data in Kanban board instead of sample data', 'todo', 1, '["src/app/projects/[id]/page.tsx", "src/lib/actions.ts"]', 38, NOW(), NOW());

-- Phase 2: Core Interactivity (Week 1-2)
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id, created_at, updated_at) VALUES
(1, 'Add drag-and-drop library to package.json', 'todo', 2, '["package.json"]', 39, NOW(), NOW()),
(1, 'Implement task drag-and-drop in Kanban board', 'todo', 2, '["src/components/kanban-board.tsx"]', 40, NOW(), NOW()),
(1, 'Add optimistic UI updates with rollback on error', 'todo', 2, '["src/components/kanban-board.tsx"]', 41, NOW(), NOW()),
(1, 'Create task details modal component', 'todo', 2, '["src/components/task-details-modal.tsx"]', 39, NOW(), NOW()),
(1, 'Create project detail view page layout', 'todo', 2, '["src/app/projects/[id]/page.tsx"]', 39, NOW(), NOW()),
(1, 'Display project info (name, tech stack, base path)', 'todo', 2, '["src/app/projects/[id]/page.tsx"]', 44, NOW(), NOW()),
(1, 'Render specification content with markdown support', 'todo', 2, '["src/components/specification-viewer.tsx"]', 45, NOW(), NOW()),
(1, 'Display architecture decisions from plan in UI', 'todo', 2, '["src/app/projects/[id]/page.tsx"]', 46, NOW(), NOW()),
(1, 'Add breadcrumb navigation component', 'todo', 2, '["src/components/breadcrumb.tsx"]', 44, NOW(), NOW());

-- Phase 3: Advanced Features (Week 2-3)
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id, created_at, updated_at) VALUES
(1, 'Create plan designer form with architecture JSON editor', 'todo', 2, '["src/components/create-plan-dialog.tsx"]', 48, NOW(), NOW()),
(1, 'Add POST /api/projects/[id]/plans endpoint', 'todo', 2, '["src/app/api/projects/[id]/plans/route.ts"]', 50, NOW(), NOW()),
(1, 'Create task creation form with description, files, priority, deps', 'todo', 2, '["src/components/create-task-dialog.tsx"]', 48, NOW(), NOW()),
(1, 'Add POST /api/tasks endpoint to create new tasks', 'todo', 2, '["src/app/api/tasks/route.ts"]', 52, NOW(), NOW()),
(1, 'Implement test result logging UI with form', 'todo', 2, '["src/components/test-results-panel.tsx", "src/components/log-test-result-dialog.tsx"]', 49, NOW(), NOW()),
(1, 'Display test history for each task', 'todo', 2, '["src/components/test-results-panel.tsx"]', 54, NOW(), NOW()),
(1, 'Show pass/fail badges on task cards', 'todo', 2, '["src/components/task-card.tsx"]', 55, NOW(), NOW()),
(1, 'Build paginated agent logs viewer with search', 'todo', 2, '["src/components/agent-logs.tsx", "src/app/projects/[id]/logs/page.tsx"]', 49, NOW(), NOW()),
(1, 'Add filtering by task and log level', 'todo', 3, '["src/components/agent-logs.tsx"]', 57, NOW(), NOW()),
(1, 'Add JSON export functionality to logs', 'todo', 3, '["src/components/agent-logs.tsx"]', 58, NOW(), NOW());

-- Phase 4: Polish & Optimization (Week 3)
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id, created_at, updated_at) VALUES
(1, 'Implement global error boundary component', 'todo', 3, '["src/app/error.tsx"]', 39, NOW(), NOW()),
(1, 'Add standardized error response format to API', 'todo', 3, '["src/app/api/**"]', 60, NOW(), NOW()),
(1, 'Create reusable form validation components with Zod', 'todo', 3, '["src/components/form-input.tsx", "src/components/form-select.tsx"]', 39, NOW(), NOW()),
(1, 'Create skeleton/loading components', 'todo', 3, '["src/components/skeleton.tsx", "src/components/task-card-skeleton.tsx"]', 62, NOW(), NOW()),
(1, 'Add loading states to all data-fetching pages', 'todo', 3, '["src/app/projects/[id]/page.tsx"]', 63, NOW(), NOW()),
(1, 'Add database indexes on foreign keys', 'todo', 3, '["drizzle.config.ts"]', 35, NOW(), NOW()),
(1, 'Add compound indexes on frequently queried columns', 'todo', 3, '["drizzle.config.ts"]', 65, NOW(), NOW()),
(1, 'Create API endpoint documentation', 'todo', 3, '["docs/API.md"]', 61, NOW(), NOW());

-- Phase 5: Advanced Agent Integration (Future)
INSERT INTO tasks (plan_id, description, status, priority, files_involved, dependency_task_id, created_at, updated_at) VALUES
(1, 'Implement request/response logging for agent communications', 'todo', 4, '["src/app/api/middleware", "src/db/schema.ts"]', 39, NOW(), NOW()),
(1, 'Add request queuing system for agent tasks', 'todo', 4, '["src/lib/task-queue.ts", "src/app/api/agent/queue/route.ts"]', 68, NOW(), NOW()),
(1, 'Implement webhook support for agent callbacks', 'todo', 4, '["src/app/api/webhooks/route.ts"]', 69, NOW(), NOW()),
(1, 'Add specification versioning with diff support', 'todo', 4, '["src/db/schema.ts", "src/components/spec-diff-viewer.tsx"]', 39, NOW(), NOW()),
(1, 'Add plan iteration history tracking', 'todo', 4, '["src/db/schema.ts"]', 71, NOW(), NOW()),
(1, 'Create task template library and quick-create buttons', 'todo', 4, '["src/components/task-templates.tsx"]', 52, NOW(), NOW());
