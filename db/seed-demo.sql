-- ============================================================================
-- COMPREHENSIVE SEED FILE: Users + 4 Complete Demo Projects
-- Password for all users: demo
-- Bcrypt hash (10 salt rounds): $2b$10$mLoZVx06uun0YyLlrf82I.y15n8ogOyirqeI/hQVP6BwcHLNHuf62
-- ============================================================================

-- Clear all existing data
TRUNCATE TABLE agent_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE test_results RESTART IDENTITY CASCADE;
TRUNCATE TABLE tasks RESTART IDENTITY CASCADE;
TRUNCATE TABLE plans RESTART IDENTITY CASCADE;
TRUNCATE TABLE specifications RESTART IDENTITY CASCADE;
TRUNCATE TABLE projects RESTART IDENTITY CASCADE;
TRUNCATE TABLE git_commits RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE projects_id_seq RESTART WITH 1;
ALTER SEQUENCE specifications_id_seq RESTART WITH 1;
ALTER SEQUENCE plans_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;

-- ============================================================================
-- USERS: 4 Test Users with Password "demo"
-- ============================================================================
INSERT INTO users (username, password_hash, avatar_id, avatar_url, is_active, is_admin, role, created_at, updated_at) VALUES
('Admin', '$2b$10$mLoZVx06uun0YyLlrf82I.y15n8ogOyirqeI/hQVP6BwcHLNHuf62', 1, NULL, true, true, 'admin', NOW(), NOW()),
('John', '$2b$10$mLoZVx06uun0YyLlrf82I.y15n8ogOyirqeI/hQVP6BwcHLNHuf62', 2, NULL, true, false, 'developer', NOW(), NOW()),
('Amy', '$2b$10$mLoZVx06uun0YyLlrf82I.y15n8ogOyirqeI/hQVP6BwcHLNHuf62', 3, NULL, true, false, 'developer', NOW(), NOW()),
('Brett', '$2b$10$mLoZVx06uun0YyLlrf82I.y15n8ogOyirqeI/hQVP6BwcHLNHuf62', 4, NULL, true, false, 'viewer', NOW(), NOW());

-- ============================================================================
-- PROJECT 1: Event Management Platform (owned by Admin)
-- ============================================================================
INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status, status, created_by_user_id, created_at, updated_at) VALUES
('Event Management Platform', 'Build a modern event ticketing platform', 'A full-stack platform for event organizers', '# Event Management Platform\n\n## Mission\nBuild an autonomous platform for managing events with intelligent seat selection and real-time analytics.\n\n## Core Values\n- Enhance community engagement through seamless event experiences\n- Deliver real-time insights and automation\n- Maintain security and reliability at scale', '{"frontend": "Next.js 14", "backend": "API Routes", "database": "PostgreSQL 16", "realtime": "WebSockets", "payments": "Stripe", "auth": "NextAuth.js"}'::jsonb, '/Users/demo/event-platform', 'idle', 'active', 1, NOW(), NOW());

INSERT INTO specifications (project_id, content, version, is_active, created_by_user_id, created_at) VALUES
(1, '# Event Management Platform - Specification\n\n## Overview\nA comprehensive platform for event organizers to manage events, tickets, and attendees with real-time seat selection and dynamic pricing.\n\n## Core Features\n- **Event Creation & Management**: Multi-tier event creation workflow\n- **Real-time Seat Selection**: Interactive venue maps with live availability\n- **Dynamic Pricing**: AI-driven pricing based on demand and timing\n- **Payment Processing**: Secure checkout with Stripe integration\n- **QR Code Ticketing**: Mobile-first ticket delivery and verification\n- **Analytics Dashboard**: Real-time event performance metrics\n- **Email Notifications**: Automated confirmation and reminder emails\n- **Waitlist Management**: Smart waitlist with automatic upgrades\n\n## Technical Architecture\n- Next.js 14 App Router for optimal performance\n- PostgreSQL with Drizzle ORM for type-safe queries\n- WebSockets for real-time seat updates\n- Stripe for payment processing\n- AWS S3 for image storage\n- SendGrid for email delivery\n\n## Target Audience\n- Event organizers managing 10-1000 attendee events\n- Venues requiring seat mapping capabilities\n- Organizations needing branded ticketing experiences', '1.0', true, 1, NOW());

