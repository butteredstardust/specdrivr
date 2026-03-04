import { NextRequest, NextResponse } from 'next/server';
import { CreateTaskSchema, ApiResponseSchema } from '@/lib/schemas';
import { createTask } from '@/lib/agent-memory';
import { z } from 'zod';

/**
 * POST /api/tasks
 * Create a new task (developer-facing, RESTful API)
 * Supports external tool integration (stateless, cacheable)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parsed = CreateTaskSchema.parse(body);

    // Create task using existing helper
    const task = await createTask(parsed.planId, {
      description: parsed.description,
      filesInvolved: parsed.filesInvolved,
      priority: parsed.priority,
      dependencyTaskId: parsed.dependencyTaskId,
    });

    const response = {
      success: true,
      data: {
        taskId: task.id,
        task,
        message: 'Task created successfully',
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);

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