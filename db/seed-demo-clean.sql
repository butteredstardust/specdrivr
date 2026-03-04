-- Clear all tables
delete from agent_logs cascade;
delete from test_results cascade;
delete from tasks cascade;
delete from plans cascade;
delete from specifications cascade;
delete from projects cascade;

-- Reset sequences
ALTER SEQUENCE projects_id_seq RESTART WITH 1;
ALTER SEQUENCE specifications_id_seq RESTART WITH 1;
ALTER SEQUENCE plans_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;

-- Project 1: Event Management
INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status) VALUES 
('Event Management Platform', 'Build modern event ticketing platform', 'Full-stack event management platform', 'Autonomous AI agent platform', '{"frontend": "Next.js 14", "backend": "API Routes"}'::jsonb, '/Users/demo/event-platform', 'idle');

INSERT INTO specifications (project_id, content, version, is_active) VALUES 
(1, '# Event Management Platform', '1.0', true),
(1, 'Core features: seat selection, payments, QR codes', '1.1', true);

INSERT INTO plans (spec_id, architecture_decisions, status) VALUES 
(1, '{"frontend": "Next.js", "database": "PostgreSQL", "realtime": "Socket.io"}'::jsonb, 'draft');

-- Tasks for Project 1
INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at) VALUES
(1, 'Design database schema for events', 'done', 1, NULL, '{"files": ["db/schema.ts", "db/migrations.sql"]}'::jsonb, NOW(), NOW()),
(1, 'Implement seat mapping component', 'in_progress', 2, NULL, '{"files": ["src/components/seat-map.tsx"]}'::jsonb, NOW(), NOW()),
(1, 'Create event creation form', 'todo', 3, NULL, '{"files": ["src/components/event-form.tsx"]}'::jsonb, NOW(), NOW());

-- Add project-specific test results
INSERT INTO test_results (task_id, success, logs, timestamp) VALUES
(1, true, 'Database schema validated', NOW()),
(1, true, 'Tables created: events, venues, tickets', NOW());

INSERT INTO agent_logs (task_id, project_id, level, message, context, timestamp) VALUES
(1, 1, 'info', 'Database schema created', '{"tables": 3}', NOW()),
(2, 1, 'debug', 'Analyzing seat layout requirements', '{"algorithm": "bin-packing"}', NOW());

-- Project 2: IoT Dashboard
INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status) VALUES 
('Smart Home IoT Dashboard', 'IoT device management system', 'Centralized IoT device control', 'Autonomous AI agent platform', '{"frontend": "React", "backend": "Node.js"}'::jsonb, '/Users/demo/smart-home', 'idle');

INSERT INTO specifications (project_id, content, version, is_active) VALUES 
(2, '# Smart Home IoT Dashboard', '1.0', true),
(2, 'Features: MQTT, WebSockets, analytics', '1.1', true);

INSERT INTO plans (spec_id, architecture_decisions, status) VALUES 
(2, '{"frontend": "React", "iot": "MQTT", "database": "PostgreSQL"}'::jsonb, 'active');

INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at) VALUES
(2, 'Setup MQTT broker and device simulator', 'done', 1, NULL, '{"files": ["src/iot/mqtt-broker.js", "src/simulator/device-simulator.ts"]}'::jsonb, NOW(), NOW()),
(2, 'Create device discovery and registration', 'done', 2, 9, '{"files": ["src/lib/device-discovery.ts"]}'::jsonb, NOW(), NOW()),
(2, 'Build real-time device status dashboard', 'in_progress', 1, 10, '{"files": ["src/components/device-dashboard.tsx"]}'::jsonb, NOW(), NOW()),
(2, 'Implement automation rules engine', 'todo', 2, 11, '{"files": ["src/lib/automation-engine.ts"]}'::jsonb, NOW(), NOW());

-- Project 3: AI Code Review
INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status) VALUES 
('AI Code Review Assistant', 'AI-powered code review tool', 'Automated code analysis platform', 'Autonomous AI agent platform', '{"frontend": "Vue.js", "backend": "Python/FastAPI"}'::jsonb, '/Users/demo/code-review-ai', 'idle');

INSERT INTO specifications (project_id, content, version, is_active) VALUES 
(3, '# AI Code Review Assistant', '1.0', true),
(3, 'Capabilities: multi-language, security, performance', '1.1', true);

INSERT INTO plans (spec_id, architecture_decisions, status) VALUES 
(3, '{"frontend": "Vue.js", "ml": "PyTorch", "parsing": "Tree-sitter"}'::jsonb, 'draft');

INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at) VALUES
(3, 'Research and select appropriate ML model for code analysis', 'done', 1, NULL, '{"files": ["research/codebert-analysis.md"]}'::jsonb, NOW(), NOW()),
(3, 'Implement Tree-sitter parsers for target languages', 'in_progress', 1, 29, '{"files": ["src/parsers/javascript-parser.ts", "src/parsers/python-parser.ts"]}'::jsonb, NOW(), NOW()),
(3, 'Create GitHub webhook integration service', 'todo', 2, 30, '{"files": ["src/integrations/github-webhook.ts"]}'::jsonb, NOW(), NOW()),
(3, 'Build security vulnerability detection rules', 'todo', 1, 31, '{"files": ["src/rules/security-scanner.ts"]}'::jsonb, NOW(), NOW());
