import { NextResponse } from 'next/server';
import { db } from '@/db';
import { webhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function DELETE(req: Request, context: { params: Promise<{ id: string, webhookId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (((session.user as { role?: string }).role) !== 'admin' && ((session.user as { role?: string }).role) !== 'owner') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { id, webhookId } = await context.params;

    const existing = await db.select().from(webhooks).where(
        and(eq(webhooks.id, Number(webhookId)), eq(webhooks.projectId, Number(id)))
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Webhook not found' } },
        { status: 404 }
      );
    }

    await db.delete(webhooks).where(eq(webhooks.id, Number(webhookId)));

    return NextResponse.json({ success: true, data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
