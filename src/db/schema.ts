import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  pgEnum,
  uniqueIndex,
  index,
  doublePrecision,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const planStatusEnum = pgEnum('plan_status', [
  'pending_approval',
  'approved',
  'rejected',
  'abandoned',
  'changes_requested',
  'complete',
]);

export const specStatusEnum = pgEnum('spec_status', [
  'drafting',
  'pending_plan',
  'pending_approval',
  'executing',
  'complete',
  'stalled',
  'archived',
]);

export const taskStatusEnum = pgEnum('task_status', [
  'todo',
  'in_progress',
  'done',
  'blocked',
  'failed',
  'skipped',
]);

export const sessionStatusEnum = pgEnum('session_status', [
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
]);

export const projectStatusEnum = pgEnum('project_status', [
  'active',
  'archived',
]);

export const logLevelEnum = pgEnum('log_level', [
  'debug',
  'info',
  'warn',
  'error',
]);

export const userRoleEnum = pgEnum('user_role', [
  'owner',
  'admin',
  'member',
  'viewer',
]);

export const taskAttemptStatusEnum = pgEnum('task_attempt_status', [
  'running',
  'succeeded',
  'failed',
]);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  timezone: text('timezone').default('UTC'),
  locale: text('locale').default('en-US'),
  onboardingStep: integer('onboarding_step').default(0),
  theme: text('theme').default('system'),
  role: userRoleEnum('role').notNull().default('viewer'),
  isActive: boolean('is_active').notNull().default(true),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Better Auth Tables
// ---------------------------------------------------------------------------

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  repositoryUrl: text('repository_url'),
  repositoryBranch: text('repository_branch').default('main'),
  avatarColor: text('avatar_color').default('7c5cfc'),
  isDemo: boolean('is_demo').notNull().default(false),
  status: projectStatusEnum('status').notNull().default('active'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('project_slug_idx').on(table.slug),
  createdByIdx: index('project_created_by_idx').on(table.createdBy),
}));

// ---------------------------------------------------------------------------
// Project Members
// ---------------------------------------------------------------------------

export const projectMembers = pgTable('project_members', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: userRoleEnum('role').notNull().default('viewer'),
  status: text('status').notNull().default('active'), // active | invited | suspended
  invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueProjectUser: uniqueIndex('project_user_idx').on(table.projectId, table.userId),
}));

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------

export const invites = pgTable('invites', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: userRoleEnum('role').notNull().default('viewer'),
  token: text('token').notNull().unique(),
  invitedBy: text('invited_by').notNull().references(() => users.id),
  resendCount: integer('resend_count').notNull().default(0),
  lastResentAt: timestamp('last_resent_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Agent Tokens (user API tokens)
// ---------------------------------------------------------------------------

export const agentTokens = pgTable('agent_tokens', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  prefix: text('prefix').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Specifications
// ---------------------------------------------------------------------------

export const specifications = pgTable('specifications', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: specStatusEnum('status').notNull().default('drafting'),
  currentVersionId: integer('current_version_id'), // FK set after first version created
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  projectStatusIdx: index('spec_project_status_idx').on(table.projectId, table.status),
}));

// ---------------------------------------------------------------------------
// Spec Versions
// ---------------------------------------------------------------------------

export const specVersions = pgTable('spec_versions', {
  id: serial('id').primaryKey(),
  specId: integer('spec_id').notNull().references(() => specifications.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  markdownContent: text('markdown_content').notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueSpecVersion: uniqueIndex('spec_version_idx').on(table.specId, table.versionNumber),
}));

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  specId: integer('spec_id').notNull().references(() => specifications.id, { onDelete: 'cascade' }),
  specVersionId: integer('spec_version_id').references(() => specVersions.id, { onDelete: 'set null' }),
  status: planStatusEnum('status').notNull().default('pending_approval'),
  markdownContent: text('markdown_content'),
  reviewerNotes: text('reviewer_notes'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: text('approved_by').references(() => users.id, { onDelete: 'set null' }),
  generationDurationMs: integer('generation_duration_ms'),
  generationError: text('generation_error'),
  modelVersion: text('model_version'),
  taskCount: integer('task_count').default(0),
  totalEstimatedMinutes: integer('total_estimated_minutes'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  specStatusIdx: index('plan_spec_status_idx').on(table.specId, table.status),
}));

// ---------------------------------------------------------------------------
// Plan Reviews (audit trail)
// ---------------------------------------------------------------------------

