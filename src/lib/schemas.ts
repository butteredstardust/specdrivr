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
      required_error: 'Plan ID is required',
      invalid_type_error: 'Plan ID must be a number',
    })
    .int('Plan ID must be an integer')
    .positive('Plan ID must be a positive number'),

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

  specId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: 'Spec ID must be a positive number',
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
 * Client-side shape of the invite form. The project is taken from the route the
 * form is rendered under, so it is not a field the user can fill in.
 */
export const inviteMemberFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  role: userRoleSchema,
});

export type InviteMemberFormData = z.infer<typeof inviteMemberFormSchema>;

/**
 * Schema for updating a member's role
 */
export const updateMemberRoleSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  role: userRoleSchema,
});

export const agentConfigFormSchema = z.object({
  modelId: z.string().min(1, 'Execution model is required'),
  planModelId: z.string().min(1, 'Plan model is required'),
  maxConcurrentTasks: z.number().int().min(1).max(10),
  taskTimeoutSeconds: z.number().int().min(30).max(3600),
  maxRetriesPerTask: z.number().int().min(0).max(5),
  retryDelaySeconds: z.number().int(),
  requireApproval: z.boolean(),
  autoGeneratePlan: z.boolean(),
  branchPrefix: z.string().min(1).max(50),
  commitMessagePrefix: z.string().min(1).max(50),
  allowedFileGlobs: z.array(z.string()),
  forbiddenFileGlobs: z.array(z.string()),
  testCommand: z.string().max(255).nullable(),
  lintCommand: z.string().max(255).nullable(),
  setupCommand: z.string().max(255).nullable(),
  maxDiffSizeKb: z.number().int().min(10).max(5000),
  prAutoCreate: z.boolean(),
  prTargetBranch: z.string().min(1).max(100),
  geminiApiKey: z.string().max(255).nullable().optional(),
  geminiModel: z.string().min(1).max(100),
  claudeApiKey: z.string().max(255).nullable().optional(),
  backend: z.enum(['gemini', 'claude']),
});

export type AgentConfigFormData = z.infer<typeof agentConfigFormSchema>;

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
  geminiApiKey: z.string().nullable().optional(),
  geminiModel: z.string().default('gemini-2.0-flash'),
  claudeApiKey: z.string().nullable().optional(),
  backend: z.string().default('gemini'),
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

/**
 * Client-side shape of the webhook dialog. `projectId` comes from the route and
 * `secret` is an empty string rather than null because it is bound to an input.
 */
export const webhookFormSchema = z.object({
  url: z.string().min(1, 'Endpoint URL is required').url('Invalid webhook URL'),
  secret: z.string().max(255, 'Secret cannot exceed 255 characters'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
});

export type WebhookFormValues = z.infer<typeof webhookFormSchema>;

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
    repositoryUrl: z.string().url('Invalid repository URL').max(1000).optional().nullable(),
    repositoryBranch: z.string().max(255, 'Branch name too long').optional().nullable(),
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
 * Client-side shape of the "new project" dialog. `createdBy` is taken from the
 * session server-side, so it is not part of the form.
 */
export const createProjectFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters'),
  githubRepo: z.string().max(255, 'Repository cannot exceed 255 characters'),
});

export type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;

/**
 * Client-side shape of the project settings form. The id travels in the URL, and
 * every field is a controlled string because empty inputs are '' rather than
 * null — the submit handler maps '' back to null for the API.
 */
export const projectSettingsFormSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name too long'),
  description: z.string().max(1000, 'Description too long'),
  repositoryUrl: z
    .string()
    .max(1000, 'Repository URL too long')
    .refine((v) => v === '' || z.string().url().safeParse(v).success, 'Invalid repository URL'),
  repositoryBranch: z.string().max(255, 'Branch name too long'),
});

export type ProjectSettingsFormValues = z.infer<typeof projectSettingsFormSchema>;

/**
 * Schema for user login
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Schema for forgot password request
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Schema for password reset
 */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * Client-side shape of the invite acceptance form. The token comes from the URL
 * and the email is fixed by the invite, so neither is user-editable.
 * Bounds match `/api/v1/auth/accept-invite`.
 */
export const acceptInviteFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type AcceptInviteFormValues = z.infer<typeof acceptInviteFormSchema>;

