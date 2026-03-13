import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { webhookRepository } from '@/repositories/webhook-repository';
import { handleApiError } from '@/lib/error-handler';
import { requireMember } from '@/lib/rbac';
import { db } from '@/db';
import { webhookDeliveries } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string; webhookId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    // Verify webhook exists and belongs to project
    const webhook = await webhookRepository.getById(wId);
    if (!webhook || webhook.projectId !== projectId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Webhook not found' } },
        { status: 404 }
      );
    }

    const deliveries = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, wId))
      .orderBy(desc(webhookDeliveries.createdAt));

    return NextResponse.json({ data: deliveries });
  } catch (error) {
    return handleApiError(error);
  }
}