export const planReviews = pgTable('plan_reviews', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // approved | rejected | changes_requested | abandoned
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  specId: integer('spec_id').references(() => specifications.id, { onDelete: 'set null' }),
  externalId: text('external_id').notNull(), // e.g. "T-101" — display identifier
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
  dependsOn: text('depends_on').array().default([]), // array of externalIds e.g. ["T-099", "T-100"]
  executionOrder: integer('execution_order').notNull().default(0),
  blockedReason: text('blocked_reason'),
  humanContext: text('human_context'),
  forcedDone: boolean('forced_done').notNull().default(false),
  attemptCount: integer('attempt_count').notNull().default(0),
  currentAttemptId: integer('current_attempt_id'), // set to latest attempt FK after start
  verificationPassed: boolean('verification_passed'),
  estimatedMinutes: integer('estimated_minutes'),
  actualDurationMs: integer('actual_duration_ms'),
  gitBranch: text('git_branch'),
  gitCommitHash: text('git_commit_hash'),
  expectedFiles: text('expected_files').array().default([]),
  agentVersion: text('agent_version'),
  promptTokensUsed: integer('prompt_tokens_used'),
  completionTokensUsed: integer('completion_tokens_used'),
  totalCostUsd: doublePrecision('total_cost_usd'),
  recommendedModel: text('recommended_model').default('sonnet'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  planStatusIdx: index('task_plan_status_idx').on(table.planId, table.status),
  specIdx: index('task_spec_idx').on(table.specId),
  externalIdIdx: index('task_external_id_idx').on(table.planId, table.externalId),
}));

// ---------------------------------------------------------------------------
// Task Attempts
// ---------------------------------------------------------------------------

export const taskAttempts = pgTable('task_attempts', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  seq: integer('seq').notNull(),
  status: taskAttemptStatusEnum('status').notNull().default('running'),
  logLines: jsonb('log_lines').default([]),
  agentVersion: text('agent_version'),
  promptTokensUsed: integer('prompt_tokens_used'),
  completionTokensUsed: integer('completion_tokens_used'),
  exitCode: integer('exit_code'),
  workingDirectory: text('working_directory'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
}, (table) => ({
  taskIdx: index('attempt_task_idx').on(table.taskId),
}));

// ---------------------------------------------------------------------------
// File Changes
// ---------------------------------------------------------------------------

export const fileChanges = pgTable('file_changes', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  attemptId: integer('attempt_id').references(() => taskAttempts.id, { onDelete: 'set null' }),
  filePath: text('file_path').notNull(),
  changeType: text('change_type').notNull(), // created | modified | deleted
  diff: text('diff'),
  isBinary: boolean('is_binary').notNull().default(false),
  language: text('language'),
  sizeBytes: integer('size_bytes'),
  linesAdded: integer('lines_added').default(0),
  linesRemoved: integer('lines_removed').default(0),
  previousHash: text('previous_hash'),
  newHash: text('new_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx: index('file_change_task_idx').on(table.taskId),
}));

// ---------------------------------------------------------------------------
// Agent Sessions
// ---------------------------------------------------------------------------

export const agentSessions = pgTable('agent_sessions', {
  id: serial('id').primaryKey(),
  specId: integer('spec_id').references(() => specifications.id, { onDelete: 'set null' }),
  planId: integer('plan_id').references(() => plans.id, { onDelete: 'set null' }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  status: sessionStatusEnum('status').notNull().default('running'),
  currentTaskId: integer('current_task_id'),
  lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
  tasksExecuted: integer('tasks_executed').notNull().default(0),
  tasksSucceeded: integer('tasks_succeeded').notNull().default(0),
  tasksFailed: integer('tasks_failed').notNull().default(0),
  totalPromptTokens: integer('total_prompt_tokens').default(0),
  totalCompletionTokens: integer('total_completion_tokens').default(0),
  totalCostUsd: doublePrecision('total_cost_usd').default(0),
  pauseCount: integer('pause_count').notNull().default(0),
  agentVersion: text('agent_version'),
  gitBaseBranch: text('git_base_branch'),
  gitBaseCommit: text('git_base_commit'),
  gitHeadCommit: text('git_head_commit'),
  errorMessage: text('error_message'),
  startedBy: text('started_by').references(() => users.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
}, (table) => ({
  projectStatusIdx: index('session_project_status_idx').on(table.projectId, table.status),
  specIdx: index('session_spec_idx').on(table.specId),
}));

// ---------------------------------------------------------------------------
// Agent Events (session-scoped event log — feeds Mission Control event feed)
// ---------------------------------------------------------------------------

export const agentEvents = pgTable('agent_events', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => agentSessions.id, { onDelete: 'cascade' }),
  specId: integer('spec_id').references(() => specifications.id, { onDelete: 'set null' }),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: text('event_type').notNull(),
  // PLAN_GENERATED | PLAN_APPROVED | PLAN_REJECTED | CHANGES_REQUESTED
  // TASK_START | TASK_DONE | TASK_BLOCKED | TASK_FAILED | TASK_RETRIED
  // SESSION_PAUSED | SESSION_RESUMED | SESSION_COMPLETED | SESSION_FAILED | SESSION_CANCELLED
  message: text('message').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sessionIdx: index('event_session_idx').on(table.sessionId),
  sessionTypeIdx: index('event_session_type_idx').on(table.sessionId, table.eventType),
}));

