import { pgTable, serial, text, timestamp, boolean, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";

// Status enums
export const planStatusEnum = pgEnum('plan_status', ['draft', 'active', 'completed', 'archived']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'archived']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'blocked', 'paused', 'skipped']);
export const logLevelEnum = pgEnum('log_level', ['debug', 'info', 'warn', 'error']);
export const agentStatusEnum = pgEnum('agent_status', ['idle', 'running', 'paused', 'stopped', 'error']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'developer', 'viewer']);

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  mission: text('mission'),
  description: text('description'),
  constitution: text('constitution'), // markdown content
  techStack: jsonb('tech_stack'),
  basePath: text('base_path'),
  gitBranch: text('git_branch').default('main'),
  gitStrategy: text('git_strategy'), // e.g., 'merge', 'rebase', 'squash'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  // Agent control fields
  agentStatus: agentStatusEnum('agent_status').notNull().default('idle'),
  agentStartedAt: timestamp('agent_started_at', { withTimezone: true }),
  agentStoppedAt: timestamp('agent_stopped_at', { withTimezone: true }),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
  // Project status
  status: projectStatusEnum('status').notNull().default('active'),
});

// Specifications table
export const specifications = pgTable('specifications', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(), // markdown specification
  version: text('version').notNull().default('1.0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
});

// Plans table
export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  specId: integer('spec_id').notNull().references(() => specifications.id, { onDelete: 'cascade' }),
  architectureDecisions: jsonb('architecture_decisions'),
  status: planStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  status: taskStatusEnum('status').notNull().default('todo'),
  description: text('description'),
  filesInvolved: jsonb('files_involved'), // array of file paths
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
  createdByUserId: integer('created_by_user_id').references(() => users.id),
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

// Agent_Logs table
export const agentLogs = pgTable('agent_logs', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  projectId: integer('project_id'), // denormalized for faster filtering
  level: logLevelEnum('level').notNull().default('info'),
  message: text('message').notNull(),
  context: jsonb('context'), // Additional context like file, function, etc.
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
});

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  avatarId: integer('avatar_id').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  isAdmin: boolean('is_admin').notNull().default(false),
  role: userRoleEnum('role').notNull().default('viewer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

// Git Commits table
export const gitCommits = pgTable('git_commits', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sha: text('sha').notNull().unique(),
  branch: text('branch').notNull(),
  message: text('message').notNull(),
  authorName: text('author_name'),
  authorEmail: text('author_email'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  planId: integer('plan_id').references(() => plans.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
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

// Enum types for use in applications
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'paused' | 'skipped';
export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type AgentStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error';
export type UserRole = 'admin' | 'developer' | 'viewer';
