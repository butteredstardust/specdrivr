import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sessionRepository } from '@/repositories/session-repository';
import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    const userSessions = await sessionRepository.getByUserId(session.user.id);

    return NextResponse.json({
      data: {
        sessions: userSessions,
        currentSessionId: session.session.id,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/v1/users/me/sessions — revoke all sessions except the current one
export async function DELETE() {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    await sessionRepository.deleteOtherSessions(session.user.id, session.session.id);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
