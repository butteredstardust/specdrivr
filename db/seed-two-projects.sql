-- Clear existing data
TRUNCATE TABLE agent_logs, test_results, tasks, plans, specifications, projects RESTART IDENTITY CASCADE;

-- Insert 2 projects
INSERT INTO projects (name, constitution, tech_stack, base_path) VALUES 
('Spec-Drivr Platform', 'An autonomous AI agent development platform using PostgreSQL as a state machine.', '{"runtime": "Node.js 18+", "framework": "Next.js 14", "database": "PostgreSQL 16", "orm": "Drizzle", "language": "TypeScript 5"}', '/Users/tuxgeek/Dev/specdrivr'),
('Test Project Two', 'A secondary test project for demonstrating multi-project support.', '{"test": "value"}', '/test/path');

-- Insert specifications for both projects
INSERT INTO specifications (project_id, content, version) VALUES 
(1, '# Spec-Drivr Specification\n\n## Vision\nAutonomous AI agent development platform using PostgreSQL as state machine.\n\n## Features\n- Project management\n- Kanban boards\n- Agent memory persistence\n- Task tracking', '1.0'),
(2, '# Test Project Two Specification\n\n## Overview\nThis is a test project to demonstrate multi-project functionality.', '1.0');

-- Insert plans for both projects (note: plans references spec_id, not project_id)
INSERT INTO plans (spec_id, architecture_decisions, status) VALUES 
(1, '{"frontend": "Next.js 14 App Router", "backend": "Next.js API Routes", "database": "PostgreSQL with Drizzle ORM"}', 'active'),
(2, '{"test": "architecture"}', 'draft');

-- Insert tasks for Project 1 (Spec-Drivr) - 10 sample tasks across different statuses
-- Note: files_involved is jsonb, so use JSON arrays not PostgreSQL ARRAY syntax
INSERT INTO tasks (plan_id, status, description, files_involved, priority, dependency_task_id) VALUES 
(1, 'done', 'Set up PostgreSQL database schema', '["db/schema.sql"]', 1, NULL),
(1, 'done', 'Implement Drizzle ORM configuration', '["drizzle.config.ts", "db/index.ts"]', 2, 1),
(1, 'done', 'Create project API endpoints', '["src/app/api/agent/mission/route.ts"]', 2, 2),
(1, 'in_progress', 'Add drag-and-drop to Kanban board', '["src/components/kanban-board.tsx", "src/components/task-card.tsx"]', 1, NULL),
(1, 'todo', 'Create task details modal', '["src/components/task-details-modal.tsx"]', 2, NULL),
(1, 'todo', 'Implement task creation form', '["src/components/create-task-dialog.tsx"]', 3, 5),
(1, 'todo', 'Add plan creation form', '["src/components/create-plan-dialog.tsx"]', 3, 6),
(1, 'todo', 'Create specification editor', '["src/components/specification-editor.tsx"]', 2, NULL),
(1, 'blocked', 'Add real-time collaboration', '["src/lib/websocket.ts"]', 5, NULL),
(1, 'todo', 'Add loading states and error boundaries', '["src/components/loading.tsx", "src/components/error-boundary.tsx"]', 3, 8);

-- Insert tasks for Project 2 (Test Project) - 5 sample tasks
INSERT INTO tasks (plan_id, status, description, files_involved, priority, dependency_task_id) VALUES 
(2, 'todo', 'Set up project structure', '["package.json", "tsconfig.json"]', 1, NULL),
(2, 'todo', 'Create unit tests', '["tests/unit/*.test.ts"]', 2, 1),
(2, 'in_progress', 'Implement authentication', '["src/lib/auth.ts", "src/middleware.ts"]', 1, NULL),
(2, 'todo', 'Add documentation', '["README.md", "docs/"]', 3, 1),
(2, 'done', 'Initialize repository', '[".gitignore"]', 1, NULL);
