import { NextRequest, NextResponse } from 'next/server';
import { agentSessionRepository } from '@/repositories';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UpdateSessionSchema = z.object({
  status: z.enum(['running', 'paused', 'completed', 'failed', 'cancelled']).optional(),
  tasksExecuted: z.number().int().nonnegative().optional(),
  tasksSucceeded: z.number().int().nonnegative().optional(),
  tasksFailed: z.number().int().nonnegative().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const sessionId = parseInt(id, 10);

    const agentSession = await agentSessionRepository.getById(sessionId);
    if (!agentSession) {
      throw new NotFoundError(`Agent session with ID ${sessionId} not found`);
    }

    return NextResponse.json({ success: true, data: agentSession });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const sessionId = parseInt(id, 10);

    const body = await request.json();
    const parsed = UpdateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid session data', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const updatedSession = await agentSessionRepository.update(sessionId, parsed.data);

    return NextResponse.json({ success: true, data: updatedSession });
  } catch (error) {
    return handleApiError(error);
  }
}
