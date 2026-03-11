import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { userRepository } from '@/repositories';
import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const user = await userRepository.getById(userId);
    return NextResponse.json({ data: user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userId = session.user.id;
    const updated = await userRepository.update(userId, body);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
