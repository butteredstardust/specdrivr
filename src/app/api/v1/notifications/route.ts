import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { PaginationSchema } from '@/lib/schemas/shared.schemas';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const url = new URL(req.url);
    const query = PaginationSchema.safeParse(Object.fromEntries(url.searchParams));

    if (!query.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: query.error.message } }, { status: 400 });
    }

    const items = await db.query.notifications.findMany({
      where: eq(notifications.userId, session.user.id),
      limit: query.data.limit,
      offset: query.data.offset,
      orderBy: [desc(notifications.createdAt)],
    });

    return NextResponse.json({ data: items });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' } }, { status: 500 });
  }
}
