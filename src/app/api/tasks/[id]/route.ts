import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { updateTaskSchema } from '@/lib/schemas';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/{id}
 *
 * Gets a single task by ID.
 *
 * Path parameters: id (number)
 *
 * Response format:
 * {
 *   success: true,
 *   data: Task
 * }
 *
 * @example
 * // Get task with ID 123
 * GET /api/tasks/123
 *
 * // Handle 404 error
 * const response = await fetch('/api/tasks/999');
 * const result = await response.json();
 * if (!result.success) {
 *   console.error(result.error.message); // "Task with ID 999 not found"
 * }
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Unwrap the params promise (Next.js 14+ pattern)
    const { id } = await params;

    // Validate ID is a positive integer
    const taskId = parseInt(id, 10);
    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid task ID - must be a positive number' }),
        { status: 400 }
      );
    }

    // Fetch task from database
    const task = await taskRepository.getById(taskId);

    // Handle not found case
    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    // Handle errors including NotFoundError
    return handleApiError(error);
  }
}

/**
 * PATCH /api/tasks/{id}
 *
 * Updates a single task.
 * Only provided fields will be updated.
 *
 * Path parameters: id (number)
 *
 * Request body:
 * {
 *   description?: string (max 5000 chars)
 *   status?: TaskStatus
 *   priority?: number (1-10)
 *   estimateHours?: number | null (>= 0)
 *   verifyCommand?: string | null (max 1000 chars)
 *   doneCriteria?: string | null (max 2000 chars)
 *   recommendedModel?: 'sonnet' | 'opus' | 'haiku'
 *   notes?: string | null (max 5000 chars)
 * }
 *
 * Response format:
 * {
 *   success: true,
 *   data: Task
 * }
 *
 * @example
 * // Update task status
 * PATCH /api/tasks/123
 * { "status": "in_progress" }
 *
 * // Update multiple fields
 * PATCH /api/tasks/123
 * {
 *   "priority": 8,
 *   "notes": "Making good progress"
 * }
 *
 * // Returns 400 if no fields provided
 * PATCH /api/tasks/123
 * {} // Error: "No fields to update"
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Unwrap params promise
    const { id } = await params;

    // Validate ID
    const taskId = parseInt(id, 10);
    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid task ID - must be a positive number' }),
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate update data
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        formatErrorResponse({
          message: 'Validation failed',
          details: parsed.error.errors,
        }),
        { status: 400 }
      );
    }

    // Find and update the task
    const task = await taskRepository.update(taskId, parsed.data);

    // Return updated task
    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    // Handle validation, not found, and database errors
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tasks/{id}
 *
 * Deletes a single task.
 * This operation cannot be undone.
 *
 * Path parameters: id (number)
 *
 * Response format:
 * {
 *   success: true
 * }
 *
 * @example
 * // Delete task with ID 123
 * DELETE /api/tasks/123
 *
 * // Returns 404 if task not found
 * DELETE /api/tasks/999
 * // Response: { success: false, error: { message: "Task with ID 999 not found", code: "NOT_FOUND" } }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Unwrap params promise
    const { id } = await params;

    // Validate ID
    const taskId = parseInt(id, 10);
    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid task ID - must be a positive number' }),
        { status: 400 }
      );
    }

    // Delete the task
    await taskRepository.delete(taskId);

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    // Handle validation and not found errors
    return handleApiError(error);
  }
}
