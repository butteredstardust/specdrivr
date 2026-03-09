import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tasks/{id}/retry
 *
 * Increments the retry count for a task.
 * This is an action route for incrementing your retry counter.
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
 * // Increment retry count for task 123
 * POST /api/tasks/123/retry
 *
 * // Returns updated task with incremented retryCount
 * {
 *   success: true,
 *   data: {
 *     id: 123,
 *     retryCount: 4,
 *     ...
 *   }
 * }
 *
 * // Returns 404 if task not found
 * POST /api/tasks/999/retry
 * // Response: { success: false, error: { message: "Task with ID 999 not found", code: "NOT_FOUND" } }
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
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

    // Increment retry count
    const task = await taskRepository.incrementRetryCount(taskId);

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
