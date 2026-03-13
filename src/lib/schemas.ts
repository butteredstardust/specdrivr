/**
 * Zod validation schemas for the application
 *
 * These schemas validate API input data before processing.
 * They can be used in API routes, forms, and other input points.
 *
 * Pattern: Define once, reuse everywhere
 * Benefits: Consistent validation, DRY, type-safe with TypeScript
 */

import { z } from 'zod';

/**
 * Task Status Enum
 * Represents the possible states a task can be in
 */
export const taskStatusSchema = z.enum(
  ['todo', 'in_progress', 'done', 'blocked', 'failed', 'skipped'],
  {
    errorMap: () => ({
      message:
        "Status must be one of: 'todo', 'in_progress', 'done', 'blocked', 'failed', or 'skipped'",
    }),
  }
);

/**
 * Recommended Model Enum
 * AI models that can be used for task execution
 */
export const recommendedModelSchema = z.enum(['sonnet', 'opus', 'haiku'], {
  errorMap: () => ({ message: "Recommended model must be one of: 'sonnet', 'opus', or 'haiku'" }),
});

/**
 * Schema for creating a new task
 *
 * Validation rules:
 * - description: Required, max 5000 characters
 * - planId: Optional, must be positive integer
 * - status: Optional, defaults to 'todo'
 * - priority: Optional, defaults to 1, must be 1-10
 * - estimateHours: Optional, must be non-negative
 * - verifyCommand: Optional, max 1000 characters
 * - doneCriteria: Optional, max 2000 characters
 * - recommendedModel: Optional, defaults to 'sonnet'
 * - createdByUserId: Optional, string (nanoid)
 */
export const createTaskSchema = z.object({
  description: z
    .string({
      required_error: 'Task description is required',
      invalid_type_error: 'Description must be a string',
    })
    .min(1, 'Task description cannot be empty')
    .max(5000, 'Task description cannot exceed 5000 characters'),

  planId: z
    .number({
      invalid_type_error: 'Plan ID must be a number',
    })
    .int('Plan ID must be an integer')
    .positive('Plan ID must be a positive number')
    .optional()
    .nullable(),

  status: taskStatusSchema.optional().default('todo'),

  priority: z
    .number({
      invalid_type_error: 'Priority must be a number',
    })
    .int('Priority must be an integer')
    .min(1, 'Priority must be at least 1')
    .max(10, 'Priority cannot exceed 10')
    .optional()
    .default(1),

  estimateHours: z
    .number({
      invalid_type_error: 'Estimate hours must be a number',
    })
    .int('Estimate hours must be an integer')
    .min(0, 'Estimate hours must be non-negative')
    .optional()
    .nullable(),

  verifyCommand: z
    .string({
      invalid_type_error: 'Verify command must be a string',
    })
    .max(1000, 'Verify command cannot exceed 1000 characters')
    .optional()
    .nullable(),

  doneCriteria: z
    .string({
      invalid_type_error: 'Done criteria must be a string',
    })
    .max(2000, 'Done criteria cannot exceed 2000 characters')
    .optional()
    .nullable(),

  recommendedModel: recommendedModelSchema.optional().default('sonnet'),

  createdByUserId: z
    .string({
      invalid_type_error: 'Created by user ID must be a string',
    })
    .optional()
    .nullable(),
});

/**
 * Schema for updating an existing task
 *
 * All fields are optional, but at least one must be provided.
 * Validation rules mirror createTaskSchema where applicable.
 */
