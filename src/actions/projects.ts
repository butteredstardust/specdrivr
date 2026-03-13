'use server';

import { revalidatePath } from 'next/cache';
import { projectRepository } from '@/repositories/project-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createProjectSchema, updateProjectSchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/rbac';

export async function createProjectAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Please sign in to create a project' },
    };
  }

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    createdBy: session.user.id,
  };

  const result = createProjectSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  try {
    const project = await projectRepository.create({
      name: result.data.name,
      description: result.data.description,
      createdBy: session.user.id,
    });

    // Invalidate the projects list cache
    revalidatePath('/projects');
    revalidatePath('/dashboard');

    return { success: true, data: project };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
      },
      'Failed to create project'
    );

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while creating the project',
      },
    };
  }
}

export async function updateProjectAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Please sign in to update a project' },
    };
  }

  const idStr = formData.get('id');
  if (!idStr || typeof idStr !== 'string') {
    return { success: false, error: { code: 'INVALID_INPUT', message: 'Project ID is required' } };
  }

  const rawData = {
    id: parseInt(idStr, 10),
    name: formData.get('name') || undefined,
    description: formData.get('description') || undefined,
  };

  const result = updateProjectSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  try {
    const existingProject = await projectRepository.getById(result.data.id);
    if (!existingProject) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } };
    }

    const { allowed } = await requireAdmin(session.user.id, result.data.id);
    if (!allowed) {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'You must be a project admin to update this project' },
      };
    }

    const project = await projectRepository.update(result.data.id, {
      name: result.data.name,
      description: result.data.description,
    });

    revalidatePath('/projects');
    revalidatePath(`/projects/${project.id}`);
    revalidatePath('/dashboard');

    return { success: true, data: project };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
        projectId: result.data.id,
      },
      'Failed to update project'
    );

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while updating the project',
      },
    };
  }
}
