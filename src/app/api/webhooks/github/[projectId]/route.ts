import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agentConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(req: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;

    const config = await db.query.agentConfig.findFirst({
      where: eq(agentConfig.projectId, projectId),
    });

    if (!config || !config.githubWebhookSecret) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Webhook secret not configured' } }, { status: 401 });
    }

    const sig = req.headers.get('x-hub-signature-256') ?? '';
    const body = await req.text();

    const expected = `sha256=${crypto.createHmac('sha256', config.githubWebhookSecret).update(body).digest('hex')}`;

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid signature' } }, { status: 401 });
    }

    // Webhook logic goes here

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to process webhook' } }, { status: 500 });
  }
}
