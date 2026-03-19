import { db } from '@/db';
import { tasks, specVersions, specifications } from '@/db/schema';
import { count, eq, desc, sql } from 'drizzle-orm';

export interface SpecsQueryOptions {
  projectId: number;
  limit?: number;
  offset?: number;
}

export async function getEnrichedSpecs(options: SpecsQueryOptions) {
  const safeLimit = Math.min(options.limit ?? 50, 100);
  const safeOffset = options.offset ?? 0;

  const taskCountSubq = db
    .select({ specId: tasks.specId, total: count().as('total') })
    .from(tasks)
    .groupBy(tasks.specId)
    .as('task_counts');

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: specifications.id,
        name: specifications.name,
        status: specifications.status,
        currentVersionId: specifications.currentVersionId,
        createdAt: specifications.createdAt,
        updatedAt: specifications.updatedAt,
        taskCount: taskCountSubq.total,
        currentVersionNumber: specVersions.versionNumber,
      })
      .from(specifications)
      .leftJoin(taskCountSubq, eq(specifications.id, taskCountSubq.specId))
      .leftJoin(specVersions, eq(specifications.currentVersionId, specVersions.id))
      .where(eq(specifications.projectId, options.projectId))
      .orderBy(desc(specifications.createdAt))
      .limit(safeLimit)
      .offset(safeOffset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(specifications)
      .where(eq(specifications.projectId, options.projectId)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data: rows.map((r) => ({
      ...r,
      taskCount: r.taskCount ? Number(r.taskCount) : null,
      currentVersionNumber: r.currentVersionNumber ?? null,
    })),
    total,
  };
}
