// Infrastructure probe — direct db import is intentional (no repository needed)
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { redis } from '@/lib/redis';

async function bounded<T>(operation: Promise<T>, timeoutMs = 2000): Promise<T> {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Dependency check timed out')), timeoutMs)
    ),
  ]);
}

export async function GET() {
  let dbStatus = 'ok';
  let redisStatus = 'ok';

  try {
    await bounded(db.execute(sql`SELECT 1`));
  } catch {
    dbStatus = 'error';
  }

  try {
    await bounded(redis.ping());
  } catch {
    redisStatus = 'error';
  }

  const status = dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'error';

  return NextResponse.json(
    { success: status === 'ok', status, dependencies: { database: dbStatus, redis: redisStatus } },
    { status: status === 'ok' ? 200 : 503 }
  );
}
