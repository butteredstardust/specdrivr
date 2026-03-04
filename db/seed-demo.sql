-- Clear existing data
TRUNCATE TABLE agent_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE test_results RESTART IDENTITY CASCADE;
TRUNCATE TABLE tasks RESTART IDENTITY CASCADE;
TRUNCATE TABLE plans RESTART IDENTITY CASCADE;
TRUNCATE TABLE specifications RESTART IDENTITY CASCADE;
TRUNCATE TABLE projects RESTART IDENTITY CASCADE;

-- ======================================================================== --
-- PROJECT 1: Event Management Platform
-- ======================================================================== --
INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status) VALUES 
('Event Management Platform', 'Build a modern event ticketing platform', 'A full-stack platform for event organizers', 'An autonomous AI agent development platform', '{"frontend": "Next.js 14", "backend": "API Routes"}'::jsonb, '/Users/demo/event-platform', 'idle');

INSERT INTO specifications (project_id, content, version, is_active) VALUES 
(1, '# Event Management Platform

## Overview
Build a comprehensive event management platform.

## Core Features
- Event creation and management
- Real-time seat selection', '1.0', true);

INSERT INTO plans (spec_id, architecture_decisions, status) VALUES 
(1, '{"frontend": "Next.js 14", "backend": "API Routes", "database": "PostgreSQL"}'::jsonb, 'draft');

INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at) VALUES
(1, 'Design database schema', 'done', 1, NULL, ARRAY['db/schema.ts', 'db/migrations.sql'], NOW(), NOW()),
(1, 'Implement seat mapping', 'in_progress', 2, NULL, ARRAY['src/components/seat-map.tsx'], NOW(), NOW()),
(1, 'Create event form', 'todo', 3, NULL, ARRAY['src/components/event-form.tsx'], NOW(), NOW()),
(1, 'Integrate payments', 'todo', 3, 3, ARRAY['src/lib/stripe.ts'], NOW(), NOW());

-- ======================================================================== --
-- PROJECT 2: Smart Home IoT Dashboard
-- ======================================================================== --
INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status) VALUES
('Smart Home IoT Dashboard', 'IoT device management platform', 'Centralized IoT device control', 'An autonomous AI agent development platform', '{"frontend": "React", "backend": "Node.js"}'::jsonb, '/Users/demo/smart-home', 'idle');

INSERT INTO specifications (project_id, content, version, is_active) VALUES
(2, '# Smart Home IoT Dashboard

## Overview
IoT dashboard for smart home management.

## Device Integration
- Smart lights, thermostats
- Security cameras', '1.0', true);

INSERT INTO plans (spec_id, architecture_decisions, status) VALUES
(2, '{"frontend": "React 18", "backend": "Node.js", "iot": "MQTT"}'::jsonb, 'active');

INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at) VALUES
(2, 'Setup MQTT broker', 'done', 1, NULL, ARRAY['src/iot/mqtt-broker.js'], NOW(), NOW()),
(2, 'Device discovery system', 'done', 2, 9, ARRAY['src/lib/device-discovery.ts'], NOW(), NOW()),
(2, 'Build device dashboard', 'in_progress', 1, 10, ARRAY['src/components/device-dashboard.tsx'], NOW(), NOW()),
(2, 'Automation rules engine', 'todo', 2, 11, ARRAY['src/lib/automation-engine.ts'], NOW(), NOW());

-- ======================================================================== --
-- PROJECT 3: AI Code Review Assistant
-- ======================================================================== --
INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status) VALUES
('AI Code Review Assistant', 'AI-powered code review tool', 'Automated code analysis platform', 'An autonomous AI agent development platform', '{"frontend": "Vue.js", "backend": "Python/FastAPI"}'::jsonb, '/Users/demo/code-review-ai', 'idle');

INSERT INTO specifications (project_id, content, version, is_active) VALUES
(3, '# AI Code Review Assistant

## Overview
AI-powered code review assistant.

## Core Capabilities
- Multi-language analysis
- Security scanning
- Performance optimization', '1.0', true);

INSERT INTO plans (spec_id, architecture_decisions, status) VALUES
(3, '{"frontend": "Vue.js 3", "backend": "Python/FastAPI", "ml": "PyTorch"}'::jsonb, 'draft');

INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at) VALUES
(3, 'Research ML models', 'done', 1, NULL, ARRAY['research/codebert-analysis.md'], NOW(), NOW()),
(3, 'Implement Tree-sitter parsers', 'in_progress', 1, 17, ARRAY['src/parsers/javascript-parser.ts'], NOW(), NOW()),
(3, 'Create GitHub integration', 'todo', 2, 18, ARRAY['src/integrations/github-webhook.ts'], NOW(), NOW()),
(3, 'Security scanning rules', 'todo', 1, 19, ARRAY['src/rules/security-scanner.ts'], NOW(), NOW());

-- Add test results
INSERT INTO test_results (task_id, success, logs, timestamp) VALUES
(1, true, 'Database schema created successfully', NOW()),
(9, true, 'MQTT broker responding correctly', NOW()),
(17, true, 'CodeBERT model loaded successfully', NOW());

-- Add agent logs
INSERT INTO agent_logs (task_id, project_id, level, message, context, timestamp) VALUES
(1, 1, 'info', 'Created database schema', '{"tables": 6}', NOW()),
(9, 2, 'info', 'Connected to MQTT broker', '{"broker": "localhost:1883"}', NOW()),
(17, 3, 'debug', 'Training embedding model', '{"model": "CodeBERT"}', NOW());
