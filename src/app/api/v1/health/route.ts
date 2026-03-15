import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import { auth } from '@/lib/auth';
import { agentConfigRepository } from '@/repositories/agent-config-repository';
import { agentSessions } from '@/db/schema';
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

  // Project-specific data requires an authenticated session
  const session = await auth();
  if (!session || !projectId) {
    return NextResponse.json({
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk,
      redis: redisOk,
      git: false,
      agentLastSeen: null,
    });
  }

  const pid = parseInt(projectId, 10);
  if (isNaN(pid) || !dbOk) {
    return NextResponse.json({
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk,
      redis: redisOk,
      git: false,
      agentLastSeen: null,
    });
  }

  let gitConfigured = false;
  let agentLastSeen: string | null = null;

  try {
    const cfg = await agentConfigRepository.getByProjectId(pid);
    gitConfigured = !!cfg?.githubToken;
  } catch {
    /* ignore */
  }

  try {
    // No repository exists for this read-only infrastructure probe
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

  return NextResponse.json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk,
    redis: redisOk,
    git: gitConfigured,
    agentLastSeen,
  });
}
