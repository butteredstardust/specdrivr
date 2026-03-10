import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userNotifs = await db.select().from(notifications).where(eq(notifications.userId, Number(session.user.id))).orderBy(desc(notifications.createdAt));

    const mapped = userNotifs.map(n => ({
      ...n,
      id: n.id.toString(),
      userId: n.userId.toString()
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    return handleApiError(error);
  }
}