export const updateTaskSchema = z
  .object({
    description: z
      .string({
        invalid_type_error: 'Description must be a string',
      })
      .min(1, 'Task description cannot be empty')
      .max(5000, 'Task description cannot exceed 5000 characters')
      .optional(),

    status: taskStatusSchema.optional(),

    priority: z
      .number({
        invalid_type_error: 'Priority must be a number',
      })
      .int('Priority must be an integer')
      .min(1, 'Priority must be at least 1')
      .max(10, 'Priority cannot exceed 10')
      .optional(),

    estimateHours: z
      .number({
        invalid_type_error: 'Estimate hours must be a number',
      })
      .int('Estimate hours must be an integer')
      .min(0, 'Estimate hours must be non-negative')
      .optional()
      .nullable(),

    verifyCommand: z
      .string({
        invalid_type_error: 'Verify command must be a string',
      })
      .max(1000, 'Verify command cannot exceed 1000 characters')
      .optional()
      .nullable(),

    doneCriteria: z
      .string({
        invalid_type_error: 'Done criteria must be a string',
      })
      .max(2000, 'Done criteria cannot exceed 2000 characters')
      .optional()
      .nullable(),

    recommendedModel: recommendedModelSchema.optional(),

    notes: z
      .string({
        invalid_type_error: 'Notes must be a string',
      })
      .max(5000, 'Notes cannot exceed 5000 characters')
      .optional()
      .nullable(),

    completedAt: z
      .date({
        invalid_type_error: 'Completed at must be a valid date',
      })
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field to update is required',
  });

/**
 * Query parameters for GET /api/tasks
 *
 * Supports filtering and pagination
 */
export const taskQuerySchema = z.object({
  planId: z
    .string({
      invalid_type_error: 'Plan ID must be a string',
    })
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: 'Plan ID must be a positive number',
    }),

  status: taskStatusSchema.optional(),

  page: z
    .string({
      invalid_type_error: 'Page must be a string',
    })
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, {
      message: 'Page must be a positive number',
    }),

  limit: z
    .string({
      invalid_type_error: 'Limit must be a string',
    })
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
});

/**
 * Specification Status Enum
 * Represents the possible states a specification can be in
 */
export const specStatusSchema = z.enum(
  ['drafting', 'pending_plan', 'pending_approval', 'executing', 'completed', 'stalled', 'archived'],
  {
    errorMap: () => ({
      message:
        "Status must be one of: 'drafting', 'pending_plan', 'pending_approval', 'executing', 'completed', 'stalled', or 'archived'",
    }),
  }
);

/**
 * Schema for creating a new specification
 */
export const createSpecificationSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  name: z.string().min(1, 'Specification name is required').max(255, 'Specification name too long'),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  markdownContent: z.string().min(1, 'Initial content is required'),
});

/**
 * Schema for updating an existing specification
 */
export const updateSpecificationSchema = z
  .object({
    id: z.number().int().positive('Specification ID is required'),
    name: z.string().min(1, 'Name cannot be empty').max(255, 'Name too long').optional(),
    status: specStatusSchema.optional(),
  })
  .refine(
    (data) => {
      const rest = { ...data } as Record<string, unknown>;
      delete rest.id;
      return Object.keys(rest).some((key) => rest[key] !== undefined);
    },
    { message: 'At least one field to update is required' }
  );

/**
 * Schema for creating a new specification version
 */
export const createSpecVersionSchema = z.object({
  specId: z.number().int().positive('Specification ID is required'),
  markdownContent: z.string().min(1, 'Markdown content is required'),
});

/**
 * Query parameters for GET /api/specs
 */
export const specQuerySchema = z.object({
  projectId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: 'Project ID must be a positive number',
    }),
  status: specStatusSchema.optional(),
});

/**
 * Plan Status Enum
 * Represents the possible states a plan can be in
 */
export const planStatusSchema = z.enum(
  ['pending_approval', 'executing', 'rejected', 'abandoned', 'changes_requested', 'completed'],
  {
    errorMap: () => ({
      message:
        "Status must be one of: 'pending_approval', 'executing', 'rejected', 'abandoned', 'changes_requested', or 'completed'",
    }),
  }
);

/**
 * Schema for approving a plan
 */
export const approvePlanSchema = z.object({
  id: z.number().int().positive('Plan ID is required'),
  notes: z.string().max(2000, 'Notes too long').optional().nullable(),
});

/**
 * Schema for rejecting a plan
 */
export const rejectPlanSchema = z.object({
  id: z.number().int().positive('Plan ID is required'),
  notes: z.string().min(1, 'Notes are required for rejection').max(2000, 'Notes too long'),
});

/**
 * Schema for requesting changes on a plan
 */
export const requestChangesSchema = z.object({
  id: z.number().int().positive('Plan ID is required'),
  notes: z
    .string()
    .min(1, 'Notes are required when requesting changes')
    .max(2000, 'Notes too long'),
});

