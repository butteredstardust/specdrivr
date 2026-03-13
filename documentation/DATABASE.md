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

Plan lifecycle: `pending_approval`, `approved`, `rejected`, `abandoned`, `changes_requested`, `complete`

### `project_status`

Project states: `active`, `archived`

### `spec_status`

Specification states: `drafting`, `pending_plan`, `pending_approval`, `executing`, `completed`, `stalled`, `archived`

### `task_status`

Task workflow: `todo`, `in_progress`, `done`, `blocked`, `failed`, `skipped`

### `session_status`

Agent session states: `running`, `paused`, `completed`, `failed`, `cancelled`

### `user_role`

User permissions: `owner`, `admin`, `member`, `viewer`

### `task_attempt_status`

Attempt workflow: `running`, `succeeded`, `failed`

## Core Tables

### `projects`

Main project container for all work.

```sql
id: serial PRIMARY KEY
name: text NOT NULL
slug: text NOT NULL UNIQUE
description: text
repository_url: text
repository_branch: text DEFAULT 'main'
avatar_color: text DEFAULT '7c5cfc'
is_demo: boolean NOT NULL DEFAULT false
status: project_status NOT NULL DEFAULT 'active'
created_by: text REFERENCES users(id) ON DELETE SET NULL
created_at: timestamp with time zone NOT NULL DEFAULT now()
updated_at: timestamp with time zone NOT NULL DEFAULT now()
```

**Indexes:**

- `project_slug_idx` (unique) on slug
- `project_created_by_idx` on created_by

### `specifications`

User-written specifications that drive plan generation.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
name: text NOT NULL
status: spec_status NOT NULL DEFAULT 'drafting'
current_version_id: integer
created_by: text REFERENCES users(id) ON DELETE SET NULL
created_at: timestamp with time zone NOT NULL DEFAULT now()
updated_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `spec_versions`

Historical versions of specifications.

```sql
id: serial PRIMARY KEY
spec_id: integer NOT NULL REFERENCES specifications(id) ON DELETE CASCADE
version_number: integer NOT NULL
markdown_content: text NOT NULL
created_by: text REFERENCES users(id) ON DELETE SET NULL
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `plans`

AI-generated execution plans containing multiple tasks.

```sql
id: serial PRIMARY KEY
spec_id: integer NOT NULL REFERENCES specifications(id) ON DELETE CASCADE
spec_version_id: integer REFERENCES spec_versions(id) ON DELETE SET NULL
status: plan_status NOT NULL DEFAULT 'pending_approval'
markdown_content: text
reviewer_notes: text
approved_at: timestamp with time zone
approved_by: text REFERENCES users(id) ON DELETE SET NULL
generation_duration_ms: integer
generation_error: text
model_version: text
task_count: integer DEFAULT 0
total_estimated_minutes: integer
created_by: text REFERENCES users(id) ON DELETE SET NULL
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `plan_reviews`

Audit trail for plan approval workflow.

