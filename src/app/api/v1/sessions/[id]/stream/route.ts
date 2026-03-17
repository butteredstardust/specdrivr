import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { authInstance } from '@/lib/auth';
import { agentLogRepository, agentSessionRepository } from '@/repositories';
import { requireMember } from '@/lib/rbac';
import { headers } from 'next/headers';
import { env } from '@/lib/env';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // 1. Auth — session cookie required
  const session = await authInstance.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Verify user is member of the project owning this session
  const { id: sessionId } = await params;
  const sId = parseInt(sessionId, 10);
  const agentSession = await agentSessionRepository.getById(sId);
  if (!agentSession) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { allowed } = await requireMember(session.user.id, agentSession.projectId);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Send recent log history first (last 200 lines from agent_logs)
  // Note: findBySessionId returns latest first, we want chronological for the stream
  const history = await agentLogRepository.findBySessionId(sId, { limit: 200 });
  const chronologicalHistory = [...history].reverse();

  // 4. Set up SSE response stream
  const encoder = new TextEncoder();

  // Create a dedicated Redis subscriber (must be a separate connection — ioredis requirement)
  const subscriber = new Redis(env.REDIS_URL || 'redis://localhost:6379');
  const channel = `session:${sId}:logs`;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string, event?: string) => {
        const eventStr = event ? `event: ${event}\n` : '';
        controller.enqueue(encoder.encode(`${eventStr}data: ${data}\n\n`));
      };

      // 1. Send connection confirmation
      sendEvent(JSON.stringify({ type: 'connected', sessionId: sId }), 'connected');

      // 2. Replay recent history
      for (const log of chronologicalHistory) {
        sendEvent(
          JSON.stringify({
            line: log.message,
            taskId: log.taskId,
            level: log.level,
            ts: log.timestamp.getTime(),
          }),
          'log'
        );
      }
      sendEvent(JSON.stringify({ type: 'history_end' }), 'history_end');

      // 3. Subscribe to live events
      await subscriber.subscribe(channel);

      subscriber.on('message', (ch: string, message: string) => {
        if (ch === channel) {
          sendEvent(message, 'log');
        }
      });

      // 4. Handle client disconnect
      request.signal.addEventListener('abort', () => {
        subscriber.unsubscribe(channel);
        subscriber.quit();
        try {
          controller.close();
        } catch {
          // ignore already closed
        }
      });
    },
    cancel() {
      subscriber.unsubscribe(channel);
      subscriber.quit();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
