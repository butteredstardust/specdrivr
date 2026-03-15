// Infrastructure probe — direct db/redis import intentional (no repository needed)
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import { agentConfig, agentSessions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  let dbOk = false;
  try {
    await db.execute(sql`SELECT 1`);
    dbOk = true;
  } catch {
    /* unreachable */
  }

  let redisOk = false;
  try {
    await redis.ping();
    redisOk = true;
  } catch {
    /* unreachable */
  }

  let gitConfigured = false;
  let agentLastSeen: string | null = null;

  if (projectId) {
    const pid = parseInt(projectId, 10);
    if (!isNaN(pid) && dbOk) {
      try {
        const [cfg] = await db
          .select({ githubToken: agentConfig.githubToken })
          .from(agentConfig)
          .where(eq(agentConfig.projectId, pid))
          .limit(1);
        gitConfigured = !!cfg?.githubToken;
      } catch {
        /* ignore */
      }

      try {
        const [lastSession] = await db
          .select({ lastHeartbeatAt: agentSessions.lastHeartbeatAt })
          .from(agentSessions)
          .where(eq(agentSessions.projectId, pid))
          .orderBy(desc(agentSessions.lastHeartbeatAt))
          .limit(1);
        agentLastSeen = lastSession?.lastHeartbeatAt?.toISOString() ?? null;
      } catch {
        /* ignore */
      }
    }
  }

  return NextResponse.json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk,
    redis: redisOk,
    git: gitConfigured,
    agentLastSeen,
  });
}
