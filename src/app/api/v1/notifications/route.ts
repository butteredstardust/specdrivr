import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const userNotifs = await db.select().from(notifications).where(eq(notifications.userId, Number(session.user.id))).orderBy(desc(notifications.createdAt));

    const mapped = userNotifs.map(n => ({
      ...n,
      id: n.id.toString(),
      userId: n.userId.toString()
    }));

    return NextResponse.json({ data: mapped });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
