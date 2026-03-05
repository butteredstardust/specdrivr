import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import { UpdateTaskSchema, ApiResponseSchema } from '@/lib/schemas';
import { updateTaskStatus } from '@/lib/agent-memory';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
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
    const routeParams = await params;
    const taskId = parseInt(routeParams.id, 10);

    // Validate request body
    const parsedBody = UpdateTaskSchema.parse(body);

    const updateData: Record<string, any> = {};

    // Build update payload
    if (parsedBody.status !== undefined) {
      updateData.status = parsedBody.status;
      if (parsedBody.status === 'done' || parsedBody.status === 'skipped') {
        updateData.completedAt = new Date();
      }
    }

    if (parsedBody.filesInvolved !== undefined) {
      updateData.filesInvolved = parsedBody.filesInvolved;
    }

    if (parsedBody.priority !== undefined) {
      updateData.priority = parsedBody.priority;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      // Since updateTaskStatus handles history/logging for status changes, 
      // we use it if only status changed, but for multi-field updates we use direct DB update
      // for simplicity, or we could update fields first then call updateTaskStatus.

      // Let's do direct update for all fields to be safe and avoid duplicated 'updatedAt' triggers
      await db.update(schema.tasks)
        .set(updateData)
        .where(eq(schema.tasks.id, taskId));

      // If status changed, we still want the agent memory log
      if (parsedBody.status) {
        await updateTaskStatus(taskId, parsedBody.status);
      }
    }

    const response = {
      success: true,
      data: {
        taskId,
        updatedFields: updateData,
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
