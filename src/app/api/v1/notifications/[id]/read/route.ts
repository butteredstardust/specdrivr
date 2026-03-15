import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationRepository } from '@/repositories/notification-repository';
import { handleApiError } from '@/lib/error-handler';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const found = await notificationRepository.markAsRead(Number(id), session.user.id);
    if (!found) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Notification not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
