import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import { db } from '@/db';
import { projects, specifications, plans, tasks } from '@/db/schema';
import { z } from 'zod';

/**
 * POST /api/agent/projects
 * Create a new project with specification and plan in one call
 * Auth: Requires X-Agent-Token header
 */
export async function POST(request: NextRequest) {
  // Validate authentication
  if (!validateAgentToken(request)) {
    return getUnauthorizedResponse();
  }

  try {
    const body = await request.json();

    // Validate request body
    const createProjectSchema = z.object({
      name: z.string().min(1).max(255),
      constitution: z.string().optional(),
      mission: z.string().optional(),
      description: z.string().optional(),
      tech_stack: z.array(z.string()).optional(),
      instructions: z.string().optional(),
      base_path: z.string().optional(),
      spec_content: z.string().optional().default(''),
      plan_status: z.enum(['draft', 'active', 'completed', 'archived']).optional().default('draft'),
      architecture_decisions: z.record(z.string(), z.unknown()).optional().default({}),
      git_config: z.object({
        enabled: z.boolean().default(false),
        repo_url: z.string().optional(),
        default_branch: z.string().default('main'),
        branching_strategy: z.enum(['none', 'per-phase', 'per-milestone']).default('none')
      }).optional()
    });

    const parsedBody = createProjectSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      // 1. Create project
      const [newProject] = await tx
        .insert(projects)
        .values({
          name: parsedBody.name,
          constitution: parsedBody.constitution || parsedBody.instructions || '',
          mission: parsedBody.mission || null,
          description: parsedBody.description || null,
          techStack: parsedBody.tech_stack || [],
          basePath: parsedBody.base_path || '',
          gitConfig: parsedBody.git_config || {},
          agentStatus: 'idle',
        })
        .returning();

      if (!newProject) throw new Error('Failed to create project');

      // 2. Create specification
      const [newSpec] = await tx
        .insert(specifications)
        .values({
          projectId: newProject.id,
          content: parsedBody.spec_content || parsedBody.mission || '',
          version: '1.0',
          isActive: true,
        })
        .returning();

      if (!newSpec) throw new Error('Failed to create specification');

      // 3. Create plan
      const [newPlan] = await tx
        .insert(plans)
        .values({
          specId: newSpec.id,
          architectureDecisions: parsedBody.architecture_decisions,
          status: parsedBody.plan_status,
        })
        .returning();

      if (!newPlan) throw new Error('Failed to create plan');

      // 4. Optionally create first task if base_path exists
      if (parsedBody.base_path) {
        await tx.insert(tasks).values({
          planId: newPlan.id,
          description: `Analyse codebase at ${parsedBody.base_path}: extract stack, conventions, patterns, and concerns. Write findings into specification.content under heading '## Codebase Analysis'.`,
          priority: 1,
          recommendedModel: 'sonnet',
          verifyCommand: `curl -s http://localhost:3000/api/projects/${newProject.id} | jq '.specification.content | contains("Codebase Analysis")'`,
          doneCriteria: "Specification contains a Codebase Analysis section with stack, conventions, and at least 3 identified patterns",
          status: 'todo',
        });
      }

      return {
        project_id: newProject.id,
        specification_id: newSpec.id,
        plan_id: newPlan.id,
      };
    });

    const host = process.env.APP_URL || 'http://localhost:3000';
    return NextResponse.json({
      success: true,
      data: {
        project_id: result.project_id,
        specification_id: result.specification_id,
        plan_id: result.plan_id,
        webhook_url: `${host}/api/webhooks/git`,
        mission_url: `${host}/api/agent/mission?project_id=${result.project_id}`
      }
    });
  } catch (error) {
    console.error('Error in POST /api/agent/projects:', error);
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
