import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { invites, projectMembers } from '@/db/schema';
import { userRepository, projectRepository } from '@/repositories';
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
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { token, password, name } = parsed.data;

    const existingInvites = await db.select().from(invites).where(eq(invites.id, Number(token)));

    if (existingInvites.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invite token is invalid or expired' } },
        { status: 400 }
      );
    }

    const invite = existingInvites[0];

    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invite token is invalid or expired' } },
        { status: 400 }
      );
    }

    let user: any = null;

    const result = await db.transaction(async (tx) => {
      // 1. Check if user already exists
      user = await userRepository.getByEmail(invite.email);

      if (!user) {
        if (!password) {
           throw new Error('PASSWORD_REQUIRED');
        }
        
        // Use Better Auth server API to create the user properly 
        // Note: In a transaction, we generally prefer Repository if it uses the same tx
        // However, Better Auth doesn't easily participate in external drizzle transactions for signUpEmail
        // So we will create the user first, then proceed with the transaction for project membership
      }
      return { existing: !!user };
    });

    // If user doesn't exist, create them via Better Auth
    if (!user) {
        const signupResult: any = await authInstance.api.signUpEmail({
            body: {
                email: invite.email,
                password: password!,
                name: name || invite.email.split("@")[0],
                role: invite.role,
            }
        });
        user = signupResult.user;
        
        // Mark as verified since they accepted an invite link
        await userRepository.update(Number(user.id), { emailVerified: true } as any);
    }

    // 2. Add member to project (this can be a separate transaction or direct write)
    await db.transaction(async (tx) => {
        await tx.insert(projectMembers).values({
            projectId: invite.projectId,
            userId: Number(user.id),
            role: invite.role
        });

        await tx.delete(invites).where(eq(invites.id, invite.id));
    });

    return NextResponse.json({ success: true, data: { user: { id: user.id.toString(), email: user.email } } }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'PASSWORD_REQUIRED') {
        return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'Password required for new users' } },
            { status: 400 }
        );
    }
    return handleApiError(error);
  }
}
