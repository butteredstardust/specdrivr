import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { UpdatePasswordSchema } from '@/lib/schemas/auth.schemas';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const body = await req.json();
    const result = UpdatePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.message } }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });

    const isMatch = await bcrypt.compare(result.data.currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Incorrect current password' } }, { status: 401 });
    }

    const newHash = await bcrypt.hash(result.data.newPassword, 12);

    await db.update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update password' } }, { status: 500 });
  }
}
