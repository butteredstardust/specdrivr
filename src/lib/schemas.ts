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
export const taskStatusSchema = z.enum([
  'todo',
  'in_progress',
  'done',
  'blocked',
  'failed',
  'skipped'
], {
  errorMap: () => ({ message: "Status must be one of: 'todo', 'in_progress', 'done', 'blocked', 'failed', or 'skipped'" })
});

/**
 * Recommended Model Enum
 * AI models that can be used for task execution
 */
export const recommendedModelSchema = z.enum(['sonnet', 'opus', 'haiku'], {
  errorMap: () => ({ message: "Recommended model must be one of: 'sonnet', 'opus', or 'haiku'" })
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
 * - createdByUserId: Optional, must be positive integer
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

  status: taskStatusSchema
    .optional()
    .default('todo'),

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

  recommendedModel: recommendedModelSchema
    .optional()
    .default('sonnet'),

  createdByUserId: z
    .number({
      invalid_type_error: 'Created by user ID must be a number',
    })
    .int('Created by user ID must be an integer')
    .positive('Created by user ID must be a positive number')
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
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field to update is required' }
  );

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

// Additional schemas can be added here for other resources

/**
 * Schema for creating a new project
 */
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional().nullable(),
  createdBy: z.number().optional().nullable(),
});

/**
 * Schema for updating an existing project
 */
export const updateProjectSchema = z.object({
  id: z.number().int().positive('Valid project ID is required'),
  name: z.string().min(1, 'Project name cannot be empty').max(255, 'Project name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
}).refine(
  (data) => {
    const { id, ...rest } = data;
    return Object.keys(rest).some(key => rest[key as keyof typeof rest] !== undefined);
  },
  { message: 'At least one field to update is required' }
);
