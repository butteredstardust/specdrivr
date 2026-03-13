import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { redis } from '@/lib/redis';

export async function GET() {
  let dbStatus = 'ok';
  let redisStatus = 'ok';

  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = 'error';
  }

  try {
    await redis.ping();
  } catch {
    redisStatus = 'error';
  }

  const status = dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'error';

  return NextResponse.json(
    { success: true, data: { status, db: dbStatus, redis: redisStatus } },
    { status: status === 'ok' ? 200 : 503 }
  );
}
