import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationRepository } from '@/repositories/notification-repository';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get('projectId');
    const projectId = projectIdParam ? parseInt(projectIdParam, 10) : undefined;

    const list = await notificationRepository.getByUserId(session.user.id, projectId);
    return NextResponse.json({ data: list });
  } catch (error) {
    return handleApiError(error);
  }
}
