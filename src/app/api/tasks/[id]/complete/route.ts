import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tasks/{id}/complete
 *
 * Marks a task as completed.
 * This is an action route that performs a specific operation on a task.
 * Automatically sets status to 'done' and completedAt to current timestamp.
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
 * // Mark task with ID 123 as completed
 * POST /api/tasks/123/complete
 *
 * // Returns updated task with status 'done' and current timestamp
 * {
 *   success: true,
 *   data: {
 *     id: 123,
 *     status: "done",
 *     completedAt: "2026-03-08T10:30:00.000Z",
 *     ...
 *   }
 * }
 *
 * // Returns 404 if task not found
 * POST /api/tasks/999/complete
 * // Response: { success: false, error: { message: "Task with ID 999 not found", code: "NOT_FOUND" } }
 */
export async function POST(
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

    // Mark task as completed
    const task = await taskRepository.markAsCompleted(taskId);

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
