import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const existing = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, Number(id)), eq(notifications.userId, session.user.id)));

    if (existing.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Notification not found' } },
        { status: 404 }
      );
    }

    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, Number(id)));

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
