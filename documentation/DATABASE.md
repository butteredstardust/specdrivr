# Database Schema Documentation

## Overview

Specdrivr uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema supports AI agent orchestration, project management, specifications, plans, tasks, git integration, audit logging, and usage tracking.

**Package Manager:** All database commands use `pnpm` (not npm)

```bash
pnpm db:generate  # Generate migration files
pnpm db:push     # Push schema changes to database
pnpm db:migrate  # Apply pending migrations
pnpm db:studio   # Open Drizzle Studio GUI
pnpm db:seed     # Seed database with test data
```

## Database Enums

### `agent_status`
Status of agent sessions: `idle`, `running`, `paused`, `stopped`, `error`

### `log_level`
Logging levels: `debug`, `info`, `warn`, `error`

### `plan_status`
Plan lifecycle: `draft`, `active`, `completed`, `archived`, `pending_approval`

### `project_status`
Project states: `active`, `archived`

### `spec_status`
Specification states: `draft`, `active`, `completed`, `stalled`

### `task_status`
Task workflow: `todo`, `in_progress`, `done`, `blocked`, `paused`, `skipped`

### `user_role`
User permissions: `admin`, `developer`, `viewer`

## Core Tables

### `projects`
Main project container for all work.

```sql
id: serial PRIMARY KEY
name: text NOT NULL
slug: text NOT NULL UNIQUE
avatar_color: text
is_demo: boolean DEFAULT false
mission: text
description: text
constitution: text
tech_stack: jsonb
base_path: text
git_branch: text DEFAULT 'main'
git_strategy: text
agent_last_heartbeat_at: timestamp with time zone
state: jsonb
git_config: jsonb
status: project_status DEFAULT 'active'
created_by_user_id: integer
created_at: timestamp with time zone DEFAULT now()
updated_at: timestamp with time zone DEFAULT now()
```

**Indexes:**
- `project_slug_idx` (unique) on slug

### `specifications`
User-written specifications that drive plan generation.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
content: text NOT NULL
version: text DEFAULT '1.0'
status: spec_status DEFAULT 'draft'
is_active: boolean DEFAULT true
created_by_user_id: integer
created_at: timestamp with time zone DEFAULT now()
updated_at: timestamp with time zone DEFAULT now()
```

### `plans`
AI-generated execution plans containing multiple tasks.

```sql
id: serial PRIMARY KEY
spec_id: integer NOT NULL REFERENCES specifications(id) ON DELETE CASCADE
architecture_decisions: jsonb
intent: text
phase_label: text
status: plan_status DEFAULT 'draft'
generation_duration_ms: integer
generation_error: text
model_version: text
task_count: integer DEFAULT 0
total_estimated_minutes: integer
created_by_user_id: integer
created_at: timestamp with time zone DEFAULT now()
```

### `tasks`
Individual work items within a plan.

```sql
id: serial PRIMARY KEY
plan_id: integer REFERENCES plans(id) ON DELETE CASCADE
status: task_status DEFAULT 'todo'
description: text
files_involved: jsonb
estimated_minutes: integer
actual_duration_ms: integer
git_branch: text
git_commit_hash: text
expected_files: jsonb
agent_version: text
prompt_tokens: integer
completion_tokens: integer
total_tokens: integer
total_cost_usd: integer
blocked_reason: text
priority: integer DEFAULT 1
dependency_task_id: integer
retry_count: integer DEFAULT 0
notes: text
completed_at: timestamp with time zone
estimate_hours: integer
verify_command: text
done_criteria: text
resume_context: jsonb
recommended_model: text DEFAULT 'sonnet'
created_by_user_id: integer
created_at: timestamp with time zone DEFAULT now()
updated_at: timestamp with time zone DEFAULT now()
```

## Agent Orchestration Tables

### `agent_config`
Per-project agent configuration.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
file_glob_boundaries: jsonb DEFAULT '[]'
model: text DEFAULT 'sonnet' NOT NULL
created_at: timestamp with time zone DEFAULT now()
updated_at: timestamp with time zone DEFAULT now()
```

### `agent_sessions`
Long-running agent sessions executing plans.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
plan_id: integer REFERENCES plans(id)
git_branch: text
prompt_tokens: integer DEFAULT 0
completion_tokens: integer DEFAULT 0
total_tokens: integer DEFAULT 0
status: agent_status DEFAULT 'running'
started_at: timestamp with time zone DEFAULT now()
ended_at: timestamp with time zone
error: text
```

### `agent_logs`
Structured logging from agent operations.

```sql
id: serial PRIMARY KEY
task_id: integer NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
project_id: integer
level: log_level DEFAULT 'info'
is_internal: boolean DEFAULT false
message: text NOT NULL
context: jsonb
timestamp: timestamp with time zone DEFAULT now()
```

### `agent_tokens`
API tokens for agent authentication.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
name: text NOT NULL
token_hash: text NOT NULL UNIQUE
created_by_user_id: integer REFERENCES users(id)
created_at: timestamp with time zone DEFAULT now()
last_used_at: timestamp with time zone
revoked_at: timestamp with time zone
preferred_model: text DEFAULT 'sonnet'
```

