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

    // Calculate stats
    const completedTasks = projectContext.tasks.filter(
      t => t.status === 'done'
    ).length;
    const pendingTasks = projectContext.tasks.filter(
      t => t.status !== 'done'
    ).length;

    // Construct response
    const response = {
      success: true,
      data: {
        project: projectContext.project,
        specification: projectContext.specification,
        plan: projectContext.plan,
        nextTask,
        context: {
          hasSpec: !!projectContext.specification,
          hasPlan: !!projectContext.plan,
          hasTasks: projectContext.tasks.length > 0,
          totalTasks: projectContext.tasks.length,
          completedTasks,
          pendingTasks,
        },
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
