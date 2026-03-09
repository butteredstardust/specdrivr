import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, session.user.id), isNull(notifications.readAt)));

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to read all notifications' } }, { status: 500 });
  }
}
