import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { verifyAgentToken } from '@/lib/agent-auth';
import { agentLogRepository, agentSessionRepository } from '@/repositories';
import { handleApiError } from '@/lib/error-handler';

const bodySchema = z.object({
  line: z.string().max(4096),
  taskId: z.number().int().optional(),
  level: z.enum(['info', 'warn', 'error', 'debug']).default('info'),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await verifyAgentToken(request.headers.get('Authorization'));
  if (!authResult.success) {
    return authResult.response;
  }

  const { id: sessionId } = await params;
  const sId = parseInt(sessionId, 10);

  try {
    const body = bodySchema.parse(await request.json());

    // Verify session exists and belongs to the project
    const session = await agentSessionRepository.getById(sId);
    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    if (session.projectId !== authResult.token.projectId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Session does not belong to this project' } },
        { status: 403 }
      );
    }

    // Persist to DB (fire-and-forget — don't block the response)
    agentLogRepository
      .create({
        sessionId: sId,
        taskId: body.taskId,
        projectId: session.projectId,
        level: body.level,
        message: body.line,
        timestamp: new Date(),
      })
      .catch((err) => logger.error({ err }, 'Failed to persist agent log'));

    // Publish to Redis for live streaming
    const channel = `session:${sId}:logs`;
    const event = JSON.stringify({
      line: body.line,
      taskId: body.taskId,
      level: body.level,
      ts: Date.now(),
    });

    await redis.publish(channel, event);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