INSERT INTO specifications (project_id, content, version, is_active, created_by_user_id, created_at) VALUES
(1, '## v1.1 Update: Enhanced Security\n\n### New Features\n- Two-factor authentication for organizer accounts\n- Rate limiting on ticket purchases\n- Fraud detection with ML model\n- GDPR compliance data export tools\n\n### Improvements\n- 40% faster seat selection algorithm\n- Reduced payment processing time\n- Enhanced mobile responsiveness', '1.1', true, 1, NOW());

INSERT INTO plans (spec_id, architecture_decisions, status, created_by_user_id, created_at) VALUES
(1, '{"frontend": {"framework": "Next.js 14", "styling": "Tailwind CSS", "components": "shadcn/ui"}, "backend": {"runtime": "Node.js", "database": "PostgreSQL 16", "orm": "Drizzle", "api": "Next.js API Routes"}, "realtime": {"technology": "Socket.io", "fallback": "Server-Sent Events"}, "payments": {"provider": "Stripe", "webhooks": "Stripe Webhook API"}, "authentication": {"primary": "NextAuth.js", "providers": ["GitHub", "Google"]}}'::jsonb, 'active', 1, NOW());

INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_by_user_id, created_at, updated_at) VALUES
(1, 'Design and implement venue seat mapping database schema', 'done', 1, NULL, '{"files": ["db/schema.ts", "db/migrations/001_venues.sql"]}'::jsonb, 1, NOW(), NOW()),
(1, 'Create interactive seat selection React component with real-time updates', 'done', 1, 1, '{"files": ["src/components/seat-map/SeatSelector.tsx", "src/components/seat-map/Seat.tsx"]}'::jsonb, 1, NOW(), NOW()),
(1, 'Integrate Stripe payment processing with webhook handling', 'in_progress', 1, 2, '{"files": ["src/app/api/webhooks/stripe.ts", "src/lib/stripe.ts", "src/components/checkout/CheckoutForm.tsx"]}'::jsonb, 1, NOW(), NOW()),
(1, 'Implement QR code generation and scanning for ticket verification', 'todo', 2, 3, '{"files": ["src/lib/qr-generator.ts", "src/app/api/verify-ticket/route.ts", "src/components/QRScanner.tsx"]}'::jsonb, 1, NOW(), NOW()),
(1, 'Build analytics dashboard with event performance metrics', 'todo', 2, 3, '{"files": ["src/components/analytics/AnalyticsDashboard.tsx", "src/app/api/analytics/events.ts"]}'::jsonb, 1, NOW(), NOW()),
(1, 'Create email notification system with SendGrid integration', 'in_progress', 3, 4, '{"files": ["src/lib/email.ts", "src/app/api/webhooks/email.ts", "src/templates/emails/"]}'::jsonb, 1, NOW(), NOW()),
(1, 'Implement waitlist management with automated upgrade system', 'todo', 2, 5, '{"files": ["src/lib/waitlist.ts", "src/components/waitlist/WaitlistManager.tsx"]}'::jsonb, 1, NOW(), NOW()),
(1, 'Setup CI/CD pipeline with automated testing and deployment', 'blocked', 1, NULL, '{"files": [".github/workflows/deploy.yml", "tests/e2e/ticket-purchase.spec.ts"]}'::jsonb, 1, NOW(), NOW());

-- Test results for Project 1
INSERT INTO test_results (task_id, success, logs, created_by_user_id, timestamp) VALUES
(1, true, 'Venue seat mapping schema created successfully with proper indexes', 1, NOW()),
(1, true, 'Database migrations applied without errors', 1, NOW()),
(2, true, 'Seat selection component renders without errors', 1, NOW()),
(2, true, 'Real-time updates functional via WebSockets', 1, NOW()),
(3, false, 'Stripe webhook endpoint fails with invalid signature error', 1, NOW()),
(8, false, 'CI/CD pipeline blocked by missing environment variables', 1, NOW());

