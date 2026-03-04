import { z } from 'zod';
import { taskStatusEnum, planStatusEnum, logLevelEnum } from '@/db/schema';

// Project schemas
export const ProjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  constitution: z.string().nullable(),
  techStack: z.record(z.string(), z.unknown()).nullable(),
  basePath: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  constitution: z.string().optional(),
  techStack: z.record(z.string(), z.unknown()).optional(),
  basePath: z.string().optional(),
});

// Specification schemas
export const SpecificationSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  content: z.string(),
  version: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const CreateSpecificationSchema = z.object({
  projectId: z.number(),
  content: z.string(),
  version: z.string().optional().default('1.0'),
});

// Plan schemas
export const PlanSchema = z.object({
  id: z.number(),
  specId: z.number(),
  architectureDecisions: z.record(z.string(), z.unknown()).nullable(),
  status: z.enum(['draft', 'active', 'completed', 'archived']),
  createdAt: z.date(),
});

export const CreatePlanSchema = z.object({
  specId: z.number(),
  architectureDecisions: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional().default('draft'),
});

// Task schemas
export const TaskSchema = z.object({
  id: z.number(),
  planId: z.number(),
  status: z.enum(['todo', 'in_progress', 'done', 'blocked']),
  description: z.string().nullable(),
  filesInvolved: z.array(z.string()).nullable(),
  priority: z.number(),
  dependencyTaskId: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateTaskSchema = z.object({
  planId: z.number(),
  description: z.string().optional(),
  filesInvolved: z.array(z.string()).optional(),
  priority: z.number().optional().default(1),
  dependencyTaskId: z.number().optional().nullable(),
});

export const UpdateTaskSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
  filesInvolved: z.array(z.string()).optional(),
  priority: z.number().optional(),
});

// Test Result schemas
export const TestResultSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  success: z.boolean(),
  logs: z.string().nullable(),
  timestamp: z.date(),
});

export const CreateTestResultSchema = z.object({
  taskId: z.number(),
  success: z.boolean(),
  logs: z.string().optional(),
});

// Agent Log schemas
export const AgentLogSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  timestamp: z.date(),
});

export const CreateAgentLogSchema = z.object({
  taskId: z.number(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
  message: z.string(),
});

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Context schemas for mission endpoint
export const MissionResponseSchema = z.object({
  project: ProjectSchema,
  specification: SpecificationSchema.nullable(),
  plan: PlanSchema.nullable(),
  nextTask: TaskSchema.nullable(),
  context: z.object({
    hasSpec: z.boolean(),
    hasPlan: z.boolean(),
    pendingTasks: z.number(),
    completedTasks: z.number(),
  }),
});

// Authentication schemas
export const AgentTokenSchema = z.object({
  headers: z.object({
    'x-agent-token': z.string().min(1),
  }),
});
