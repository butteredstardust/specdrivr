'use server';

import { revalidatePath } from 'next/cache';
import { specificationRepository } from '@/repositories/specification-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { 
  createSpecificationSchema, 
  updateSpecificationSchema, 
  createSpecVersionSchema,
  specStatusSchema
} from '@/lib/schemas';
import { requireMember } from '@/lib/rbac';
import type { z } from 'zod';
import { webhookService } from '@/lib/webhooks';

type SpecStatus = z.infer<typeof specStatusSchema>;

export async function createSpecificationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    projectId: Number(formData.get('projectId')),
    name: formData.get('name'),
    description: formData.get('description'),
    markdownContent: formData.get('markdownContent'),
  };

  const result = createSpecificationSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const { allowed } = await requireMember(session.user.id, result.data.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to create specifications in this project' } };
  }

  try {
    const spec = await specificationRepository.createWithVersion({
      projectId: result.data.projectId,
      name: result.data.name,
      markdownContent: result.data.markdownContent,
      createdBy: session.user.id,
    });
    
    // Dispatch webhook
    await webhookService.dispatch(result.data.projectId, 'spec_created', spec, {
      specId: spec.id,
    });

    revalidatePath(`/projects/${result.data.projectId}/specs`);
    revalidatePath('/dashboard');
    
    return { success: true, data: spec };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id 
    }, 'Failed to create specification');
    
    return { 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An unexpected error occurred' 
      } 
    };
  }
}

export async function createSpecVersionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    specId: Number(formData.get('specId')),
    markdownContent: formData.get('markdownContent'),
  };

  const result = createSpecVersionSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const spec = await specificationRepository.getById(result.data.specId);
  if (!spec) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Specification not found' } };
  }

  const { allowed } = await requireMember(session.user.id, spec.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to update this specification' } };
  }

  try {
    const updatedSpec = await specificationRepository.addVersion({
      specId: result.data.specId,
      markdownContent: result.data.markdownContent,
      createdBy: session.user.id,
    });
    
    // Dispatch webhook
    await webhookService.dispatch(spec.projectId, 'spec_updated', updatedSpec, {
      specId: updatedSpec.id,
    });

    revalidatePath(`/specs/${result.data.specId}`);
    revalidatePath(`/projects/${spec.projectId}/specs`);
    
    return { success: true, data: updatedSpec };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      specId: result.data.specId
    }, 'Failed to add spec version');
    
    return { 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An unexpected error occurred' 
      } 
    };
  }
}

export async function updateSpecificationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    id: Number(formData.get('id')),
    name: formData.get('name') || undefined,
    status: formData.get('status') || undefined,
  };

  const result = updateSpecificationSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const spec = await specificationRepository.getById(result.data.id);
  if (!spec) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Specification not found' } };
  }

  const { allowed } = await requireMember(session.user.id, spec.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to update this specification' } };
  }

  try {
    const updatedSpec = await specificationRepository.update(result.data.id, {
      name: result.data.name,
      status: result.data.status as SpecStatus,
    });
    
    // Dispatch webhook
    await webhookService.dispatch(spec.projectId, 'spec_updated', updatedSpec, {
      specId: updatedSpec.id,
    });

    revalidatePath(`/specs/${result.data.id}`);
    revalidatePath(`/projects/${spec.projectId}/specs`);
    
    return { success: true, data: updatedSpec };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      specId: result.data.id
    }, 'Failed to update specification');
    
    return { 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An unexpected error occurred' 
      } 
    };
  }
}
