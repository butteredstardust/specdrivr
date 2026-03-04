import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import { db } from '@/db';
import { tasks, plans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

/**
 * POST /api/agent/tasks
 * Create individual tasks under a plan (supports bulk creation)
 * Auth: Requires X-Agent-Token header
 */
export async function POST(request: NextRequest) {
  // Validate authentication
  if (!validateAgentToken(request)) {
    return getUnauthorizedResponse();
  }

  try {
    const body = await request.json();

    // Support both single task and bulk creation
    const isArray = Array.isArray(body.tasks);
    const tasksData = isArray ? body.tasks : [body];

    // Validation schema for a single task
    const createTaskSchema = z.object({
      planId: z.number().positive('Plan ID must be positive'),
      description: z.string().min(1).max(255),
      filesInvolved: z.array(z.string()).optional(),
      priority: z.number().int().min(1).max(10).optional().default(1),
      dependencyTaskId: z.number().nullable().optional(),
      status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional().default('todo'),
    });

    // Validate all tasks
    const results: Array<{ success: boolean; task_id?: number; error?: string }> = [];

    for (const taskData of tasksData) {
      try {
        const parsedTask = createTaskSchema.parse(taskData);

        // Check if plan exists
        const planExists = await db.query.plans.findFirst({
          where: eq(plans.id, parsedTask.planId),
        });

        if (!planExists) {
          results.push({ success: false, error: `Plan with ID ${parsedTask.planId} not found` });
          continue;
        }

        // Create the task
        const [newTask] = await db
          .insert(tasks)
          .values({
            planId: parsedTask.planId,
            description: parsedTask.description,
            filesInvolved: parsedTask.filesInvolved || [],
            priority: parsedTask.priority,
            dependencyTaskId: parsedTask.dependencyTaskId,
            status: parsedTask.status,
          })
          .returning();

        if (newTask) {
          results.push({ success: true, task_id: newTask.id });
        } else {
          results.push({ success: false, error: 'Failed to create task' });
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          results.push({
            success: false,
            error: `Validation failed: ${err.issues.map(i => i.message).join(', ')}`,
          });
        } else {
          results.push({
            success: false,
            error: typeof err === 'object' && err !== null && 'message' in err ? (err as Error).message : 'Unknown error',
          });
        }
      }
    }

    const allSuccess = results.every(r => r.success);
    const response = {
      success: allSuccess,
      data: {
        tasks: results,
        message: isArray
          ? `${results.filter(r => r.success).length}/${results.length} tasks created`
          : results[0].success ? 'Task created successfully' : 'Failed to create task',
      },
    };

    return NextResponse.json(
      response,
      { status: allSuccess ? 200 : 207 } // 207 for partial success in bulk operations
    );
  } catch (error) {
    console.error('Error in POST /api/agent/tasks:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
