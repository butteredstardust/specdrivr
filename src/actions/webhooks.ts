'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createWebhookSchema, updateWebhookSchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/rbac';
import { webhookRepository } from '@/repositories/webhook-repository';

export async function createWebhookAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    projectId: Number(formData.get('projectId')),
    url: formData.get('url'),
    secret: formData.get('secret') || undefined,
    events: formData.getAll('events').map(String),
  };

  const result = createWebhookSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const { allowed } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project admin to manage webhooks' } };
  }

  try {
    const webhook = await webhookRepository.create(result.data);
    revalidatePath(`/projects/${result.data.projectId}/settings`);
    return { success: true, data: webhook };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      projectId: result.data.projectId
    }, 'Failed to create webhook');
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create webhook' } };
  }
}

export async function updateWebhookAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    id: Number(formData.get('id')),
    url: formData.get('url') || undefined,
    secret: formData.get('secret') || undefined,
    events: formData.has('events') ? formData.getAll('events').map(String) : undefined,
    isActive: formData.has('isActive') ? formData.get('isActive') === 'true' : undefined,
  };

  const result = updateWebhookSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const webhook = await webhookRepository.getById(result.data.id);
  if (!webhook) return { success: false, error: { code: 'NOT_FOUND', message: 'Webhook not found' } };

  const { allowed } = await requireAdmin(session.user.id, webhook.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project admin to manage webhooks' } };
  }

  try {
    const updated = await webhookRepository.update(result.data.id, result.data);
    revalidatePath(`/projects/${webhook.projectId}/settings`);
    return { success: true, data: updated };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      webhookId: result.data.id
    }, 'Failed to update webhook');
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update webhook' } };
  }
}

export async function deleteWebhookAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const id = Number(formData.get('id'));
  const projectId = Number(formData.get('projectId'));

  const { allowed } = await requireAdmin(session.user.id, projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project admin to manage webhooks' } };
  }

  try {
    await webhookRepository.delete(id);
    revalidatePath(`/projects/${projectId}/settings`);
    return { success: true };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      webhookId: id
    }, 'Failed to delete webhook');
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete webhook' } };
  }
}