-- Agent logs for Project 1
INSERT INTO agent_logs (task_id, project_id, level, message, context, timestamp) VALUES
(1, 1, 'info', 'Starting database schema design for venue mapping', '{"task": "seat-mapping-schema", "complexity": "high"}'::jsonb, NOW()),
(1, 1, 'debug', 'Created tables: venues, seats, seat_categories, seat_status', '{"tables_created": 4, "relationships": 6}'::jsonb, NOW()),
(1, 1, 'info', 'Database schema completed successfully', '{"execution_time_ms": 245}'::jsonb, NOW()),
(2, 1, 'info', 'Building interactive seat selection component', '{"framework": "React", "realtime": "WebSockets"}'::jsonb, NOW()),
(2, 1, 'debug', 'Implemented drag-and-drop seat selection with hover states', '{"components": 3, "api_calls": 2}'::jsonb, NOW()),
(3, 1, 'warn', 'Stripe webhook signature verification failed', '{"error": "missing_webhook_secret", "action_required": "Add STRIPE_WEBHOOK_SECRET to .env"}'::jsonb, NOW()),
(6, 1, 'info', 'Email notification system initialized', '{"provider": "SendGrid", "templates_created": 5}'::jsonb, NOW()),
(8, 1, 'error', 'CI/CD pipeline deployment failed', '{"error": "missing_env", "variables": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]}'::jsonb, NOW());

-- ============================================================================
-- PROJECT 2: Smart Home IoT Dashboard (owned by John)
-- ============================================================================
INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status, status, created_by_user_id, created_at, updated_at) VALUES
('Smart Home IoT Dashboard', 'Centralized IoT device management and automation', 'Real-time dashboard for monitoring and controlling smart home devices with automation rules', '# Smart Home IoT Dashboard\n\n## Mission\nCreate an intelligent home automation platform that learns from user behavior and optimizes energy consumption.\n\n## Core Principles\n- Seamless device integration across multiple protocols\n- Real-time monitoring with actionable insights\n- Privacy-first data processing\n- Energy efficiency optimization\n\n## Automation Philosophy\n- Machine learning models for pattern recognition\n- Predictive automation based on user habits\n- Fallback manual controls for reliability\n\n## Security Standards\n- End-to-end encryption for device communication\n- Zero-trust architecture\n- Regular security audits and updates', '{"frontend": "React 18", "backend": "Node.js", "iot": "MQTT", "database": "PostgreSQL", "cache": "Redis", "ml": "TensorFlow.js"}'::jsonb, '/Users/demo/smart-home', 'idle', 'active', 2, NOW(), NOW());

INSERT INTO specifications (project_id, content, version, is_active, created_by_user_id, created_at) VALUES
(2, '# Smart Home IoT Dashboard - Specification\n\n## Overview\nA centralized platform for managing IoT devices, creating automation rules, and monitoring home energy consumption in real-time.\n\n## Supported Devices\n- Smart Lights (Philips Hue, LIFX)\n- Thermostats (Nest, Ecobee)\n- Security Cameras (Ring, Arlo)\n- Smart Plugs (TP-Link Kasa)\n- Door Locks (August, Yale)\n- Sensors (motion, temperature, humidity)\n\n## Core Features\n- **Device Discovery**: Automatic detection of compatible devices on local network\n- **Real-Time Dashboard**: WebSocket-based live updates of device states\n- **Automation Engine**: Rule-based automation with time, sensor, and device triggers\n- **Energy Analytics**: Historical and real-time energy consumption tracking\n- **Voice Control**: Integration with Alexa and Google Assistant\n- **Mobile App**: React Native companion app for remote access\n- **Scenes**: Pre-configured device setting combinations\n\n## Technical Architecture\n- MQTT broker for device communication\n- PostgreSQL for configuration storage\n- TimescaleDB for time-series sensor data\n- Redis for caching and rate limiting\n- TensorFlow.js for ML models\n- Docker containers for easy deployment', '1.0', true, 2, NOW());

