import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agentEvents, agentSessions, planJobs } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { memberRepository } from '@/repositories';
import { AuthorizationError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    const role = await memberRepository.getRoleForUser(session.user.id, projectId);
    if (!role) {
      throw new AuthorizationError('You do not have access to this project');
    }

    // Combine high-level events and job states
    // 1. Get recent agent events
    const events = await db
      .select({
        id: agentEvents.id,
        type: sql<string>`'event'`,
        eventType: agentEvents.eventType,
        message: agentEvents.message,
        metadata: agentEvents.metadata,
        createdAt: agentEvents.createdAt,
        sessionId: agentEvents.sessionId,
        specId: agentEvents.specId,
      })
      .from(agentEvents)
      .innerJoin(agentSessions, eq(agentEvents.sessionId, agentSessions.id))
      .where(eq(agentSessions.projectId, projectId))
      .orderBy(desc(agentEvents.createdAt))
      .limit(20);

    // 2. Get recent failed jobs (those not necessarily in events)
    const failedJobs = await db
      .select({
        id: planJobs.id,
        type: sql<string>`'job'`,
        eventType: sql<string>`'JOB_FAILED'`,
        message: sql<string>`'Background ' || ${planJobs.type} || ' failed'`,
        metadata: sql<
          Record<string, unknown>
        >`json_build_object('error', ${planJobs.error}, 'jobType', ${planJobs.type})`,
        createdAt: planJobs.updatedAt,
        sessionId: sql<number | null>`null`,
        specId: planJobs.specId,
      })
      .from(planJobs)
      .where(and(eq(planJobs.projectId, projectId), eq(planJobs.status, 'failed')))
      .orderBy(desc(planJobs.updatedAt))
      .limit(10);

    // Combine and sort
    const activity = [...events, ...failedJobs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ data: activity.slice(0, 20) });
  } catch (error) {
    return handleApiError(error);
  }
}
