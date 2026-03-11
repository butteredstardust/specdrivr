import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { invites, projectMembers } from '@/db/schema';
import { userRepository } from '@/repositories';
import { eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/error-handler';
import { authInstance } from '@/lib/auth';

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
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { token, password, name } = parsed.data;

    const existingInvites = await db.select().from(invites).where(eq(invites.id, Number(token)));

    if (existingInvites.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invite token is invalid or expired' } },
        { status: 400 }
      );
    }

    const invite = existingInvites[0];

    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invite token is invalid or expired' } },
        { status: 400 }
      );
    }

    let user: import('@/db/schema').UserSelect | null = null;

    await db.transaction(async () => {
      // 1. Check if user already exists
      user = await userRepository.getByEmail(invite.email);

      if (!user) {
        if (!password) {
           throw new Error('PASSWORD_REQUIRED');
        }
      }
    });

    // If user doesn't exist, create them via Better Auth
    if (!user) {
        const signupResult = await authInstance.api.signUpEmail({
            body: {
                email: invite.email,
                password: password!,
                name: name || invite.email.split("@")[0],
            }
        });
        user = signupResult.user as unknown as import('@/db/schema').UserSelect;
        
        // Mark as verified since they accepted an invite link
        await userRepository.update(user.id, { emailVerified: true });
    }

    if (!user) {
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'User creation failed' } }, { status: 500 });
    }

    // 2. Add member to project (this can be a separate transaction or direct write)
    await db.transaction(async (tx) => {
        await tx.insert(projectMembers).values({
            projectId: invite.projectId,
            userId: user!.id,
            role: invite.role
        });

        await tx.delete(invites).where(eq(invites.id, invite.id));
    });

    if (!user) {
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create or find user' } }, { status: 500 });
    }

    return NextResponse.json({ data: { user: { id: user.id.toString(), email: user.email } } }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'PASSWORD_REQUIRED') {
        return NextResponse.json(
            { error: { code: 'VALIDATION_ERROR', message: 'Password required for new users' } },
            { status: 400 }
        );
    }
    return handleApiError(error);
  }
}
