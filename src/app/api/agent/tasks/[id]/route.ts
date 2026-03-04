import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import { UpdateTaskSchema, ApiResponseSchema } from '@/lib/schemas';
import { updateTaskStatus } from '@/lib/agent-memory';
import { taskStatusEnum } from '@/db/schema';
import { z } from 'zod';

/**
 * PATCH /api/agent/tasks/:id
 * Update task status
 * Auth: Requires X-Agent-Token header
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validate authentication
  if (!validateAgentToken(request)) {
    return getUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const taskId = parseInt(id, 10);

    // Validate request body
    const parsedBody = UpdateTaskSchema.parse(body);

    // Update task status if provided
    if (parsedBody.status) {
      await updateTaskStatus(taskId, parsedBody.status);
    }

    // TODO: In a real implementation, we would also update:
    // - files_involved
    // - priority
    // For now, we're just updating status

    const response = {
      success: true,
      data: {
        taskId,
        updatedFields: {
          status: parsedBody.status,
        },
        message: 'Task updated successfully',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in PATCH /api/agent/tasks/[id]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