/**
 * Client-side shape of the change-password form. The 12-character floor matches
 * `/api/v1/users/me/password`; confirmation is client-only and never sent.
 */
export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(12, 'New password must be at least 12 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

/**
 * Notifications & Preferences Schemas
 */
export const updateNotificationPreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      eventType: z.string().min(1),
      emailEnabled: z.boolean(),
      inAppEnabled: z.boolean(),
    })
  ),
});

export const notificationQuerySchema = z.object({
  projectId: z.coerce.number().positive().optional(),
  unreadOnly: z.coerce.boolean().optional(),
  type: z.string().optional(),
  limit: z.coerce.number().positive().max(100).optional().default(50),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

/**
 * Agent Token Schemas
 */
export const createAgentTokenSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  name: z.string().min(1, 'Token name is required').max(100, 'Token name too long'),
});

export const revokeAgentTokenSchema = z.object({
  id: z.number().int().positive('Token ID is required'),
});

/**
 * Audit Log & Usage Snapshots Query Schemas
 */
export const auditLogQuerySchema = z.object({
  projectId: z.coerce.number().positive('Project ID is required'),
  search: z.string().optional(),
  actor: z.string().optional(),
  action: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().positive().max(100).optional().default(50),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

export const usageSnapshotsQuerySchema = z.object({
  projectId: z.coerce.number().positive('Project ID is required'),
  days: z.coerce.number().positive().max(365).optional().default(30),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(50),
});

/**
 * Orchestration & Observability V2 Schemas
 */
export const agentSessionQuerySchema = z.object({
  projectId: z.coerce.number().positive(),
  status: z.enum(['running', 'paused', 'completed', 'failed', 'cancelled']).optional(),
  limit: z.coerce.number().positive().max(100).optional().default(50),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

export const agentLogQuerySchema = z.object({
  sessionId: z.coerce.number().positive().optional(),
  taskId: z.coerce.number().positive().optional(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  limit: z.coerce.number().positive().max(1000).optional().default(100),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

export const fileChangesQuerySchema = z.object({
  taskId: z.coerce.number().positive('Task ID is required'),
});

export const planJobQuerySchema = z.object({
  projectId: z.coerce.number().positive(),
  status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
  limit: z.coerce.number().positive().max(100).optional().default(50),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

export const testResultUploadSchema = z.object({
  taskId: z.coerce.number().positive('Task ID is required'),
  success: z.boolean(),
  logs: z.string().optional(),
});

export const webhookDeliveryQuerySchema = z.object({
  webhookId: z.coerce.number().positive('Webhook ID is required'),
  limit: z.coerce.number().positive().max(100).optional().default(50),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

/**
 * Phase 3 V3 Schemas (Git Commits, API Logs, File Changes)
 */

export const gitCommitsQuerySchema = z.object({
  projectId: z.coerce.number().positive(),
  branch: z.string().optional(),
  limit: z.coerce.number().positive().max(100).optional().default(50),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

export const insertGitCommitSchema = z.object({
  projectId: z.coerce.number().positive(),
  taskId: z.coerce.number().positive().optional().nullable(),
  commitSha: z.string().min(1, 'SHA is required'),
  message: z.string().min(1, 'Commit message is required'),
  branch: z.string().min(1, 'Branch name is required'),
  author: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const apiLogsQuerySchema = z.object({
  projectId: z.coerce.number().positive(),
  endpoint: z.string().optional(),
  statusCode: z.coerce.number().optional(),
  limit: z.coerce.number().positive().max(1000).optional().default(100),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

export const proposeTaskChangesSchema = z.object({
  taskId: z.coerce.number().positive(),
  attemptId: z.coerce.number().positive().optional().nullable(),
  changes: z
    .array(
      z.object({
        filePath: z.string().min(1),
        changeType: z.enum(['added', 'modified', 'deleted']),
        diff: z.string().optional().nullable(),
        isBinary: z.boolean().optional().default(false),
        language: z.string().optional().nullable(),
        sizeBytes: z.coerce.number().optional().nullable(),
        linesAdded: z.coerce.number().optional().default(0),
        linesRemoved: z.coerce.number().optional().default(0),
        previousHash: z.string().optional().nullable(),
        newHash: z.string().optional().nullable(),
      })
    )
    .min(1, 'At least one file change must be proposed'),
});