INSERT INTO plans (spec_id, architecture_decisions, status, created_by_user_id, created_at) VALUES
(2, '{"communication": {"protocol": "MQTT", "broker": "Mosquitto", "qos": 2}, "database": {"primary": "PostgreSQL", "timeseries": "TimescaleDB", "cache": "Redis"}, "frontend": {"framework": "React 18", "styling": "Material-UI", "charts": "Chart.js"}, "backend": {"runtime": "Node.js", "framework": "Express", "api": "REST"}, "deployment": {"container": "Docker", "orchestration": "Docker Compose"}}'::jsonb, 'active', 2, NOW());

INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_by_user_id, created_at, updated_at) VALUES
(2, 'Setup MQTT broker with TLS encryption and authentication', 'done', 1, NULL, '{"files": ["docker-compose.yml", "mosquitto/config/mosquitto.conf", "src/lib/mqtt.ts"]}'::jsonb, 2, NOW(), NOW()),
(2, 'Create device discovery service for automatic device detection', 'done', 2, 9, '{"files": ["src/services/device-discovery.ts", "src/lib/network-scanner.ts"]}'::jsonb, 2, NOW(), NOW()),
(2, 'Build real-time dashboard with WebSocket integration', 'in_progress', 1, 10, '{"files": ["src/components/dashboard/DeviceGrid.tsx", "src/hooks/useWebSocket.ts"]}'::jsonb, 2, NOW(), NOW()),
(2, 'Implement automation rules engine with time-based triggers', 'todo', 1, 11, '{"files": ["src/lib/automation-engine.ts", "src/types/automation.ts"]}'::jsonb, 2, NOW(), NOW()),
(2, 'Create energy analytics dashboard with consumption charts', 'todo', 2, 11, '{"files": ["src/components/analytics/EnergyCharts.tsx", "src/lib/energy-calc.ts"]}'::jsonb, 2, NOW(), NOW()),
(2, 'Integrate voice control with Alexa Skills Kit', 'todo', 3, 12, '{"files": ["src/integrations/alexa.ts", "lambda/alexa-handler.js"]}'::jsonb, 2, NOW(), NOW());

-- Test results for Project 2
INSERT INTO test_results (task_id, success, logs, created_by_user_id, timestamp) VALUES
(9, true, 'MQTT broker responding correctly with TLS enabled', 2, NOW()),
(10, true, 'Device discovery found 8 devices on network', 2, NOW()),
(10, true, 'Device metadata parsed correctly for all device types', 2, NOW()),
(12, false, 'Dashboard WebSocket connection fails intermittently', 2, NOW());

-- Agent logs for Project 2
INSERT INTO agent_logs (task_id, project_id, level, message, context, timestamp) VALUES
(9, 2, 'info', 'Starting MQTT broker configuration', '{"protocol": "MQTT", "encryption": "TLS", "port": 8883}'::jsonb, NOW()),
(9, 2, 'debug', 'Generated TLS certificates with Lets Encrypt', '{"cert_path": "/etc/mosquitto/certs"}'::jsonb, NOW()),
(9, 2, 'info', 'MQTT broker running with authentication enabled', '{"clients_connected": 3, "topics": 12}'::jsonb, NOW()),
(10, 2, 'info', 'Scanning network for IoT devices', '{"ip_range": "192.168.1.0/24", "timeout": 5000}'::jsonb, NOW()),
(10, 2, 'debug', 'Discovered devices: 5 lights, 2 thermostats, 1 camera', '{"devices": 8, "types": ["light", "thermostat", "camera"]}'::jsonb, NOW()),
(12, 2, 'warn', 'WebSocket connection unstable', '{"error": "connection_dropped", "retry_count": 3}'::jsonb, NOW()),
(12, 2, 'info', 'Implemented connection retry logic with exponential backoff', '{"max_retries": 5, "backoff_ms": 1000}'::jsonb, NOW());

