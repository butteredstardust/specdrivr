import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tokenRepository } from '@/repositories/token-repository';
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
    const tokenId = parseInt(id, 10);

    if (isNaN(tokenId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid token ID' } },
        { status: 400 }
      );
    }

    // Verify the token belongs to this user
    const token = await tokenRepository.findByIdAndUserId(tokenId, session.user.id);

    if (!token) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Token not found' } },
        { status: 404 }
      );
    }

    await tokenRepository.revoke(tokenId);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