## Task Execution Tables

### `task_attempts`
Individual execution attempts for tasks (supports retries).

```sql
id: serial PRIMARY KEY
task_id: integer NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
seq: integer NOT NULL
log_lines: jsonb
started_at: timestamp with time zone DEFAULT now()
ended_at: timestamp with time zone
success: boolean
```

### `file_changes`
Files modified during task execution.

```sql
id: serial PRIMARY KEY
attempt_id: integer NOT NULL REFERENCES task_attempts(id) ON DELETE CASCADE
file_path: text NOT NULL
action: text NOT NULL
diff: text
```

### `test_results`
Test execution results for verification.

```sql
id: serial PRIMARY KEY
task_id: integer NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
success: boolean NOT NULL
logs: text
timestamp: timestamp with time zone DEFAULT now()
created_by_user_id: integer
```

## User Management Tables

### `users`
Application users with role-based access.

```sql
id: serial PRIMARY KEY
username: text NOT NULL UNIQUE
password_hash: text NOT NULL
avatar_url: text
timezone: text
locale: text DEFAULT 'en'
onboarding_step: integer DEFAULT 0
avatar_id: integer DEFAULT 1
is_active: boolean DEFAULT true NOT NULL
is_admin: boolean DEFAULT false NOT NULL
role: user_role DEFAULT 'viewer' NOT NULL
last_login_at: timestamp with time zone
created_at: timestamp with time zone DEFAULT now()
updated_at: timestamp with time zone DEFAULT now()
```

### `invites`
Project invitation management.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
email: text NOT NULL
role: user_role DEFAULT 'viewer' NOT NULL
invited_by: integer NOT NULL REFERENCES users(id)
resend_count: integer DEFAULT 0 NOT NULL
last_resent_at: timestamp with time zone
expires_at: timestamp with time zone NOT NULL
created_at: timestamp with time zone DEFAULT now()
```

## Integration & Audit Tables

### `git_commits`
Git commit tracking linked to tasks and plans.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
commit_sha: text NOT NULL
branch: text NOT NULL
message: text
author: text
metadata: jsonb
committed_at: timestamp with time zone DEFAULT now()
task_id: integer REFERENCES tasks(id) ON DELETE SET NULL
plan_id: integer REFERENCES plans(id) ON DELETE SET NULL
created_by_user_id: integer REFERENCES users(id)
```

### `webhook_deliveries`
Webhook delivery tracking for integrations.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
event: text NOT NULL
payload: jsonb NOT NULL
url: text NOT NULL
status: text NOT NULL
status_code: integer
response: text
created_at: timestamp with time zone DEFAULT now()
delivered_at: timestamp with time zone
```

### `api_request_logs`
API request monitoring and rate limiting.

```sql
id: serial PRIMARY KEY
token_id: integer REFERENCES agent_tokens(id)
endpoint: text NOT NULL
method: text NOT NULL
status_code: integer NOT NULL
duration_ms: integer NOT NULL
project_id: integer REFERENCES projects(id)
requested_at: timestamp with time zone DEFAULT now()
```

### `audit_log`
Comprehensive audit trail for security compliance.

```sql
id: serial PRIMARY KEY
project_id: integer REFERENCES projects(id)
user_id: integer REFERENCES users(id)
action: text NOT NULL
resource: text NOT NULL
resource_id: text
details: jsonb
ip_address: text
created_at: timestamp with time zone DEFAULT now() NOT NULL
```

### `usage_snapshots`
Daily usage aggregation for cost tracking.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
date: timestamp with time zone NOT NULL
total_tokens: integer DEFAULT 0 NOT NULL
total_cost_usd: integer DEFAULT 0 NOT NULL
task_count: integer DEFAULT 0 NOT NULL
created_at: timestamp with time zone DEFAULT now()
```

**Indexes:**
- `usage_date_project_idx` (unique) on project_id, date

## Schema Notes

### Key Foreign Key Relationships
- Projects cascade delete to most child tables (specifications, agent_config, agent_sessions, etc.)
- Cascading maintains referential integrity throughout the system
- Soft deletes not used - deleted records are permanently removed to comply with GDPR

### Conventions
- All tables use `serial` primary keys unless specified
- Timestamps use `timestamptz` to avoid timezone issues
- `id` and `created_at` columns on all tables for consistency
- Enum types enforced at database level for data integrity
- JSONB fields used for flexible metadata storage

### Performance Optimizations
- Indexes on foreign keys and frequently queried columns
- Composite index on usage_snapshots for dashboard queries
- Denormalized counters (task_count, total_estimated_minutes) for display

## Migration Management

Always use pnpm commands for schema management:

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply schema changes in development
pnpm db:push

# Apply migrations in production
pnpm db:migrate

# View and edit data
pnpm db:studio

# Seed test data
pnpm db:seed
```

**Important:** Never manually edit files in the `drizzle/` directory. Always generate migrations from the schema defined in `src/db/schema.ts`.