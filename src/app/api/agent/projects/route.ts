import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import { db } from '@/db';
import { projects, specifications, plans } from '@/db/schema';
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
      tech_stack: z.record(z.string(), z.unknown()).optional(),
      instructions: z.string().optional(),
      base_path: z.string().optional(),
      spec_content: z.string().optional().default(''),
      plan_status: z.enum(['draft', 'active', 'completed', 'archived']).optional().default('draft'),
      architecture_decisions: z.record(z.string(), z.unknown()).optional().default({}),
    });

    const parsedBody = createProjectSchema.parse(body);

    // Use a transaction-like approach
    // 1. Create project
    const [newProject] = await db
      .insert(projects)
      .values({
        name: parsedBody.name,
        constitution: parsedBody.constitution || '',
        mission: parsedBody.mission || null,
        description: parsedBody.description || null,
        techStack: parsedBody.tech_stack || {},
        basePath: parsedBody.base_path || '',
        agentStatus: 'idle',
      })
      .returning();

    if (!newProject) {
      throw new Error('Failed to create project');
    }

    // 2. Create specification
    const [newSpec] = await db
      .insert(specifications)
      .values({
        projectId: newProject.id,
        content: parsedBody.spec_content,
        version: '1.0',
        isActive: true,
      })
      .returning();

    if (!newSpec) {
      throw new Error('Failed to create specification');
    }

    // 3. Create plan
    const [newPlan] = await db
      .insert(plans)
      .values({
        specId: newSpec.id,
        architectureDecisions: parsedBody.architecture_decisions,
        status: parsedBody.plan_status,
      })
      .returning();

    if (!newPlan) {
      throw new Error('Failed to create plan');
    }

    const response = {
      success: true,
      data: {
        project_id: newProject.id,
        specification_id: newSpec.id,
        plan_id: newPlan.id,
        message: 'Project created successfully',
      },
    };

    return NextResponse.json(response);
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
