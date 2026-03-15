import 'server-only';
import { NextResponse } from 'next/server';
import { inviteRepository } from '@/repositories/invite-repository';
import { handleApiError } from '@/lib/error-handler';
import { authInstance } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).optional(),
  name: z.string().min(2).optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Missing token' } },
        { status: 400 }
      );
    }

    const invite = await inviteRepository.getByTokenWithProject(token);
    if (!invite) {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' } },
        { status: 400 }
      );
    }

    const existingUser = await inviteRepository.checkUserExists(invite.email);

    return NextResponse.json({
      data: {
        email: invite.email,
        projectName: invite.projectName,
        isExistingUser: !!existingUser,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to validate invite token');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

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
            details: parsed.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { token, password, name } = parsed.data;

    const invite = await inviteRepository.getByToken(token);
    if (!invite) {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Invalid or expired invite' } },
        { status: 404 }
      );
    }

    const existingUser = await inviteRepository.checkUserExists(invite.email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      await inviteRepository.accept(invite.id, userId, invite.projectId, invite.role);
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
          body: { email: invite.email, password, name },
        });
      } catch (error: unknown) {
        logger.error({ error, email: invite.email }, 'signUpEmail failed');
        return handleApiError(error);
      }

      if (!newUser || !newUser.user) {
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      await inviteRepository.accept(invite.id, userId, invite.projectId, invite.role);
    }

    return NextResponse.json({ data: { success: true } }, { status: 200 });
  } catch (error: unknown) {
    logger.error(error, 'Accept invite error');
    return handleApiError(error);
  }
}