```sql
id: serial PRIMARY KEY
plan_id: integer NOT NULL REFERENCES plans(id) ON DELETE CASCADE
user_id: text REFERENCES users(id) ON DELETE SET NULL
action: text NOT NULL -- approved | rejected | changes_requested | abandoned
notes: text
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `tasks`

Individual work items within a plan.

```sql
id: serial PRIMARY KEY
plan_id: integer NOT NULL REFERENCES plans(id) ON DELETE CASCADE
spec_id: integer REFERENCES specifications(id) ON DELETE SET NULL
external_id: text NOT NULL -- e.g. "T-101"
title: text NOT NULL
description: text
status: task_status NOT NULL DEFAULT 'todo'
depends_on: text[] DEFAULT '[]'
execution_order: integer NOT NULL DEFAULT 0
blocked_reason: text
human_context: text
forced_done: boolean NOT NULL DEFAULT false
attempt_count: integer NOT NULL DEFAULT 0
current_attempt_id: integer
verification_passed: boolean
estimated_minutes: integer
actual_duration_ms: integer
git_branch: text
git_commit_hash: text
expected_files: text[] DEFAULT '[]'
agent_version: text
prompt_tokens_used: integer
completion_tokens_used: integer
total_cost_usd: double precision
recommended_model: text DEFAULT 'sonnet'
started_at: timestamp with time zone
completed_at: timestamp with time zone
created_at: timestamp with time zone NOT NULL DEFAULT now()
updated_at: timestamp with time zone NOT NULL DEFAULT now()
```

## Agent Orchestration Tables

### `agent_config`

Per-project agent configuration and integration settings.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE
model_id: text NOT NULL DEFAULT 'claude-sonnet-4-6'
plan_model_id: text NOT NULL DEFAULT 'claude-opus-4-6'
max_concurrent_tasks: integer NOT NULL DEFAULT 3
task_timeout_seconds: integer NOT NULL DEFAULT 300
max_retries_per_task: integer NOT NULL DEFAULT 2
retry_delay_seconds: integer NOT NULL DEFAULT 30
require_approval: boolean NOT NULL DEFAULT true
auto_generate_plan: boolean NOT NULL DEFAULT false
branch_prefix: text NOT NULL DEFAULT 'daemon'
commit_message_prefix: text NOT NULL DEFAULT 'feat'
allowed_file_globs: text[] DEFAULT '[]'
forbidden_file_globs: text[] DEFAULT '[]'
test_command: text
lint_command: text
setup_command: text
max_diff_size_kb: integer NOT NULL DEFAULT 500
pr_auto_create: boolean NOT NULL DEFAULT false
pr_target_branch: text NOT NULL DEFAULT 'main'
github_token: text
github_repo: text
github_branch: text DEFAULT 'main'
github_webhook_secret: text
slack_bot_token: text
slack_channel_id: text
created_at: timestamp with time zone NOT NULL DEFAULT now()
updated_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `agent_sessions`

Long-running agent sessions executing plans.

```sql
id: serial PRIMARY KEY
spec_id: integer REFERENCES specifications(id) ON DELETE SET NULL
plan_id: integer REFERENCES plans(id) ON DELETE SET NULL
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
status: session_status NOT NULL DEFAULT 'running'
current_task_id: integer
last_heartbeat_at: timestamp with time zone
tasks_executed: integer NOT NULL DEFAULT 0
tasks_succeeded: integer NOT NULL DEFAULT 0
tasks_failed: integer NOT NULL DEFAULT 0
total_prompt_tokens: integer DEFAULT 0
total_completion_tokens: integer DEFAULT 0
total_cost_usd: double precision DEFAULT 0
pause_count: integer NOT NULL DEFAULT 0
agent_version: text
git_base_branch: text
git_base_commit: text
git_head_commit: text
error_message: text
started_by: text REFERENCES users(id) ON DELETE SET NULL
started_at: timestamp with time zone NOT NULL DEFAULT now()
ended_at: timestamp with time zone
```

### `agent_events`

Session-scoped event log for Mission Control feed.

```sql
id: serial PRIMARY KEY
session_id: integer NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE
spec_id: integer REFERENCES specifications(id) ON DELETE SET NULL
task_id: integer REFERENCES tasks(id) ON DELETE SET NULL
user_id: text REFERENCES users(id) ON DELETE SET NULL
event_type: text NOT NULL
message: text NOT NULL
metadata: jsonb DEFAULT '{}'
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `agent_logs`

Structured logging from agent task execution.

```sql
id: serial PRIMARY KEY
task_id: integer NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
session_id: integer REFERENCES agent_sessions(id) ON DELETE SET NULL
project_id: integer
level: log_level NOT NULL DEFAULT 'info'
is_internal: boolean DEFAULT false
message: text NOT NULL
context: jsonb
timestamp: timestamp with time zone NOT NULL DEFAULT now()
```

### `agent_tokens`

