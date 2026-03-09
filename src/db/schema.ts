import crypto from 'crypto';
import { pgTable, serial, text, timestamp, boolean, jsonb, integer, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";

// Status enums
export const planStatusEnum = pgEnum('plan_status', ['draft', 'active', 'completed', 'archived', 'pending_approval']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'archived']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'blocked', 'paused', 'skipped']);
export const specStatusEnum = pgEnum('spec_status', ['draft', 'active', 'completed', 'stalled']);
export const logLevelEnum = pgEnum('log_level', ['debug', 'info', 'warn', 'error']);
export const agentStatusEnum = pgEnum('agent_status', ['idle', 'running', 'paused', 'stopped', 'error']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'developer', 'viewer']);


// Invites table
export const invites = pgTable('invites', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: userRoleEnum('role').notNull().default('viewer'),
  invitedBy: integer('invited_by').notNull().references(() => users.id),
  resendCount: integer('resend_count').notNull().default(0),
  lastResentAt: timestamp('last_resent_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  avatarColor: text('avatar_color'),
  isDemo: boolean('is_demo').notNull().default(false),
  mission: text('mission'),
  description: text('description'),
  constitution: text('constitution'), // markdown content
  techStack: jsonb('tech_stack'),
  basePath: text('base_path'),
  gitBranch: text('git_branch').default('main'),
  gitStrategy: text('git_strategy'), // e.g., 'merge', 'rebase', 'squash'
  agentLastHeartbeatAt: timestamp('agent_last_heartbeat_at', { withTimezone: true }),
  state: jsonb('state').default({
    decisions: [],
    blockers: [],
    last_position: null,
    context_summary: null
  }),
  gitConfig: jsonb('git_config').default({
    enabled: false,
    provider: 'github',
    repo_url: null,
    default_branch: 'main',
    branching_strategy: 'none',
    phase_branch_template: 'specdriver/phase-{phase_id}-{slug}',
    milestone_branch_template: 'specdriver/{milestone}-{slug}',
    webhook_secret: null,
    commit_message_template: '{type}({plan_id}-{task_id}): {description}'
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  // Agent control fields
  agentStatus: agentStatusEnum('agent_status').notNull().default('idle'),
  agentStartedAt: timestamp('agent_started_at', { withTimezone: true }),
  agentStoppedAt: timestamp('agent_stopped_at', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
  // Project status
  status: projectStatusEnum('status').notNull().default('active'),
}, (table) => {
  return {
    slugIdx: uniqueIndex('project_slug_idx').on(table.slug),
  };
});

// Specifications table
export const specifications = pgTable('specifications', {
  status: specStatusEnum('status').notNull().default('draft'),
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(), // markdown specification
  version: text('version').notNull().default('1.0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
});

// Plans table
export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  specId: integer('spec_id').notNull().references(() => specifications.id, { onDelete: 'cascade' }),
  architectureDecisions: jsonb('architecture_decisions'),
  intent: text('intent'),
  phaseLabel: text('phase_label'),
  status: planStatusEnum('status').notNull().default('draft'),
  generationDurationMs: integer('generation_duration_ms'),
  generationError: text('generation_error'),
  modelVersion: text('model_version'),
  taskCount: integer('task_count').default(0),
  totalEstimatedMinutes: integer('total_estimated_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').references(() => plans.id, { onDelete: 'cascade' }),
  status: taskStatusEnum('status').notNull().default('todo'),
  description: text('description'),
  filesInvolved: jsonb('files_involved'), // array of file paths
  estimatedMinutes: integer('estimated_minutes'),
  actualDurationMs: integer('actual_duration_ms'),
  gitBranch: text('git_branch'),
  gitCommitHash: text('git_commit_hash'),
  expectedFiles: jsonb('expected_files'),
  agentVersion: text('agent_version'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  totalCostUsd: integer('total_cost_usd'),
  blockedReason: text('blocked_reason'),
  priority: integer('priority').notNull().default(1),
  // dependencyTaskId: integer('dependency_task_id').references(() => tasks.id), // Circular reference
  dependencyTaskId: integer('dependency_task_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  // Agent control fields
  retryCount: integer('retry_count').notNull().default(0),
  notes: text('notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  // Task verification fields
  estimateHours: integer('estimate_hours'),
  verifyCommand: text('verify_command'),
  doneCriteria: text('done_criteria'),
  resumeContext: jsonb('resume_context'),
  recommendedModel: text('recommended_model').default('sonnet'),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
});


// Task Attempts table
export const taskAttempts = pgTable('task_attempts', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  seq: integer('seq').notNull(),
  logLines: jsonb('log_lines'), // Make sure this is parameterized properly in drizzle
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  success: boolean('success'),
});

// Test_Results table
export const testResults = pgTable('test_results', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  success: boolean('success').notNull(),
  logs: text('logs'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
});


// File Changes table
export const fileChanges = pgTable('file_changes', {
  id: serial('id').primaryKey(),
  attemptId: integer('attempt_id').notNull().references(() => taskAttempts.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  diff: text('diff'),
  action: text('action').notNull(), // 'added', 'modified', 'deleted'
});

// Agent_Logs table
export const agentLogs = pgTable('agent_logs', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  projectId: integer('project_id'), // denormalized for faster filtering
  level: logLevelEnum('level').notNull().default('info'),
  isInternal: boolean('is_internal').default(false),
  message: text('message').notNull(),
  context: jsonb('context'), // Additional context like file, function, etc.
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
});


// Agent Sessions table
export const agentSessions = pgTable('agent_sessions', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  planId: integer('plan_id').references(() => plans.id),
  gitBranch: text('git_branch'),
  promptTokens: integer('prompt_tokens').default(0),
  completionTokens: integer('completion_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  status: agentStatusEnum('status').notNull().default('running'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  error: text('error'),
});

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  timezone: text('timezone'),
  locale: text('locale').default('en'),
  onboardingStep: integer('onboarding_step').default(0),
  avatarId: integer('avatar_id').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  isAdmin: boolean('is_admin').notNull().default(false),
  role: userRoleEnum('role').notNull().default('viewer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});


// Agent Config table
export const agentConfig = pgTable('agent_config', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  fileGlobBoundaries: jsonb('file_glob_boundaries').default([]),
  model: text('model').notNull().default('sonnet'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Git Commits table
export const gitCommits = pgTable('git_commits', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  commitSha: text('commit_sha').notNull(),
  branch: text('branch').notNull(),
  message: text('message').notNull(),
  author: text('author'),
  metadata: jsonb('metadata'),
  committedAt: timestamp('committed_at', { withTimezone: true }).notNull().defaultNow(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  planId: integer('plan_id').references(() => plans.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
});


// Webhook Deliveries table
export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  payload: jsonb('payload').notNull(),
  url: text('url').notNull(),
  status: text('status').notNull(),
  statusCode: integer('status_code'),
  response: text('response'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
});

// Agent Tokens table
export const agentTokens = pgTable('agent_tokens', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  preferredModel: text('preferred_model').default('sonnet'),
});


// Usage Snapshots table
export const usageSnapshots = pgTable('usage_snapshots', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  totalTokens: integer('total_tokens').notNull().default(0),
  totalCostUsd: integer('total_cost_usd').notNull().default(0),
  taskCount: integer('task_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    uniqueDateProject: uniqueIndex('usage_date_project_idx').on(table.projectId, table.date)
  };
});

// API Request Logs table
export const apiRequestLogs = pgTable('api_request_logs', {
  id: serial('id').primaryKey(),
  tokenId: integer('token_id').references(() => agentTokens.id),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  statusCode: integer('status_code').notNull(),
  durationMs: integer('duration_ms').notNull(),
  projectId: integer('project_id').references(() => projects.id),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
});


// Audit Log table
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Types for insertion
export type ProjectInsert = typeof projects.$inferInsert;
export type ProjectSelect = typeof projects.$inferSelect;
export type SpecificationInsert = typeof specifications.$inferInsert;
export type SpecificationSelect = typeof specifications.$inferSelect;
export type PlanInsert = typeof plans.$inferInsert;
export type PlanSelect = typeof plans.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
export type TaskSelect = typeof tasks.$inferSelect;
export type TestResultInsert = typeof testResults.$inferInsert;
export type TestResultSelect = typeof testResults.$inferSelect;
export type AgentLogInsert = typeof agentLogs.$inferInsert;
export type AgentLogSelect = typeof agentLogs.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;
export type GitCommitInsert = typeof gitCommits.$inferInsert;
export type GitCommitSelect = typeof gitCommits.$inferSelect;
export type AgentTokenInsert = typeof agentTokens.$inferInsert;
export type AgentTokenSelect = typeof agentTokens.$inferSelect;
export type ApiRequestLogInsert = typeof apiRequestLogs.$inferInsert;
export type ApiRequestLogSelect = typeof apiRequestLogs.$inferSelect;

// Enum types for use in applications
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'paused' | 'skipped';
export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type AgentStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error';
export type UserRole = 'admin' | 'developer' | 'viewer';

export type InviteInsert = typeof invites.$inferInsert;
export type InviteSelect = typeof invites.$inferSelect;
export type TaskAttemptInsert = typeof taskAttempts.$inferInsert;
export type TaskAttemptSelect = typeof taskAttempts.$inferSelect;
export type FileChangeInsert = typeof fileChanges.$inferInsert;
export type FileChangeSelect = typeof fileChanges.$inferSelect;
export type AgentSessionInsert = typeof agentSessions.$inferInsert;
export type AgentSessionSelect = typeof agentSessions.$inferSelect;
export type AgentConfigInsert = typeof agentConfig.$inferInsert;
export type AgentConfigSelect = typeof agentConfig.$inferSelect;
export type WebhookDeliveryInsert = typeof webhookDeliveries.$inferInsert;
export type WebhookDeliverySelect = typeof webhookDeliveries.$inferSelect;
export type UsageSnapshotInsert = typeof usageSnapshots.$inferInsert;
export type UsageSnapshotSelect = typeof usageSnapshots.$inferSelect;
export type AuditLogInsert = typeof auditLog.$inferInsert;
export type AuditLogSelect = typeof auditLog.$inferSelect;

// --- Added tables for full API support ---

// Project Members table
export const projectMembers = pgTable('project_members', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: userRoleEnum('role').notNull().default('viewer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    uniqueProjectUser: uniqueIndex('project_user_idx').on(table.projectId, table.userId)
  };
});

// Specification Versions table
export const specVersions = pgTable('spec_versions', {
  id: serial('id').primaryKey(),
  specId: integer('spec_id').notNull().references(() => specifications.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
}, (table) => {
  return {
    uniqueSpecVersion: uniqueIndex('spec_version_idx').on(table.specId, table.versionNumber)
  };
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  link: text('link'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Webhooks table
export const webhooks = pgTable('webhooks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  secret: text('secret'),
  events: jsonb('events').notNull().default(['*']),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProjectMemberInsert = typeof projectMembers.$inferInsert;
export type ProjectMemberSelect = typeof projectMembers.$inferSelect;
export type SpecVersionInsert = typeof specVersions.$inferInsert;
export type SpecVersionSelect = typeof specVersions.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;
export type NotificationSelect = typeof notifications.$inferSelect;
export type WebhookInsert = typeof webhooks.$inferInsert;
export type WebhookSelect = typeof webhooks.$inferSelect;
