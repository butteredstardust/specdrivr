import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, agentSessions, agentTokens } from '@/db/schema';
import { handleApiError } from '@/lib/error-handler';
import { eq, and, asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const prefix = token.slice(0, 10);

  try {
    // 1. Verify token
    const [agentToken] = await db.select().from(agentTokens).where(eq(agentTokens.prefix, prefix)).limit(1);
    if (!agentToken) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
    }

    const isValid = await bcrypt.compare(token, agentToken.tokenHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
    }

    // 2. Find next task (simplifed for now: first 'todo' task in an active session for the project)
    // In a full implementation, we'd check dependencies.
    const [nextTask] = await db.select()
      .from(tasks)
      .innerJoin(agentSessions, eq(tasks.planId, agentSessions.planId))
      .where(and(
        eq(agentSessions.projectId, agentToken.projectId!),
        eq(agentSessions.status, 'running'),
        eq(tasks.status, 'todo')
      ))
      .orderBy(asc(tasks.executionOrder))
      .limit(1);

    if (!nextTask) {
      return NextResponse.json({ success: true, data: null });
    }

    // 3. Mark as in_progress
    await db.update(tasks).set({ status: 'in_progress' }).where(eq(tasks.id, nextTask.tasks.id));

    return NextResponse.json({ success: true, data: nextTask.tasks });
  } catch (error) {
    return handleApiError(error);
  }
}