API tokens for agent authentication.

```sql
id: serial PRIMARY KEY
user_id: text REFERENCES users(id) ON DELETE CASCADE
project_id: integer REFERENCES projects(id) ON DELETE CASCADE
name: text NOT NULL
token_hash: text NOT NULL UNIQUE
prefix: text NOT NULL
expires_at: timestamp with time zone
last_used_at: timestamp with time zone
revoked_at: timestamp with time zone
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

## Task Execution Tables

### `task_attempts`

Individual execution attempts for tasks (supports retries).

```sql
id: serial PRIMARY KEY
task_id: integer NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
seq: integer NOT NULL
status: task_attempt_status NOT NULL DEFAULT 'running'
log_lines: jsonb DEFAULT '[]'
agent_version: text
prompt_tokens_used: integer
completion_tokens_used: integer
exit_code: integer
working_directory: text
error_message: text
started_at: timestamp with time zone NOT NULL DEFAULT now()
ended_at: timestamp with time zone
```

### `file_changes`

Files modified during task execution.

```sql
id: serial PRIMARY KEY
task_id: integer NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
attempt_id: integer REFERENCES task_attempts(id) ON DELETE SET NULL
file_path: text NOT NULL
change_type: text NOT NULL -- created | modified | deleted
diff: text
is_binary: boolean NOT NULL DEFAULT false
language: text
size_bytes: integer
lines_added: integer DEFAULT 0
lines_removed: integer DEFAULT 0
previous_hash: text
new_hash: text
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `test_results`

Test execution results for verification.

```sql
id: serial PRIMARY KEY
task_id: integer NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
success: boolean NOT NULL
logs: text
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

## User Management Tables

### `users`

Application users with role-based access.

```sql
id: text PRIMARY KEY
name: text NOT NULL
email: text NOT NULL UNIQUE
password_hash: text
avatar_url: text
timezone: text DEFAULT 'UTC'
locale: text DEFAULT 'en-US'
onboarding_step: integer DEFAULT 0
theme: text DEFAULT 'system'
role: user_role NOT NULL DEFAULT 'viewer'
is_active: boolean NOT NULL DEFAULT true
email_verified: boolean NOT NULL DEFAULT false
image: text
created_at: timestamp with time zone NOT NULL DEFAULT now()
updated_at: timestamp with time zone NOT NULL DEFAULT now()
last_active_at: timestamp with time zone
```

### `invites`

Project invitation management.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
email: text NOT NULL
role: user_role NOT NULL DEFAULT 'viewer'
token: text NOT NULL UNIQUE
invited_by: text NOT NULL REFERENCES users(id)
resend_count: integer NOT NULL DEFAULT 0
last_resent_at: timestamp with time zone
expires_at: timestamp with time zone NOT NULL
used_at: timestamp with time zone
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `project_members`

Mapping of users to projects with roles.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
user_id: text NOT NULL REFERENCES users(id) ON DELETE CASCADE
role: user_role NOT NULL DEFAULT 'viewer'
status: text NOT NULL DEFAULT 'active' -- active | invited | suspended
invited_at: timestamp with time zone NOT NULL DEFAULT now()
joined_at: timestamp with time zone
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `sessions`

Authentication sessions for Better Auth.

```sql
id: text PRIMARY KEY
expires_at: timestamp with time zone NOT NULL
token: text NOT NULL UNIQUE
created_at: timestamp with time zone NOT NULL DEFAULT now()
updated_at: timestamp with time zone NOT NULL DEFAULT now()
ip_address: text
user_agent: text
user_id: text NOT NULL REFERENCES users(id) ON DELETE CASCADE
```

### `accounts`

External accounts linked to users (for OAuth/Credentials).

```sql
id: text PRIMARY KEY
account_id: text NOT NULL
provider_id: text NOT NULL
user_id: text NOT NULL REFERENCES users(id) ON DELETE CASCADE
access_token: text
refresh_token: text
id_token: text
access_token_expires_at: timestamp with time zone
refresh_token_expires_at: timestamp with time zone
scope: text
password: text
created_at: timestamp with time zone NOT NULL DEFAULT now()
updated_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `verifications`

