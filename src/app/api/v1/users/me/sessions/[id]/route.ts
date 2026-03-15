import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sessionRepository } from '@/repositories/session-repository';
import { handleApiError } from '@/lib/error-handler';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // Prevent revoking the current session via this endpoint
    if (id === session.session.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Cannot revoke your current session' } },
        { status: 400 }
      );
    }

    // Verify the session belongs to this user before deleting
    const target = await sessionRepository.findByIdAndUserId(id, session.user.id);

    if (!target) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    await sessionRepository.deleteById(id);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
