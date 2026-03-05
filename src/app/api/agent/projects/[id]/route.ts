import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import { db } from '@/db';
import { projects, specifications, plans } from '@/db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import { z } from 'zod';

/**
 * PATCH /api/agent/projects/:id
 * Update project configuration (and optionally specification content)
 * Auth: Requires X-Agent-Token header
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate authentication
  if (!validateAgentToken(request)) {
    return getUnauthorizedResponse();
  }

  try {
    const projectId = parseInt(params.id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body - all fields optional
    const updateProjectSchema = z.object({
      mission: z.string().optional(),
      description: z.string().optional(),
      constitution: z.string().optional(),
      tech_stack: z.record(z.string(), z.unknown()).optional(),
      instructions: z.string().optional(),
      base_path: z.string().optional(),
      git_branch: z.string().optional(),
      git_strategy: z.string().optional(),
      status: z.enum(['active', 'archived']).optional(),
      // Optionally update specification by creating new version
      spec_content: z.string().optional(),
    });

    const parsedBody = updateProjectSchema.parse(body);

    // Check if project exists
    const [existingProject] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project fields
    const updateData: Record<string, unknown> = {};
    if (parsedBody.mission !== undefined) {
      updateData.mission = parsedBody.mission;
    }
    if (parsedBody.description !== undefined) {
      updateData.description = parsedBody.description;
    }
    if (parsedBody.constitution !== undefined) {
      updateData.constitution = parsedBody.constitution;
    }
    if (parsedBody.tech_stack !== undefined) {
      updateData.techStack = parsedBody.tech_stack;
    }
    if (parsedBody.instructions !== undefined) {
      updateData.instructions = parsedBody.instructions;
    }
    if (parsedBody.base_path !== undefined) {
      updateData.base_path = parsedBody.base_path;
    }
    if (parsedBody.git_branch !== undefined) {
      updateData.gitBranch = parsedBody.git_branch;
    }
    if (parsedBody.git_strategy !== undefined) {
      updateData.gitStrategy = parsedBody.git_strategy;
    }
    if (parsedBody.status !== undefined) {
      updateData.status = parsedBody.status;
    }

    let updatedProjectId = projectId;
    let newSpecId: number | undefined;

    // Only perform update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();

      const [updatedProject] = await db
        .update(projects)
        .set(updateData as any)
        .where(eq(projects.id, projectId))
        .returning();

      if (!updatedProject) {
        throw new Error('Failed to update project');
      }
    }

    // Optionally update specification (creates new version)
    if (parsedBody.spec_content) {
      // Get existing active specification
      const [existingSpec] = await db
        .select()
        .from(specifications)
        .where(
          and(
            eq(specifications.projectId, projectId),
            eq(specifications.isActive, true)
          )
        )
        .orderBy(desc(specifications.createdAt))
        .limit(1);

      if (existingSpec) {
        // Increment version
        const versionParts = existingSpec.version.split('.');
        const majorVersion = parseInt(versionParts[0], 10);
        const minorVersion = parseInt(versionParts[1] || '0', 10);
        const newVersion = `${majorVersion}.${minorVersion + 1}`;

        // Mark old spec as inactive
        await db
          .update(specifications)
          .set({ isActive: false })
          .where(eq(specifications.id, existingSpec.id));
      }

      // Create new spec version
      const [newSpec] = await db
        .insert(specifications)
        .values({
          projectId,
          content: parsedBody.spec_content,
          version: existingSpec
            ? `${parseInt((existingSpec.version as string || '1.0').split('.')[0], 10)}.${parseInt((existingSpec.version as string || '1.0').split('.')[1] || '0') + 1}`
            : '1.0',
          isActive: true,
        })
        .returning();

      if (newSpec) {
        newSpecId = newSpec.id;
      }
    }

    const response = {
      success: true,
      data: {
        project_id: projectId,
        specification_id: newSpecId,
        message: 'Project updated successfully',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in PATCH /api/agent/projects/:id:', error);

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

/**
 * GET /api/agent/projects/:id
 * Get project details (for agent to query its own state)
 * Auth: Requires X-Agent-Token header
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate authentication
  if (!validateAgentToken(request)) {
    return getUnauthorizedResponse();
  }

  try {
    const projectId = parseInt(params.id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Get project with active spec and plan
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get active specification
    const [specification] = await db
      .select()
      .from(specifications)
      .where(
        and(
          eq(specifications.projectId, projectId),
          eq(specifications.isActive, true)
        )
      )
      .limit(1);

    // Get plan if spec exists
    let plan = null;
    if (specification) {
      [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.specId, specification.id))
        .limit(1);
    }

    const response = {
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          mission: project.mission,
          description: project.description,
          constitution: project.constitution,
          techStack: project.techStack,
          basePath: project.basePath,
          agentStatus: project.agentStatus,
          agentStartedAt: project.agentStartedAt,
          agentStoppedAt: project.agentStoppedAt,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
        specification: specification ? {
          id: specification.id,
          content: specification.content,
          version: specification.version,
          isActive: specification.isActive,
          createdAt: specification.createdAt,
        } : null,
        plan: plan ? {
          id: plan.id,
          status: plan.status,
          architectureDecisions: plan.architectureDecisions,
          createdAt: plan.createdAt,
        } : null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/agent/projects/:id:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
