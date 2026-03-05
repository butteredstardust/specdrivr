import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, plans, specifications, projects } from '@/db/schema';
import { validateAgentToken } from '@/lib/auth';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

/**
 * GET /api/agent/wave
 *
 * Returns all unblocked tasks in a plan for parallel execution.
 *
 * Query Parameters:
 * - project_id (required): The project ID
 * - plan_id (optional): Filter to specific plan, defaults to active plan
 *
 * Returns:
 * {
 *   wave_id: string,        // Unique ID for this wave
 *   wave_complete: boolean, // Whether all tasks are done/skipped
 *   tasks: Array<{            // Unblocked tasks ready for execution
 *     id: number,
 *     description: string,
 *     priority: number,
 *     status: string,
 *     verify_command: string | null,
 *     done_criteria: string | null,
 *     resume_context: object | null,
 *     filesInvolved: string[],
 *   }>,
 *   git_config: {            // Git configuration for the project
 *     repoUrl: string | null,
 *     branch: string,
 *     strategy: string | null,
 *     webhookUrl: string | null,
 *   },
 *   spec: {
 *     id: number,
 *     content: string,
 *     version: string,
 *   }
 * }
 *
 * Wave Definition:
 * A wave is a set of tasks that can be executed in parallel (no dependencies between them).
 * A task is included in the wave if:
 * - Its status is 'todo', 'paused', or 'blocked' (for retry)
 * - All its dependency tasks have status 'done' or 'skipped'
 * - It is not currently 'in_progress' (claimed by another agent)
 *
 * Status Codes:
 * - 200: Wave returned successfully
 * - 400: Invalid request parameters
 * - 401: Invalid or missing X-Agent-Token
 * - 403: Agent token does not have access to this project
 * - 404: Project or plan not found
 */
export async function GET(request: NextRequest) {
  try {
    // Validate agent token
    const isValidToken = validateAgentToken(request);
    if (!isValidToken) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing X-Agent-Token' } },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const planIdParam = searchParams.get('plan_id');

    // Validate parameters
    const paramsResult = waveParamsSchema.safeParse({
      project_id: projectId,
      plan_id: planIdParam ? parseInt(planIdParam, 10) : undefined,
    });

    if (!paramsResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            fields: paramsResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { project_id: validProjectId, plan_id } = paramsResult.data;

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, validProjectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Get the plan (use specified plan or find active one)
    let plan;
    if (plan_id) {
      plan = await db.query.plans.findFirst({
        where: eq(plans.id, plan_id),
      });
    } else {
      // Find active plan for the project
      plan = await db.query.plans.findFirst({
        where: and(
          eq(plans.specId, sql`specifications.id`),
          sql`specifications.project_id = ${validProjectId}`,
          eq(plans.status, 'active')
        ),
      });
    }

    if (!plan) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: plan_id ? 'Plan not found' : 'No active plan found' } },
        { status: 404 }
      );
    }

    // Get specification
    const spec = await db.query.specifications.findFirst({
      where: eq(specifications.id, plan.specId),
    });

    // Get all tasks in the plan that are ready to execute
    // A task is ready if:
    // 1. Status is 'todo', 'paused', or 'blocked'
    // 2. All dependencies are 'done' or 'skipped'
    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.planId, plan.id),
    });

    // Get done/skipped task IDs to check dependencies
    const completedTaskIds = new Set(
      allTasks
        .filter((t) => t.status === 'done' || t.status === 'skipped')
        .map((t) => t.id)
    );

    // Filter tasks for the wave
    const waveTasks = allTasks
      .filter((task) => {
        // Include tasks that are todo, paused, or blocked (for retry)
        if (
          !['todo', 'paused', 'blocked'].includes(task.status)
        ) {
          return false;
        }

        // Check dependencies - all must be done or skipped
        if (task.dependencyTaskId && !completedTaskIds.has(task.dependencyTaskId)) {
          return false;
        }

        return true;
      })
      .map((task) => ({
        id: task.id,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        verify_command: task.verifyCommand,
        done_criteria: task.doneCriteria,
        resume_context: task.resumeContext,
        files_involved: Array.isArray(task.filesInvolved)
          ? task.filesInvolved
          : [],
      }))
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    // Check if wave is complete (all tasks done/skipped)
    const totalTasks = allTasks.length;
    const completedTasks = completedTaskIds.size;
    const waveComplete = totalTasks > 0 && completedTasks === totalTasks;

    // Generate a consistent wave_id based on the set of tasks
    const taskIds = waveTasks.map((t) => t.id).sort((a, b) => a - b).join(',');
    const wave_id = `wave_${btoa(taskIds)}`;

    // Git configuration
    // Fall back to main and commit-direct if tracking fields are empty/null
    const git_config = {
      repoUrl: project.basePath || null,
      branch: project.gitBranch || 'main',
      strategy: project.gitStrategy || 'commit-direct',
      webhookUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks/git`,
    };

    return NextResponse.json({
      wave_id,
      wave_complete: waveComplete,
      tasks: waveTasks,
      git_config,
      spec: spec ? {
        id: spec.id,
        content: spec.content,
        version: spec.version,
      } : null,
    });
  } catch (error) {
    console.error('Wave endpoint error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// Schema Validation
// ============================================================================

const waveParamsSchema = z.object({
  project_id: z.coerce.number().int().positive('project_id must be a positive integer'),
  plan_id: z.coerce.number().int().positive().optional(),
});
