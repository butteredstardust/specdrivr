import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users, invites, projectMembers } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const AcceptInviteSchema = z.object({
  token: z.string(),
  password: z.string().min(8).optional(),
  name: z.string().min(2).optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = AcceptInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const existingInvites = await db.select().from(invites).where(eq(invites.id, Number(token)));

    if (existingInvites.length === 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invite token is invalid or expired' } }, { status: 400 });
    }

    const invite = existingInvites[0];

    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invite token is invalid or expired' } }, { status: 400 });
    }

    let userId: number;


    const result = await db.transaction(async (tx) => {
      const existingUserResult = await tx.select().from(users).where(eq(users.username, invite.email));

      if (existingUserResult.length > 0) {
        userId = existingUserResult[0].id;
      } else {
        if (!password) {
           return { error: 'Password required for new users', status: 400 };
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const [newUser] = await tx.insert(users).values({
          username: invite.email,
          passwordHash: passwordHash,
          role: invite.role
        }).returning();
        userId = newUser.id;
      }

      // Add member to project
      await tx.insert(projectMembers).values({
        projectId: invite.projectId,
        userId: userId,
        role: invite.role
      });

      await tx.delete(invites).where(eq(invites.id, invite.id));

      return { success: true, user: { id: userId.toString(), email: invite.email } };
    });

    if (result.error) {
       return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error } }, { status: result.status });
    }

    return NextResponse.json({ data: { user: result.user } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
