import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { webhookRepository } from '@/repositories/webhook-repository';
import { handleApiError } from '@/lib/error-handler';
import { requireAdmin } from '@/lib/rbac';
import { updateWebhookSchema } from '@/lib/schemas';

interface RouteParams {
  params: Promise<{ id: string; webhookId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id, webhookId } = await params;
    const projectId = parseInt(id, 10);
    const wId = parseInt(webhookId, 10);

    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You must be a project admin to manage webhooks' } },
        { status: 403 }
      );
    }

    const existing = await webhookRepository.getById(wId);
    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Webhook not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateWebhookSchema.parse({ id: wId, ...body });

    const { id: _validatedId, ...update } = parsed;
    const webhook = await webhookRepository.update(wId, update);
    const { secret, ...publicWebhook } = webhook;
    return NextResponse.json({ data: { ...publicWebhook, secretConfigured: Boolean(secret) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id, webhookId } = await params;
    const projectId = parseInt(id, 10);
    const wId = parseInt(webhookId, 10);

    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You must be a project admin to manage webhooks' } },
        { status: 403 }
      );
    }

    const existing = await webhookRepository.getById(wId);
    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Webhook not found' } },
        { status: 404 }
      );
    }

    await webhookRepository.delete(wId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