-- ============================================================================
-- PROJECT 3: AI Code Review Assistant (owned by Amy)
-- ============================================================================
INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status, status, created_by_user_id, created_at, updated_at) VALUES
('AI Code Review Assistant', 'AI-powered code review and security analysis', 'Automated code analysis platform for detecting bugs, security vulnerabilities, and performance issues', '# AI Code Review Assistant\n\n## Mission\nEmpower development teams to ship secure, high-quality code through intelligent automated code review.\n\n## Analysis Philosophy\n- Multi-language support with deep language understanding\n- Security-first approach with OWASP integration\n- Performance optimization suggestions\n- Educational feedback for developers\n\n## Machine Learning Approach\n- CodeBERT for semantic code understanding\n- Graph neural networks for control flow analysis\n- Transfer learning from open source repositories\n\n## Quality Metrics\n- Precision: Minimize false positives\n- Coverage: Analyze all code paths\n- Performance: Sub-5 second analysis time\n- Actionability: Provide fix suggestions', '{"frontend": "Vue.js 3", "backend": "Python/FastAPI", "ml": "PyTorch", "parsing": "Tree-sitter", "database": "PostgreSQL", "deployment": "Docker"}'::jsonb, '/Users/demo/code-review-ai', 'idle', 'active', 3, NOW(), NOW());

INSERT INTO specifications (project_id, content, version, is_active, created_by_user_id, created_at) VALUES
(3, '# AI Code Review Assistant - Specification\n\n## Overview\nAn AI-powered code review platform that automatically analyzes code changes for bugs, security vulnerabilities, performance issues, and code quality concerns.\n\n## Core Capabilities\n- **Multi-Language Analysis**: JavaScript, TypeScript, Python, Go, Java, Rust\n- **Security Scanning**: OWASP Top 10, CWE detection, dependency vulnerabilities\n- **Performance Analysis**: Algorithm complexity, memory leaks, inefficient patterns\n- **Code Quality**: Code style, complexity metrics, duplication detection\n- **Pull Request Integration**: GitHub, GitLab, Bitbucket webhooks\n- **CI/CD Integration**: GitHub Actions, Jenkins, CircleCI plugins\n- **Custom Rules**: Organization-specific rule engine\n- **IDE Integration**: VS Code, IntelliJ extensions\n\n## Supported Vulnerability Types\n- SQL Injection\n- Cross-Site Scripting (XSS)\n- Remote Code Execution\n- Authentication Bypass\n- Insecure Deserialization\n- Cryptographic Weaknesses\n\n## Machine Learning Models\n- CodeBERT for semantic understanding\n- GraphCodeBERT for control flow analysis\n- Custom models for vulnerability detection\n\n## Technical Stack\n- Vue.js 3 for frontend dashboard\n- Python/FastAPI for analysis service\n- PyTorch for ML model training\n- Tree-sitter for code parsing\n- PostgreSQL for result storage\n- Redis for job queuing\n- Docker for containerization', '1.0', true, 3, NOW());

INSERT INTO plans (spec_id, architecture_decisions, status, created_by_user_id, created_at) VALUES
(3, '{"frontend": {"framework": "Vue.js 3", "build_tool": "Vite", "state_management": "Pinia"}, "analysis_service": {"runtime": "Python 3.11", "framework": "FastAPI", "ml_framework": "PyTorch"}, "parsing": {"parser": "Tree-sitter", "languages": ["javascript", "typescript", "python", "go"]}, "database": {"primary": "PostgreSQL", "queue": "Redis", "vector": "Pinecone"}, "deployment": {"containerization": "Docker", "orchestration": "Kubernetes"}}'::jsonb, 'active', 3, NOW());

INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_by_user_id, created_at, updated_at) VALUES
(3, 'Research and select appropriate ML model for code analysis', 'done', 1, NULL, '{"files": ["research/ml-models.md", "notebooks/model-comparison.ipynb"]}'::jsonb, 3, NOW(), NOW()),
(3, 'Implement Tree-sitter parsers for JavaScript, TypeScript, and Python', 'in_progress', 1, 23, '{"files": ["src/parsers/javascript-parser.ts", "src/parsers/typescript-parser.ts", "src/parsers/python-parser.ts"]}'::jsonb, 3, NOW(), NOW()),
(3, 'Train CodeBERT model on open source repositories dataset', 'done', 1, 24, '{"files": ["training/train.py", "training/dataset.py", "models/codebert.pt"]}'::jsonb, 3, NOW(), NOW()),
(3, 'Create GitHub webhook integration service for pull request analysis', 'todo', 2, 25, '{"files": ["src/integrations/github-webhook.ts", "src/webhook/handler.py"]}'::jsonb, 3, NOW(), NOW()),
(3, 'Build security rules engine for OWASP Top 10 detection', 'todo', 1, 26, '{"files": ["src/rules/security-scanner.ts", "src/rules/owasp-rules.json"]}'::jsonb, 3, NOW(), NOW()),
(3, 'Design and implement code analysis job queue with Redis', 'in_progress', 2, 24, '{"files": ["src/queue/analyzer.ts", "docker-compose.redis.yml"]}'::jsonb, 3, NOW(), NOW()),
(3, 'Create Vue.js dashboard for analysis results visualization', 'todo', 2, 26, '{"files": ["src/dashboard/AnalysisResults.vue", "src/components/VulnerabilityCard.vue"]}'::jsonb, 3, NOW(), NOW());

-- Test results for Project 3
INSERT INTO test_results (task_id, success, logs, created_by_user_id, timestamp) VALUES
(23, true, 'CodeBERT model loaded successfully', 3, NOW()),
(24, true, 'JavaScript parser correctly identified 50 code patterns', 3, NOW()),
(24, true, 'TypeScript parser handled generics and interfaces correctly', 3, NOW()),
(27, false, 'Security scanner false positive rate too high at 15%', 3, NOW()),
(28, true, 'Redis queue successfully processed 1000 analysis jobs', 3, NOW());

-- Agent logs for Project 3
INSERT INTO agent_logs (task_id, project_id, level, message, context, timestamp) VALUES
(23, 3, 'info', 'Loading CodeBERT model for code analysis', '{"model": "CodeBERT", "parameters": "110M", "device": "cuda"}'::jsonb, NOW()),
(23, 3, 'debug', 'Model loaded successfully', '{"loading_time_ms": 3245, "memory_mb": 512}'::jsonb, NOW()),
(24, 3, 'info', 'Initializing Tree-sitter parser for JavaScript', '{"parser": "tree-sitter-javascript", "version": "0.19.0"}'::jsonb, NOW()),
(24, 3, 'debug', 'Parser syntax tree generated correctly', '{"nodes": 1245, "depth": 12}'::jsonb, NOW()),
(25, 3, 'info', 'Training model on dataset', '{"dataset_size": 100000, "epochs": 10}'::jsonb, NOW()),
(25, 3, 'debug', 'Training complete', '{"final_accuracy": 0.94, "training_time_hours": 2.3}'::jsonb, NOW()),
(27, 3, 'warn', 'Security scanner false positives above threshold', '{"false_positive_rate": 0.15, "target": 0.05}'::jsonb, NOW()),
(27, 3, 'info', 'Tuning detection thresholds', '{"adjustment": "increase_confidence_threshold", "new_threshold": 0.85}'::jsonb, NOW()),
(28, 3, 'info', 'Redis queue connected', '{"connected": true, "pending_jobs": 42}'::jsonb, NOW());

