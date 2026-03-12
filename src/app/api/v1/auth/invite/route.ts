import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invites, projects, users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: { code: 'INVALID_TOKEN', message: 'Missing token' } }, { status: 400 });
    }

    const [invite] = await db
      .select({
        id: invites.id,
        email: invites.email,
        projectId: invites.projectId,
        projectName: projects.name,
      })
      .from(invites)
      .innerJoin(projects, eq(invites.projectId, projects.id))
      .where(
        and(
          eq(invites.token, token),
          gt(invites.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' } }, { status: 400 });
    }

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, invite.email))
      .limit(1);

    return NextResponse.json({
      data: {
        email: invite.email,
        projectName: invite.projectName,
        isExistingUser: !!existingUser
      }
    });
  } catch (error) {
    console.error('Failed to validate invite token', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
