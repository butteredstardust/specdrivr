import { db } from '@/db';
import { agentSessions, specifications, tasks, agentConfig } from '@/db/schema';
import { eq, desc, inArray, and, count, sql } from 'drizzle-orm';

export interface SessionQuery {
  projectId?: number;
  specId?: number;
  status?: import('@/db/schema').SessionStatus;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export async function getEnrichedSessions(query: SessionQuery, allowedProjectIds: number[]) {
  const limit = query.limit ?? 50;
  const offset = query.offset ?? 0;

  const totalTasksSubq = db
    .select({ planId: tasks.planId, total: count().as('total') })
    .from(tasks)
    .groupBy(tasks.planId)
    .as('task_counts');

  const whereConditions = [];

  if (query.projectId) {
    // RBAC: reject requests for projects the caller is not a member of
    if (!allowedProjectIds.includes(query.projectId)) {
      return { data: [], count: 0 };
    }
    whereConditions.push(eq(agentSessions.projectId, query.projectId));
  } else {
    if (allowedProjectIds.length === 0) {
      return { data: [], count: 0 };
    }
    whereConditions.push(inArray(agentSessions.projectId, allowedProjectIds));
  }

  if (query.status) {
    whereConditions.push(eq(agentSessions.status, query.status));
  }

  if (query.specId) {
    whereConditions.push(eq(agentSessions.specId, query.specId));
  }

  if (query.search) {
    whereConditions.push(sql`${specifications.name} ILIKE ${'%' + query.search + '%'}`);
  }

  if (query.from) {
    whereConditions.push(sql`${agentSessions.startedAt} >= ${new Date(query.from).toISOString()}`);
  }

  if (query.to) {
    whereConditions.push(sql`${agentSessions.startedAt} <= ${new Date(query.to).toISOString()}`);
  }

  const [rows, countResult] = await Promise.all([
    db
      .select({
        session: agentSessions,
        specName: specifications.name,
        currentTaskExternalId: tasks.externalId,
        currentTaskTitle: tasks.title,
        totalTasks: totalTasksSubq.total,
        backend: agentConfig.backend,
      })
      .from(agentSessions)
      .leftJoin(specifications, eq(agentSessions.specId, specifications.id))
      .leftJoin(tasks, eq(agentSessions.currentTaskId, tasks.id))
      .leftJoin(totalTasksSubq, eq(agentSessions.planId, totalTasksSubq.planId))
      .leftJoin(agentConfig, eq(agentSessions.projectId, agentConfig.projectId))
      .where(whereConditions.length ? and(...whereConditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(agentSessions.startedAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(agentSessions)
      .leftJoin(specifications, eq(agentSessions.specId, specifications.id))
      .where(whereConditions.length ? and(...whereConditions) : undefined),
  ]);

  const enrichedSessions = rows.map((r) => ({
    ...r.session,
    startedAt: r.session.startedAt.toISOString(),
    endedAt: r.session.endedAt?.toISOString() ?? null,
    lastHeartbeatAt: r.session.lastHeartbeatAt?.toISOString() ?? null,
    specName: r.specName ?? null,
    currentTaskExternalId: r.currentTaskExternalId ?? null,
    currentTaskTitle: r.currentTaskTitle ?? null,
    totalTasks: r.totalTasks != null ? Number(r.totalTasks) : null,
    backend: r.backend ?? 'gemini',
  }));

  return {
    data: enrichedSessions,
    count: Number(countResult[0]?.count ?? 0),
  };
}
