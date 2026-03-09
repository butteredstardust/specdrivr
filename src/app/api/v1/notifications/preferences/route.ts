import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notificationPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { NotificationPreferencesSchema } from '@/lib/schemas/user.schemas';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const preferences = await db.query.notificationPreferences.findMany({
      where: eq(notificationPreferences.userId, session.user.id),
    });

    return NextResponse.json({ data: preferences });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch preferences' } }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const body = await req.json();
    const result = NotificationPreferencesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.message } }, { status: 400 });
    }

    // Since we don't know the exact logic for project scoping of preferences yet
    // I'm using a stub implementation
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update preferences' } }, { status: 500 });
  }
}
