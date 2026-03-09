import { NextResponse } from 'next/server';
import { db } from '@/db';
import { webhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function DELETE(req: Request, context: { params: Promise<{ id: string, webhookId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'owner') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
    }

    const { id, webhookId } = await context.params;

    const existing = await db.select().from(webhooks).where(
        and(eq(webhooks.id, Number(webhookId)), eq(webhooks.projectId, Number(id)))
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Webhook not found' } }, { status: 404 });
    }

    await db.delete(webhooks).where(eq(webhooks.id, Number(webhookId)));

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
