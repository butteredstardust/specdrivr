import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { agentSessionRepository } from '@/repositories';
import { handleApiError } from '@/lib/error-handler';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { id } = await params;
  const sessionId = parseInt(id);

  try {
    const updated = await agentSessionRepository.update(sessionId, { status: 'cancelled', endedAt: new Date() });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
