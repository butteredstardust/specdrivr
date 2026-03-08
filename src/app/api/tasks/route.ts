import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { taskQuerySchema, createTaskSchema } from '@/lib/schemas';

/**
 * Task API Routes
 *
 * This file demonstrates API route patterns using centralized schemas from @/lib/schemas.
 * Alternative pattern: Define schemas inline (see src/app/api/projects/route.ts)
 *
 * Centralized schemas benefits:
 * - Reusable across multiple routes
 * - Single source of truth
 * - Consistent validation
 *
 * Inline schemas benefits:
 * - Colocated with route logic
 * - Simpler for single-use schemas
 */

/**
 * GET /api/tasks
 *
 * Query Parameters:
 * - planId (optional): Filter by plan ID
 * - status (optional): Filter by status
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Items per page (default: 50, max: 100)
 *
 * Response format:
 * {
 *   success: true,
 *   data: Task[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     pages: number
 *   }
 * }
 *
 * @example
 * // Get all tasks
 * GET /api/tasks
 *
 * // Get tasks for a plan
 * GET /api/tasks?planId=1
 *
 * // Get tasks with pagination
 * GET /api/tasks?page=2&limit=25
 *
 * // Filter by status
 * GET /api/tasks?status=in_progress
 */
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const rawParams = {
      planId: searchParams.get('planId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    };

    // Validate query parameters
    const parsed = taskQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        formatErrorResponse({
          message: 'Invalid query parameters',
          details: parsed.error.errors,
        }),
        { status: 400 }
      );
    }

    const { planId, status, page, limit } = parsed.data;

    // Fetch tasks based on parameters
    let taskList: any[];
    let totalCount: number;

    if (planId !== undefined) {
      // Filter by plan ID
      taskList = await taskRepository.getByPlanId(planId);
      totalCount = taskList.length;
    } else if (status !== undefined) {
      // Filter by status
      taskList = await taskRepository.getByStatus(status);
      totalCount = taskList.length;
    } else {
      // Get all tasks
      taskList = await taskRepository.getAll();
      totalCount = taskList.length;
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedTasks = taskList.slice(startIndex, startIndex + limit);

    // Return successful response
    return NextResponse.json({
      success: true,
      data: paginatedTasks,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    // Handle all errors consistently
    return handleApiError(error);
  }
}

/**
 * POST /api/tasks
 *
 * Creates a new task with the provided data.
 *
 * Request body:
 * {
 *   description: string (required, max 5000 chars)
 *   planId?: number | null
 *   status?: 'todo' | 'in_progress' | 'done' | 'blocked' | 'paused' | 'skipped' (default: 'todo')
 *   priority?: number (1-10, default: 1)
 *   estimateHours?: number | null (must be >= 0)
 *   verifyCommand?: string | null (max 1000 chars)
 *   doneCriteria?: string | null (max 2000 chars)
 *   recommendedModel?: 'sonnet' | 'opus' | 'haiku' (default: 'sonnet')
 *   createdByUserId?: number | null
 * }
 *
 * Response format:
 * {
 *   success: true,
 *   data: Task
 * }
 *
 * @example
 * // Create a simple task
 * POST /api/tasks
 * { "description": "Implement authentication" }
 *
 * // Create a detailed task
 * POST /api/tasks
 * {
 *   "description": "Implement user authentication",
 *   "planId": 1,
 *   "priority": 5,
 *   "estimateHours": 8,
 *   "doneCriteria": "Users can register and login"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate body against schema
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        formatErrorResponse({
          message: 'Validation failed',
          details: parsed.error.errors,
        }),
        { status: 400 }
      );
    }

    // Create task using validated data
    const task = await taskRepository.create(parsed.data);

    // Return successful response with 201 status
    return NextResponse.json(
      {
        success: true,
        data: task,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation and database errors
    return handleApiError(error);
  }
}

/**
 * PATCH /api/tasks
 *
 * Bulk update multiple tasks.
 * Takes an array of task updates with IDs.
 *
 * Request body:
 * [
 *   { id: number, ...TaskUpdateData },
 *   ...
 * ]
 *
 * Response format:
 * {
 *   success: true,
 *   data: Array<{id, success, data?|error?}>
 * }
 *
 * @example
 * // Bulk update tasks
 * PATCH /api/tasks
 * [
 *   { "id": 1, "status": "in_progress" },
 *   { "id": 2, "priority": 5, "notes": "Updated priority" }
 * ]
 */
export async function PATCH(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate that body is an array
    if (!Array.isArray(body)) {
      return NextResponse.json(
        formatErrorResponse({
          message: 'Request body must be an array of task updates',
        }),
        { status: 400 }
      );
    }

    // Process each update in parallel
    const results = await Promise.all(
      body.map(async (taskUpdate) => {
        try {
          // Validate required ID field
          const { id, ...updates } = taskUpdate;
          if (!id || typeof id !== 'number') {
            return {
              id: taskUpdate.id ?? 'unknown',
              success: false,
              error: 'Invalid task ID - must be a number',
            };
          }

          // Attempt update
          const updatedTask = await taskRepository.update(id, updates);

          return {
            id,
            success: true,
            data: updatedTask,
          };
        } catch (error: unknown) {
          // Individual task errors don't fail the entire operation
          return {
            id: taskUpdate.id ?? 'unknown',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          };
        }
      })
    );

    // Return results of bulk operation
    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    // Handle unexpected errors
    return handleApiError(error);
  }
}
