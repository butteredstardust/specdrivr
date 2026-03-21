'use server';

import { revalidatePath } from 'next/cache';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/rbac';
import { z } from 'zod';

const terminateAgentSessionSchema = z.object({
  sessionId: z.coerce.number().positive(),
});

export async function terminateAgentSessionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    sessionId: Number(formData.get('sessionId')),
  };

  const result = terminateAgentSessionSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const agentSession = await agentSessionRepository.getById(result.data.sessionId);
  if (!agentSession) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Agent session not found' } };
  }

  const { allowed } = await requireAdmin(session.user.id, agentSession.projectId);
  if (!allowed) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'You must be a project admin to terminate sessions' },
    };
  }

  try {
    await agentSessionRepository.update(result.data.sessionId, {
      status: 'cancelled',
      errorMessage: 'Session manually terminated by user',
    });

    revalidatePath(`/projects/${agentSession.projectId}/agents`);
    return { success: true };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
        sessionId: result.data.sessionId,
      },
      'Failed to terminate agent session'
    );
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to terminate agent session' },
    };
  }
}
