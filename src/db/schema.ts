import { pgTable, serial, text, timestamp, boolean, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";

// Status enums
export const planStatusEnum = pgEnum('plan_status', ['draft', 'active', 'completed', 'archived']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'blocked']);
export const logLevelEnum = pgEnum('log_level', ['debug', 'info', 'warn', 'error']);
export const agentStatusEnum = pgEnum('agent_status', ['idle', 'running', 'paused', 'stopped', 'error']);

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  mission: text('mission'),
  description: text('description'),
  constitution: text('constitution'), // markdown content
  techStack: jsonb('tech_stack'),
  basePath: text('base_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  // Agent control fields
  agentStatus: agentStatusEnum('agent_status').notNull().default('idle'),
  agentStartedAt: timestamp('agent_started_at', { withTimezone: true }),
  agentStoppedAt: timestamp('agent_stopped_at', { withTimezone: true }),
});

// Specifications table
export const specifications = pgTable('specifications', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(), // markdown specification
  version: text('version').notNull().default('1.0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Plans table
export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  specId: integer('spec_id').notNull().references(() => specifications.id, { onDelete: 'cascade' }),
  architectureDecisions: jsonb('architecture_decisions'),
  status: planStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
});

// Test_Results table
export const testResults = pgTable('test_results', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  success: boolean('success').notNull(),
  logs: text('logs'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
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

// Enum types for use in applications
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type AgentStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error';
