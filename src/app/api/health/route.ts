import { NextResponse } from 'next/server';
import { db } from '@/db';
import { redis } from '@/lib/redis';
import { sql, desc } from 'drizzle-orm';
import { agentSessions } from '@/db/schema';

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    status: 'ok',
    git: 'unknown',
    api: 'ok',
    agent: 'unknown',
    db: 'ok',
    redis: 'ok'
  };

  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    result.db = 'error';
    result.status = 'error';
  }

  try {
    await redis.ping();
  } catch {
    result.redis = 'error';
    result.status = 'error';
  }

  try {
    const latestSession = await db.query.agentSessions.findFirst({
      orderBy: [desc(agentSessions.startedAt)],
    });
    if (latestSession?.startedAt) {
      const diff = Date.now() - latestSession.startedAt.getTime();
      result.agent = diff < 90_000 ? 'ok' : 'degraded';
      if (result.agent === 'degraded' && result.status === 'ok') result.status = 'degraded';
    }
  } catch {
    result.agent = 'error';
  }

  return NextResponse.json({ data: result }, { status: result.status === 'error' ? 503 : 200 });
}