import { NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookDeliveries, webhooks } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: Request, context: { params: Promise<{ id: string, webhookId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id, webhookId } = await context.params;

    // Check webhook exists and belongs to project
    const existing = await db.select().from(webhooks).where(
        and(eq(webhooks.id, Number(webhookId)), eq(webhooks.projectId, Number(id)))
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Webhook not found' } },
        { status: 404 }
      );
    }

    const deliveries = await db.select().from(webhookDeliveries).where(eq(webhookDeliveries.projectId, Number(id))).orderBy(desc(webhookDeliveries.createdAt));

    // The DB schema doesn't link deliveries to specific webhooks via webhookId,
    // it only links to projectId. We'll return project deliveries.
    // In a real implementation we would add webhookId to webhookDeliveries table.

    const mapped = deliveries.map(d => ({
      ...d,
      id: d.id.toString(),
      projectId: d.projectId.toString()
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    return handleApiError(error);
  }
}
