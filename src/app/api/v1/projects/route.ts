import { NextRequest, NextResponse } from 'next/server';
import { projectRepository } from '@/repositories/project-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { parseUrlParams } from '@/lib/api-utils';

const ProjectQuerySchema = z.object({
  status: z.enum(['active', 'archived']).optional(),
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name cannot exceed 255 characters'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const query = parseUrlParams(request, ProjectQuerySchema);

    let projects = await projectRepository.getByUserId(session.user.id, query.limit, query.offset);

    if (query.status) {
      projects = projects.filter((p) => p.status === query.status);
    }

    return NextResponse.json({
      data: projects,
      meta: {
        limit: query.limit,
        offset: query.offset,
        count: projects.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid query parameters', details: error.errors }),
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = CreateProjectSchema.parse(body);

    const project = await projectRepository.create({
      name: parsed.name,
      description: parsed.description ?? undefined,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse({
          message: 'Validation failed',
          details: error.errors,
        }),
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
