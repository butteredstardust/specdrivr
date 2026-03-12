import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { aggregateUsageForDate } from '@/lib/jobs/aggregate-usage';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = env.CRON_SECRET;

  if (!authHeader?.startsWith('Bearer ') || authHeader.replace('Bearer ', '') !== cronSecret) {
    logger.warn('Unauthorized attempt to trigger usage aggregation');
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing CRON_SECRET' } }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const dateArg = body.date;
    
    const targetDate = dateArg ? new Date(dateArg) : (() => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      return yesterday;
    })();

    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid date provided in request body' } }, { status: 400 });
    }

    const result = await aggregateUsageForDate(targetDate);

    logger.info({ 
      targetDate: targetDate.toISOString(), 
      projectsProcessed: result.projectsProcessed,
      snapshotsWritten: result.snapshotsWritten 
    }, 'Manual usage aggregation trigger complete');

    return NextResponse.json({ data: result });
  } catch (error: any) {
    logger.error({ error }, 'Failed to process manual usage aggregation request');
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