/**
 * Schema for abandoning a plan
 */
export const abandonPlanSchema = z.object({
  id: z.number().int().positive('Plan ID is required'),
});

/**
 * Schema for unblocking a task
 */
export const unblockTaskSchema = z.object({
  id: z.number().int().positive('Task ID is required'),
  humanContext: z
    .string()
    .min(1, 'Context is required to unblock a task')
    .max(5000, 'Context too long'),
});

/**
 * Schema for manually overriding a task status
 */
export const overrideTaskStatusSchema = z.object({
  id: z.number().int().positive('Task ID is required'),
  status: taskStatusSchema,
  notes: z.string().max(2000, 'Notes too long').optional().nullable(),
});

/**
 * User Role Enum
 * Represents the hierarchical roles in a project
 */
export const userRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer'], {
  errorMap: () => ({ message: "Role must be one of: 'owner', 'admin', 'member', or 'viewer'" }),
});

/**
 * Schema for inviting a new member to a project
 */
export const inviteMemberSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  email: z.string().email('Invalid email address'),
  role: userRoleSchema.default('viewer'),
});

/**
 * Schema for updating a member's role
 */
export const updateMemberRoleSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  role: userRoleSchema,
});

/**
 * Schema for updating agent configuration
 */
export const updateAgentConfigSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  modelId: z.string().min(1, 'Model ID is required').default('claude-sonnet-4-6'),
  planModelId: z.string().min(1, 'Plan model ID is required').default('claude-opus-4-6'),
  maxConcurrentTasks: z.number().int().min(1).max(10).default(3),
  taskTimeoutSeconds: z.number().int().min(30).max(3600).default(300),
  maxRetriesPerTask: z.number().int().min(0).max(5).default(2),
  retryDelaySeconds: z.number().int().min(5).max(300).default(30),
  requireApproval: z.boolean().default(true),
  autoGeneratePlan: z.boolean().default(false),
  branchPrefix: z.string().min(1).max(50).default('daemon'),
  commitMessagePrefix: z.string().min(1).max(50).default('feat'),
  allowedFileGlobs: z.array(z.string()).default([]),
  forbiddenFileGlobs: z.array(z.string()).default([]),
  testCommand: z.string().max(255).optional().nullable(),
  lintCommand: z.string().max(255).optional().nullable(),
  setupCommand: z.string().max(255).optional().nullable(),
  maxDiffSizeKb: z.number().int().min(10).max(5000).default(500),
  prAutoCreate: z.boolean().default(false),
  prTargetBranch: z.string().min(1).max(100).default('main'),
});

/**
 * Schema for creating a GitHub Pull Request
 */
export const createPullRequestSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  sessionId: z.number().int().positive('Session ID is required'),
  title: z.string().min(1, 'PR title is required').max(255),
  body: z.string().max(5000).optional().nullable(),
  baseBranch: z.string().min(1).default('main'),
  headBranch: z.string().min(1),
});

/**
 * Schema for creating a new generic webhook
 */
export const createWebhookSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  url: z.string().url('Invalid webhook URL'),
  secret: z.string().max(255).optional().nullable(),
  events: z.array(z.string()).min(1, 'At least one event subscription is required'),
});

/**
 * Schema for updating an existing webhook
 */
export const updateWebhookSchema = z.object({
  id: z.number().int().positive('Webhook ID is required'),
  url: z.string().url('Invalid webhook URL').optional(),
  secret: z.string().max(255).optional().nullable(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name cannot exceed 255 characters'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
  createdBy: z.string().optional().nullable(),
});

/**
 * Schema for updating an existing project
 */
export const updateProjectSchema = z
  .object({
    id: z.number().int().positive('Valid project ID is required'),
    name: z
      .string()
      .min(1, 'Project name cannot be empty')
      .max(255, 'Project name too long')
      .optional(),
    description: z.string().max(1000, 'Description too long').optional().nullable(),
  })
  .refine(
    (data) => {
      const rest = { ...data } as Record<string, unknown>;
      delete rest.id;
      return Object.keys(rest).some((key) => rest[key] !== undefined);
    },
    { message: 'At least one field to update is required' }
  );