-- ============================================================================
-- PROJECT 4: Personal Task Manager (owned by Brett)
-- ============================================================================
INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status, status, created_by_user_id, created_at, updated_at) VALUES
('Personal Task Manager', 'Simple and elegant task management for individuals', 'A lightweight task management application focused on simplicity and speed', '# Personal Task Manager\n\n## Mission\nCreate the simplest and fastest way to manage daily tasks without feature bloat.\n\n## Design Philosophy\n- Minimalist interface\n- Keyboard-first navigation\n- Instant response time\n- No learning curve\n\n## Core Features\n- Task creation in one keystroke\n- Nested subtasks\n- Due date reminders\n- Task prioritization\n- Search and filter', '{"frontend": "Vanilla JS", "backend": "Go", "database": "SQLite", "hosting": "Vercel"}'::jsonb, '/Users/demo/task-manager', 'idle', 'active', 4, NOW(), NOW());

INSERT INTO specifications (project_id, content, version, is_active, created_by_user_id, created_at) VALUES
(4, '# Personal Task Manager - Specification\n\n## Overview\nA minimalist task management application designed for individual users who want to organize their daily tasks without complex features or enterprise functionality.\n\n## Design Principles\n1. **Simplicity**: Clean, distraction-free interface\n2. **Speed**: All operations complete in under 100ms\n3. **Keyboard Navigation**: 100% keyboard operable\n4. **No Registration**: Works without user accounts\n5. **Offline Mode**: Full functionality without internet\n\n## Core Features\n- **Quick Task Creation**: Type and press Enter\n- **Subtasks**: Nested task hierarchy with collapse/expand\n- **Priorities**: 3 levels (High, Medium, Low) with visual indicators\n- **Due Dates**: Natural language parsing ("tomorrow", "next Friday")\n- **Search**: Instant search with fuzzy matching\n- **Filters**: By status, priority, due date\n- **Keyboard Shortcuts**: Complete keyboard control\n- **Data Export**: JSON and CSV export\n\n## Technical Stack\n- Frontend: Vanilla JavaScript (no framework)\n- Backend: Go with Gin framework\n- Database: SQLite for simplicity\n- Hosting: Vercel (frontend) + Supabase (backend)', '1.0', true, 4, NOW());

INSERT INTO plans (spec_id, architecture_decisions, status, created_by_user_id, created_at) VALUES
(4, '{"frontend": {"technology": "Vanilla JavaScript", "bundler": "Vite", "css": "Tailwind CSS"}, "backend": {"language": "Go", "framework": "Gin", "database": "SQLite"}, "deployment": {"frontend": "Vercel", "backend": "Supabase"}}'::jsonb, 'draft', 4, NOW());

INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_by_user_id, created_at, updated_at) VALUES
(4, 'Create Go backend with CRUD endpoints for tasks', 'in_progress', 1, NULL, '{"files": ["main.go", "handlers/task.go", "database/db.go"]}'::jsonb, 4, NOW(), NOW()),
(4, 'Build frontend UI with task list and creation form', 'todo', 1, 29, '{"files": ["index.html", "css/style.css", "js/app.js"]}'::jsonb, 4, NOW(), NOW()),
(4, 'Implement keyboard shortcuts for all operations', 'todo', 2, 30, '{"files": ["js/keyboard.js", "js/shortcuts.js"]}'::jsonb, 4, NOW(), NOW());

-- Test results for Project 4
INSERT INTO test_results (task_id, success, logs, created_by_user_id, timestamp) VALUES
(22, true, 'Go server running on port 8080', 4, NOW()),
(22, true, 'CRUD endpoints tested with 100% success rate', 4, NOW());

-- Agent logs for Project 4
INSERT INTO agent_logs (task_id, project_id, level, message, context, timestamp) VALUES
(22, 4, 'info', 'Starting Go backend server', '{"port": 8080, "framework": "Gin"}'::jsonb, NOW()),
(22, 4, 'debug', 'Database connection successful', '{"driver": "sqlite3", "path": "tasks.db"}'::jsonb, NOW()),
(22, 4, 'info', 'CRUD endpoints implemented', '{"endpoints": 4, "routes": ["/tasks", "/tasks/:id"]}'::jsonb, NOW()),
(23, 4, 'info', 'Building vanilla JavaScript frontend', '{"bundler": "Vite", "features": ["keyboard", "search", "filters"]}'::jsonb, NOW());