// ---------------------------------------------------------------------------
// Agent Logs (task-scoped execution output — feeds terminal in Task Drawer)
// ---------------------------------------------------------------------------

export const agentLogs = pgTable('agent_logs', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  sessionId: integer('session_id').references(() => agentSessions.id, { onDelete: 'set null' }),
  projectId: integer('project_id'),
  level: logLevelEnum('level').notNull().default('info'),
  isInternal: boolean('is_internal').default(false),
  message: text('message').notNull(),
  context: jsonb('context'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskIdx: index('agent_log_task_idx').on(table.taskId),
}));

// ---------------------------------------------------------------------------
// Agent Config (one row per project)
// ---------------------------------------------------------------------------

export const agentConfig = pgTable('agent_config', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().unique().references(() => projects.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull().default('claude-sonnet-4-6'),
  planModelId: text('plan_model_id').notNull().default('claude-opus-4-6'),
  maxConcurrentTasks: integer('max_concurrent_tasks').notNull().default(3),
  taskTimeoutSeconds: integer('task_timeout_seconds').notNull().default(300),
  maxRetriesPerTask: integer('max_retries_per_task').notNull().default(2),
  retryDelaySeconds: integer('retry_delay_seconds').notNull().default(30),
  requireApproval: boolean('require_approval').notNull().default(true),
  autoGeneratePlan: boolean('auto_generate_plan').notNull().default(false),
  branchPrefix: text('branch_prefix').notNull().default('daemon'),
  commitMessagePrefix: text('commit_message_prefix').notNull().default('feat'),
  allowedFileGlobs: text('allowed_file_globs').array().default([]),
  forbiddenFileGlobs: text('forbidden_file_globs').array().default([]),
  testCommand: text('test_command'),
  lintCommand: text('lint_command'),
  setupCommand: text('setup_command'),
  maxDiffSizeKb: integer('max_diff_size_kb').notNull().default(500),
  prAutoCreate: boolean('pr_auto_create').notNull().default(false),
  prTargetBranch: text('pr_target_branch').notNull().default('main'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  // plan_generated | plan_approved | plan_rejected | changes_requested
  // session_complete | session_failed | task_blocked | member_invited | role_changed
  title: text('title').notNull(),
  body: text('body').notNull(),
  linkUrl: text('link_url').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  actorUserId: text('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userUnreadIdx: index('notification_user_unread_idx').on(table.userId, table.readAt),
}));

// ---------------------------------------------------------------------------
// Notification Preferences
// ---------------------------------------------------------------------------

export const notificationPreferences = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  emailEnabled: boolean('email_enabled').notNull().default(false),
  inAppEnabled: boolean('in_app_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueUserEvent: uniqueIndex('notif_pref_user_event_idx').on(table.userId, table.eventType),
}));

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export const webhooks = pgTable('webhooks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  secret: text('secret'),
  events: jsonb('events').notNull().default(['*']),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Webhook Deliveries
// ---------------------------------------------------------------------------

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhooks.id, { onDelete: 'set null' }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  requestHeaders: jsonb('request_headers'),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  durationMs: integer('duration_ms'),
  attempt: integer('attempt').notNull().default(1),
  status: text('status').notNull().default('pending'), // pending | delivered | failed | exhausted
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Usage Snapshots
// ---------------------------------------------------------------------------

export const usageSnapshots = pgTable('usage_snapshots', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  sessionsRun: integer('sessions_run').notNull().default(0),
  tasksExecuted: integer('tasks_executed').notNull().default(0),
  tasksSucceeded: integer('tasks_succeeded').notNull().default(0),
  tasksFailed: integer('tasks_failed').notNull().default(0),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  estimatedCostUsd: doublePrecision('estimated_cost_usd').notNull().default(0),
  specsCreated: integer('specs_created').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueDateProject: uniqueIndex('usage_date_project_idx').on(table.projectId, table.date),
}));

// ---------------------------------------------------------------------------
// Git Commits
// ---------------------------------------------------------------------------

