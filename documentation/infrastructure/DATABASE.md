# Database Schema Documentation

## Overview

Use PostgreSQL with Drizzle ORM for type-safe database operations. The schema supports agent orchestration, project management, specifications, plans, tasks, Git integration, audit logs, and usage tracking.

**Package manager:** Run all database commands with `pnpm`. Do not run `npm` commands.

```bash
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Apply pending migrations
pnpm db:studio    # Open Drizzle Studio GUI
pnpm db:seed      # Seed database with test data
```

## Database Enums

### `plan_status`

Use these plan lifecycle values: `pending_approval`, `executing`, `rejected`, `abandoned`, `changes_requested`, `completed`

### `spec_status`

Use these specification states: `drafting`, `pending_plan`, `pending_approval`, `executing`, `completed`, `stalled`, `archived`

### `task_status`

Use these task workflow values: `todo`, `in_progress`, `done`, `blocked`, `failed`, `skipped`

### `session_status`

Use these agent session states: `running`, `paused`, `completed`, `failed`, `cancelled`

### `project_status`

Use these project states: `active`, `archived`

### `log_level`

Use these logging levels: `debug`, `info`, `warn`, `error`

### `user_role`

Use these user permission values: `owner`, `admin`, `member`, `viewer`

### `task_attempt_status`

Use these attempt workflow values: `running`, `succeeded`, `failed`

## Core Tables

### `users`

BetterAuth manages this standard user table with custom extensions.

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

### `projects`

This table is the main project container for all work.

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

### `project_members`

This table associates project members with their roles.

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

### `specifications`

This table stores user-written specifications for plan generation.

```sql
id: serial PRIMARY KEY
project_id: integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE
name: text NOT NULL
status: spec_status NOT NULL DEFAULT 'drafting'
current_version_id: integer -- references spec_versions(id)
created_by: text REFERENCES users(id) ON DELETE SET NULL
created_at: timestamp with time zone NOT NULL DEFAULT now()
updated_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `spec_versions`

This table stores specification versions.

```sql
id: serial PRIMARY KEY
spec_id: integer NOT NULL REFERENCES specifications(id) ON DELETE CASCADE
version_number: integer NOT NULL
markdown_content: text NOT NULL
created_by: text REFERENCES users(id) ON DELETE SET NULL
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `plans`

This table stores AI-generated execution plans with multiple tasks.

```sql
id: serial PRIMARY KEY
spec_id: integer NOT NULL REFERENCES specifications(id) ON DELETE CASCADE
spec_version_id: integer REFERENCES spec_versions(id) ON DELETE SET NULL
status: plan_status NOT NULL DEFAULT 'pending_approval'
intent: text
phase_label: text
architecture_decisions: jsonb DEFAULT '[]'
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

### `tasks`

This table stores individual work items in a plan.

```sql
id: serial PRIMARY KEY
plan_id: integer NOT NULL REFERENCES plans(id) ON DELETE CASCADE
spec_id: integer REFERENCES specifications(id) ON DELETE SET NULL
external_id: text NOT NULL -- e.g. "T-101"
title: text NOT NULL
description: text
status: task_status NOT NULL DEFAULT 'todo'
depends_on: text[] DEFAULT '[]' -- array of externalIds
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

### `agent_sessions`

This table is the runtime container for task execution.

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

### `task_attempts`

This table stores detailed logs for each task execution attempt.

```sql
id: serial PRIMARY KEY
task_id: integer NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
session_id: integer REFERENCES agent_sessions(id) ON DELETE SET NULL
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

This table stores snapshots of task file changes.

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

### `agent_config`

This table stores agent settings for each project.

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
gemini_api_key: text
gemini_model: text NOT NULL DEFAULT 'gemini-2.0-flash'
claude_api_key: text
backend: text NOT NULL DEFAULT 'gemini'
created_at: timestamp with time zone NOT NULL DEFAULT now()
updated_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `audit_log`

This table stores the security and governance audit trail.

```sql
id: serial PRIMARY KEY
project_id: integer REFERENCES projects(id) ON DELETE SET NULL
user_id: text REFERENCES users(id) ON DELETE SET NULL
action: text NOT NULL
target_type: text NOT NULL -- specification | plan | task | member | project | settings | auth
target_id: text
detail: jsonb DEFAULT '{}'
ip_address: text
user_agent: text
created_at: timestamp with time zone NOT NULL DEFAULT now()
```

### `agent_events`

This table stores the session-scoped event stream for the live Mission Control feed.

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

This table stores task-scoped technical logs for the terminal view.

```sql
id: serial PRIMARY KEY
task_id: integer REFERENCES tasks(id) ON DELETE CASCADE
session_id: integer REFERENCES agent_sessions(id) ON DELETE SET NULL
project_id: integer REFERENCES projects(id) ON DELETE CASCADE
level: log_level NOT NULL DEFAULT 'info'
is_internal: boolean DEFAULT false
message: text NOT NULL
context: jsonb
timestamp: timestamp with time zone NOT NULL DEFAULT now()
```

## Secondary Tables

- `sessions`: BetterAuth manages user browser sessions.
- `accounts`: BetterAuth manages OAuth accounts.
- `verifications`: BetterAuth manages email verification tokens.
- `agent_tokens`: This table stores project-scoped API tokens for the DAEMON agent.
- `invites`: This table stores project invitation tokens.
- `notifications`: This table stores user-specific in-app notifications.
- `notification_preferences`: This table stores notification toggles for each user.
- `usage_snapshots`: This table stores daily project usage aggregation.
- `webhooks`: This table stores outbound webhook configuration.
- `webhook_deliveries`: This table stores the webhook delivery audit trail.
