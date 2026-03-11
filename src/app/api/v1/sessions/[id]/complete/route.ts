import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agentSessions, agentTokens, agentEvents } from '@/db/schema';
import { handleApiError } from '@/lib/error-handler';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const completeSchema = z.object({
  totalPromptTokens: z.number().int().nonnegative(),
  totalCompletionTokens: z.number().int().nonnegative(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const prefix = token.slice(0, 10);
  const { id } = await params;
  const sessionId = parseInt(id);

  try {
    const [agentToken] = await db.select().from(agentTokens).where(eq(agentTokens.prefix, prefix)).limit(1);
    if (!agentToken) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
    }

    const isValid = await bcrypt.compare(token, agentToken.tokenHash);
    if (!isValid) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
    }

    const body = await request.json();
    const { totalPromptTokens, totalCompletionTokens } = completeSchema.parse(body);

    // Update session status
    await db.update(agentSessions)
      .set({ 
        status: 'completed', 
        endedAt: new Date(),
        totalPromptTokens,
        totalCompletionTokens,
        // totalCostUsd: calculate(totalPromptTokens, totalCompletionTokens)
      })
      .where(eq(agentSessions.id, sessionId));

    // Log event
    await db.insert(agentEvents).values({
      sessionId,
      eventType: 'SESSION_COMPLETED',
      message: 'Agent session completed successfully',
      metadata: { totalPromptTokens, totalCompletionTokens }
    });

    return NextResponse.json({ data: { status: 'completed' } });
  } catch (error) {
    return handleApiError(error);
  }
}