Verification tokens for email verification and password resets.

```sql
id: text PRIMARY KEY
identifier: text NOT NULL
value: text NOT NULL
expires_at: timestamp with time zone NOT NULL
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

## Integration & Audit Tables

### `webhooks`

Project-level outgoing webhooks.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
url: text NOT NULL
secret: text
events: jsonb NOT NULL DEFAULT '["*"]'
is_active: boolean NOT NULL DEFAULT true
status: text NOT NULL DEFAULT 'active' -- active | error
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `webhook_deliveries`

Webhook delivery tracking and retry logging.

```sql
id: serial PRIMARY KEY
webhook_id: integer REFERENCES webhooks(id) ON DELETE SET NULL
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
event_type: text NOT NULL
payload: jsonb NOT NULL
request_headers: jsonb
response_status: integer
response_body: text
duration_ms: integer
attempt: integer NOT NULL DEFAULT 1
status: text NOT NULL DEFAULT 'pending' -- pending | delivered | failed | exhausted
next_retry_at: timestamp with time zone
delivered_at: timestamp with time zone
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `git_commits`

Git commit tracking linked to tasks.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
task_id: integer REFERENCES tasks(id) ON DELETE SET NULL
commit_sha: text NOT NULL
branch: text NOT NULL
message: text NOT NULL
author: text
metadata: jsonb
committed_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `apiRequestLogs`

API request monitoring and rate limiting.

```sql
id: serial PRIMARY KEY
token_id: integer REFERENCES agent_tokens(id)
project_id: integer REFERENCES projects(id)
endpoint: text NOT NULL
method: text NOT NULL
status_code: integer NOT NULL
duration_ms: integer NOT NULL
requested_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `audit_log`

Comprehensive audit trail for security compliance.

```sql
id: serial PRIMARY KEY
project_id: integer REFERENCES projects(id) ON DELETE CASCADE
user_id: text REFERENCES users(id)
action: text NOT NULL
target_type: text
target_id: text
detail: jsonb
ip_address: text
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `usage_snapshots`

Daily usage aggregation for cost tracking.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
date: timestamp with time zone NOT NULL
sessions_run: integer NOT NULL DEFAULT 0
tasks_executed: integer NOT NULL DEFAULT 0
tasks_succeeded: integer NOT NULL DEFAULT 0
tasks_failed: integer NOT NULL DEFAULT 0
prompt_tokens: integer NOT NULL DEFAULT 0
completion_tokens: integer NOT NULL DEFAULT 0
estimated_cost_usd: double precision NOT NULL DEFAULT 0
specs_created: integer NOT NULL DEFAULT 0
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

**Indexes:**

- `usage_date_project_idx` (unique) on project_id, date

### `notification_preferences`

User notification channel preferences.

```sql
id: serial PRIMARY KEY
user_id: text NOT NULL REFERENCES users(id) ON DELETE CASCADE
event_type: text NOT NULL
email_enabled: boolean NOT NULL DEFAULT false
in_app_enabled: boolean NOT NULL DEFAULT true
created_at: timestamp with time zone NOT NULL DEFAULT now()
updated_at: timestamp with time zone NOT NULL DEFAULT now()
```

**Indexes:**

- `notif_pref_user_event_idx` (unique) on user_id, event_type

## Schema Notes

### Key Foreign Key Relationships

- Projects cascade delete to most child tables (specifications, agent_config, agent_sessions, webhooks, etc.)
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
- Denormalized counters (task_count, tasks_executed) for display

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

## Development Gaps & Technical Debt

- **Schema completeness:** Drizzle schema covers all tables now, but some indexes or constraints mentioned in the spec might need verification in `drizzle.config.ts` outputs.
