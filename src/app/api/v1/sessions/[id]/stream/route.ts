import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { auth } from '@/lib/auth';
import { agentLogRepository, agentSessionRepository } from '@/repositories';
import { requireMember } from '@/lib/rbac';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // 1. Auth — session cookie required
  const session = await auth();
  if (!session) {
    logger.info('[SSE] Unauthorized access attempt');
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
  const history = await agentLogRepository.findBySessionId(sId, { limit: 200 });
  const chronologicalHistory = [...history].reverse();

  // 4. Set up SSE response stream
  const encoder = new TextEncoder();

  // Create a dedicated Redis subscriber
  const subscriber = new Redis(env.REDIS_URL || 'redis://localhost:6379');
  const logChannel = `session:${sId}:logs`;
  const updateChannel = `session:${sId}:updates`;
  const eventChannel = `session:${sId}:events`;

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
            id: String(log.id),
            line: log.message,
            taskId: log.taskId,
            level: log.level,
            ts: log.timestamp instanceof Date ? log.timestamp.getTime() : Date.now(),
          }),
          'log'
        );
      }
      sendEvent(JSON.stringify({ type: 'history_end' }), 'history_end');

      // 3. Subscribe to live events
      await subscriber.subscribe(logChannel, updateChannel, eventChannel);

      subscriber.on('message', (ch: string, message: string) => {
        if (ch === logChannel) {
          try {
            const data = JSON.parse(message);
            // Ensure ID is present for live messages too
            if (!data.id) data.id = `live-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            sendEvent(JSON.stringify(data), 'log');
          } catch {
            sendEvent(message, 'log');
          }
        } else if (ch === eventChannel) {
          // High-level agent events
          sendEvent(message, 'event');
        } else if (ch === updateChannel) {
          // This is a status/data update
          try {
            sendEvent(message, 'update');
          } catch {
            sendEvent(JSON.stringify({ type: 'update' }), 'update');
          }
        }
      });

      // 4. Handle client disconnect
      request.signal.addEventListener('abort', () => {
        subscriber.unsubscribe(logChannel, updateChannel, eventChannel);
        subscriber.quit();
        try {
          controller.close();
        } catch {
          // ignore already closed
        }
      });
    },
    cancel() {
      subscriber.unsubscribe(logChannel, updateChannel, eventChannel);
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
