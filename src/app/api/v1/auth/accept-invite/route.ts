import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { invites, projectMembers, users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { handleApiError } from '@/lib/error-handler';
import { authInstance } from '@/lib/auth';
import { logger } from '@/lib/logger';

const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).optional(), // required for new users only
  name: z.string().min(2).optional()      // required for new users only
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = AcceptInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid inputs', 
            details: parsed.error.errors 
          } 
        },
        { status: 400 }
      );
    }

    const { token, password, name } = parsed.data;

    // 1. Validate invite token
    const [invite] = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.token, token),
          gt(invites.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!invite) {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Invite token not found or expired' } },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, invite.email))
      .limit(1);

    let userId: string;

    if (existingUser) {
      // Path B — Existing user
      userId = existingUser.id;

      try {
        await db.transaction(async (tx) => {
          // Insert into project_members
          await tx
            .insert(projectMembers)
            .values({
              projectId: invite.projectId,
              userId: userId,
              role: invite.role,
            })
            .onConflictDoNothing();

          // Delete the invite row
          await tx.delete(invites).where(eq(invites.id, invite.id));
        });
      } catch (error) {
        logger.error({ error, inviteId: invite.id }, 'Transaction failed in accept-invite (Path B)');
        throw error;
      }
    } else {
      // Path A — New user
      if (!password || !name) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Name and password required for new users' } },
          { status: 400 }
        );
      }

      // Create user via BetterAuth
      let newUser;
      try {
        newUser = await authInstance.api.signUpEmail({
          email: invite.email,
          password: password,
          name: name,
        });
      } catch (error: unknown) {
        logger.error({ error, email: invite.email }, 'BetterAuth signUpEmail failed in accept-invite');
        return handleApiError(error);
      }

      if (!newUser || !newUser.user) {
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Failed to create user account' } },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      try {
        await db.transaction(async (tx) => {
          // Insert into project_members
          await tx.insert(projectMembers).values({
            projectId: invite.projectId,
            userId: userId,
            role: invite.role,
          });

          // Delete the invite row
          await tx.delete(invites).where(eq(invites.id, invite.id));
        });
      } catch (error) {
        logger.error({ error, userId, inviteId: invite.id }, 'Transaction failed in accept-invite (Path A), cleaning up orphaned user');
        
        // Handle atomicity: if transaction fails, delete the orphaned user account
        try {
          // BetterAuth doesn't expose a direct delete user API via authInstance.api easily for server side if not using a specific plugin.
          // We'll delete directly from the database to ensure atomicity.
          await db.delete(users).where(eq(users.id, userId));
        } catch (cleanupError) {
          logger.error({ cleanupError, userId }, 'Failed to cleanup orphaned user after transaction failure');
        }
        
        throw error;
      }
    }

    return NextResponse.json(
      { 
        data: { 
          user: { 
            id: userId, 
            email: invite.email 
          } 
        } 
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error(error, 'Accept invite error');
    return handleApiError(error);
  }
}
