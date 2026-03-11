import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agentSessions, agentTokens } from '@/db/schema';
import { handleApiError } from '@/lib/error-handler';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

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

    await db.update(agentSessions)
      .set({ lastHeartbeatAt: new Date() })
      .where(eq(agentSessions.id, sessionId));

    const [session] = await db.select().from(agentSessions).where(eq(agentSessions.id, sessionId)).limit(1);
    const shouldStop = session?.status !== 'running';

    return NextResponse.json({ data: { shouldStop } });
  } catch (error) {
    return handleApiError(error);
  }
}
