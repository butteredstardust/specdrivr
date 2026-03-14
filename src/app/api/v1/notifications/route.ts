import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationRepository } from '@/repositories/notification-repository';
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
    const list = await notificationRepository.getByUserId(session.user.id);
    return NextResponse.json({ data: list });
  } catch (error) {
    return handleApiError(error);
  }
}
