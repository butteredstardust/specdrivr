import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agentTokens } from '@/db/schema';
import { handleApiError } from '@/lib/error-handler';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { taskRepository } from '@/repositories/task-repository';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const prefix = token.slice(0, 10);

  try {
    // 1. Verify token
    const [agentToken] = await db.select().from(agentTokens).where(eq(agentTokens.prefix, prefix)).limit(1);
    if (!agentToken) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
    }

    const isValid = await bcrypt.compare(token, agentToken.tokenHash);
    if (!isValid) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
    }

    if (!agentToken.projectId) {
      return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Token not associated with a project' } }, { status: 500 });
    }

    // 2. Find and claim next task
    const nextTask = await taskRepository.claimNextTaskForProject(agentToken.projectId);

    return NextResponse.json({ data: nextTask });
  } catch (error) {
    return handleApiError(error);
  }
}
