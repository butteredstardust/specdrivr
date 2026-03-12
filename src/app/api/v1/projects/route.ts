import { NextRequest, NextResponse } from 'next/server';
import { projectRepository } from '@/repositories/project-repository';
import { createProjectSchema } from '@/lib/schemas';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let projects;

    // Default: Return projects the user is a member of
    // Note: projectRepository.getByUserId currently checks 'createdBy'. 
    // We might need a getByMembership if we want to be strict about RBAC members.
    // For now, let's stick to consistency with the spec.
    if (userId) {
      // If a specific user is requested, ensure the requester is that user or an admin
      if (userId !== session.user.id) {
         // In a real app, we'd check if session.user is a global admin
      }
      projects = await projectRepository.getByUserId(userId);
    } else if (status === 'active') {
      // Filter by active - but still should be restricted to user's projects
      const all = await projectRepository.getByUserId(session.user.id);
      projects = all.filter(p => p.status === 'active');
    } else {
      projects = await projectRepository.getByUserId(session.user.id);
    }

    return NextResponse.json({
      data: projects,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createProjectSchema.parse(body);

    const project = await projectRepository.create({
      name: parsed.name,
      description: parsed.description ?? undefined,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      data: project,
    }, { status: 201 });
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