export const gitCommits = pgTable('git_commits', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  commitSha: text('commit_sha').notNull(),
  branch: text('branch').notNull(),
  message: text('message').notNull(),
  author: text('author'),
  metadata: jsonb('metadata'),
  committedAt: timestamp('committed_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// API Request Logs
// ---------------------------------------------------------------------------

export const apiRequestLogs = pgTable('api_request_logs', {
  id: serial('id').primaryKey(),
  tokenId: integer('token_id').references(() => agentTokens.id),
  projectId: integer('project_id').references(() => projects.id),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  statusCode: integer('status_code').notNull(),
  durationMs: integer('duration_ms').notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  detail: jsonb('detail'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  projectIdx: index('audit_project_idx').on(table.projectId),
}));

// ---------------------------------------------------------------------------
// Test Results
// ---------------------------------------------------------------------------

export const testResults = pgTable('test_results', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  success: boolean('success').notNull(),
  logs: text('logs'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;
export type ProjectInsert = typeof projects.$inferInsert;
export type ProjectSelect = typeof projects.$inferSelect;
export type ProjectMemberInsert = typeof projectMembers.$inferInsert;
export type ProjectMemberSelect = typeof projectMembers.$inferSelect;
export type InviteInsert = typeof invites.$inferInsert;
export type InviteSelect = typeof invites.$inferSelect;
export type AgentTokenInsert = typeof agentTokens.$inferInsert;
export type AgentTokenSelect = typeof agentTokens.$inferSelect;
export type SpecificationInsert = typeof specifications.$inferInsert;
export type SpecificationSelect = typeof specifications.$inferSelect;
export type SpecVersionInsert = typeof specVersions.$inferInsert;
export type SpecVersionSelect = typeof specVersions.$inferSelect;
export type PlanInsert = typeof plans.$inferInsert;
export type PlanSelect = typeof plans.$inferSelect;
export type PlanReviewInsert = typeof planReviews.$inferInsert;
export type PlanReviewSelect = typeof planReviews.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
export type TaskSelect = typeof tasks.$inferSelect;
export type TaskAttemptInsert = typeof taskAttempts.$inferInsert;
export type TaskAttemptSelect = typeof taskAttempts.$inferSelect;
export type FileChangeInsert = typeof fileChanges.$inferInsert;
export type FileChangeSelect = typeof fileChanges.$inferSelect;
export type AgentSessionInsert = typeof agentSessions.$inferInsert;
export type AgentSessionSelect = typeof agentSessions.$inferSelect;
export type AgentEventInsert = typeof agentEvents.$inferInsert;
export type AgentEventSelect = typeof agentEvents.$inferSelect;
export type AgentLogInsert = typeof agentLogs.$inferInsert;
export type AgentLogSelect = typeof agentLogs.$inferSelect;
export type AgentConfigInsert = typeof agentConfig.$inferInsert;
export type AgentConfigSelect = typeof agentConfig.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;
export type NotificationSelect = typeof notifications.$inferSelect;
export type NotificationPreferenceInsert = typeof notificationPreferences.$inferInsert;
export type NotificationPreferenceSelect = typeof notificationPreferences.$inferSelect;
export type WebhookInsert = typeof webhooks.$inferInsert;
export type WebhookSelect = typeof webhooks.$inferSelect;
export type WebhookDeliveryInsert = typeof webhookDeliveries.$inferInsert;
export type WebhookDeliverySelect = typeof webhookDeliveries.$inferSelect;
export type UsageSnapshotInsert = typeof usageSnapshots.$inferInsert;
export type UsageSnapshotSelect = typeof usageSnapshots.$inferSelect;
export type GitCommitInsert = typeof gitCommits.$inferInsert;
export type GitCommitSelect = typeof gitCommits.$inferSelect;
export type ApiRequestLogInsert = typeof apiRequestLogs.$inferInsert;
export type ApiRequestLogSelect = typeof apiRequestLogs.$inferSelect;
export type AuditLogInsert = typeof auditLog.$inferInsert;
export type AuditLogSelect = typeof auditLog.$inferSelect;
export type TestResultInsert = typeof testResults.$inferInsert;
export type TestResultSelect = typeof testResults.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;
export type SessionSelect = typeof sessions.$inferSelect;
export type AccountInsert = typeof accounts.$inferInsert;
export type AccountSelect = typeof accounts.$inferSelect;
export type VerificationInsert = typeof verifications.$inferInsert;
export type VerificationSelect = typeof verifications.$inferSelect;

// ---------------------------------------------------------------------------
// Enum string literal types (for use in application code)
// ---------------------------------------------------------------------------

export type PlanStatus = typeof planStatusEnum.enumValues[number];
export type SpecStatus = typeof specStatusEnum.enumValues[number];
export type TaskStatus = typeof taskStatusEnum.enumValues[number];
export type SessionStatus = typeof sessionStatusEnum.enumValues[number];
export type ProjectStatus = typeof projectStatusEnum.enumValues[number];
export type LogLevel = typeof logLevelEnum.enumValues[number];
export type UserRole = typeof userRoleEnum.enumValues[number];
export type TaskAttemptStatus = typeof taskAttemptStatusEnum.enumValues[number];
