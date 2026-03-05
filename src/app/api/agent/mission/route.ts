import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import {
  MissionResponseSchema,
  ApiResponseSchema,
  CreatePlanSchema,
  TaskSchema,
} from '@/lib/schemas';
import {
  getProjectContext,
  getNextTask,
} from '@/lib/agent-memory';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/agent/mission
 * Get the active specification, plan, and next task for a project
 * Auth: Requires X-Agent-Token header
 */
export async function GET(request: NextRequest) {
  // Validate authentication
  if (!validateAgentToken(request)) {
    return getUnauthorizedResponse();
  }

  try {
    // Get project_id from query params
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('project_id');

    if (!projectIdParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing project_id parameter',
        },
        { status: 400 }
      );
    }

    const projectId = parseInt(projectIdParam, 10);

    // Get full project context
    const projectContext = await getProjectContext(projectId);

    if (!projectContext) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Get the next available task
    const nextTask = await getNextTask(projectId);

    // Compute unblocked tasks
    let unblocked_tasks: any[] = [];
    if (projectContext.plan) {
      const allTasks = await db.query.tasks.findMany({
        where: eq(tasks.planId, projectContext.plan.id),
      });

      const completedTaskIds = new Set(
        allTasks.filter((t) => t.status === 'done' || t.status === 'skipped').map((t) => t.id)
      );

      unblocked_tasks = allTasks
        .filter((task) => {
          if (!['todo', 'paused', 'blocked'].includes(task.status)) return false;
          if (task.dependencyTaskId && !completedTaskIds.has(task.dependencyTaskId)) return false;
          return true;
        })
        .map((task) => ({
          id: task.id,
          description: task.description || '',
          priority: task.priority,
          recommended_model: task.recommendedModel,
          estimate_hours: task.estimateHours,
        }));
    }

    // Calculate stats
    const completedTasks = projectContext.tasks.filter(
      (t: any) => t.status === 'done'
    ).length;
    const pendingTasks = projectContext.tasks.filter(
      (t: any) => t.status !== 'done'
    ).length;

    // Construct response
    const response = {
      success: true,
      data: {
        project: projectContext.project,
        specification: projectContext.specification,
        active_plan: projectContext.plan,
        next_task: nextTask,
        unblocked_tasks,
      },
    };

    // Validate response with Zod schema
    const parsedResponse = ApiResponseSchema.parse(response);

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error in GET /api/agent/mission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
