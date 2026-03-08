import { NextRequest, NextResponse } from 'next/server';
import { projectRepository } from '@/repositories/project-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional().nullable(),
  createdByUserId: z.number().optional().nullable(),
});

export const updateProjectSchema = z.object({
  id: z.number().int().positive('Valid project ID is required'),
  name: z.string().min(1, 'Project name cannot be empty').max(255, 'Project name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
}).refine(
  (data) => Object.keys(data).some(key => key !== 'id' && data[key as keyof typeof data] !== undefined),
  { message: 'At least one field to update is required' }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let projects;

    if (userId) {
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return NextResponse.json(
          formatErrorResponse({ message: 'Invalid userId parameter' }),
          { status: 400 }
        );
      }
      projects = await projectRepository.getByUserId(userIdNum);
    } else if (status === 'active') {
      projects = await projectRepository.getActive();
    } else {
      projects = await projectRepository.getAll();
    }

    return NextResponse.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = projectSchema.parse(body);

    const project = await projectRepository.create({
      name: parsed.name,
      description: parsed.description ?? undefined,
      createdByUserId: parsed.createdByUserId ?? undefined,
    });

    return NextResponse.json({
      success: true,
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateProjectSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description;

    const project = await projectRepository.update(parsed.id, {
      name: updateData.name as string | undefined,
      description: updateData.description as string | null | undefined,
    });

    return NextResponse.json({
      success: true,
      data: project,
    });
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Project ID is required' }),
        { status: 400 }
      );
    }

    const projectId = parseInt(id, 10);
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid project ID' }),
        { status: 400 }
      );
    }

    await projectRepository.delete(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
