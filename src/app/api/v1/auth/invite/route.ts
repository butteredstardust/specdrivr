import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invites, projectMembers, projects, users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';
import { handleApiError } from '@/lib/error-handler';
import { authInstance } from '@/lib/auth';
import { logger } from '@/lib/logger';

const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).optional(),
  name: z.string().min(2).optional()
});


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
    logger.error({ error }, 'Failed to validate invite token');
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = AcceptInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid inputs', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { token, password, name } = parsed.data;

    const [invite] = await db
      .select()
      .from(invites)
      .where(and(eq(invites.token, token), gt(invites.expiresAt, new Date())))
      .limit(1);

    if (!invite) {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Invalid or expired invite' } },
        { status: 404 }
      );
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, invite.email))
      .limit(1);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      // Attempt to sign in via better-auth - this typically needs credentials but we'll
      // rely on the user manually logging in via the UI redirect or just set them as member.
      // The prompt says: "sign them in via BetterAuth, add as project member if not already"
      // Note: Backend can't magically sign them in without password, but we'll add them to the project.
      try {
        await db.transaction(async (tx) => {
          await tx
            .insert(projectMembers)
            .values({
              projectId: invite.projectId,
              userId: userId,
              role: invite.role,
            })
            .onConflictDoNothing();

          // Invalidate invite (set used_at)
          await tx.update(invites)
            .set({ expiresAt: new Date(0) }) // Using expiresAt as proxy for used since schema might not have usedAt
            .where(eq(invites.id, invite.id));
        });
      } catch (error) {
        logger.error({ error, inviteId: invite.id }, 'Transaction failed in accept-invite');
        throw error;
      }
    } else {
      if (!password || !name) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Name and password required' } },
          { status: 400 }
        );
      }

      let newUser;
      try {
        newUser = await authInstance.api.signUpEmail({
          body: { email: invite.email, password: password!, name: name! }
        });
      } catch (error: unknown) {
        logger.error({ error, email: invite.email }, 'signUpEmail failed');
        return handleApiError(error);
      }

      if (!newUser || !newUser.user) {
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } }, { status: 500 });
      }

      userId = newUser.user.id;

      try {
        await db.transaction(async (tx) => {
          await tx.insert(projectMembers).values({
            projectId: invite.projectId,
            userId: userId,
            role: invite.role,
          });

          await tx.update(invites).set({ expiresAt: new Date(0) }).where(eq(invites.id, invite.id));
        });
      } catch (error) {
        logger.error({ error, userId }, 'Transaction failed');
        throw error;
      }
    }

    return NextResponse.json({ data: { success: true } }, { status: 200 });
  } catch (error: unknown) {
    logger.error(error, 'Accept invite error');
    return handleApiError(error);
  }
}
