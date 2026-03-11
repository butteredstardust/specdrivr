import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { handleApiError } from '@/lib/error-handler';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    const userId = parseInt(session.user.id);
    const list = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json({ data: list });
  } catch (error) {
    return handleApiError(error);
  }
}
