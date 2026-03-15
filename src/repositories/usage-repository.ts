import { db } from '@/db';
import { usageSnapshots, type UsageSnapshotSelect } from '@/db/schema';
import { eq, gte, and, desc, sql } from 'drizzle-orm';
import { BaseRepository } from './base-repository';

export class UsageRepository extends BaseRepository {
  async getByProjectId(
    projectId: number,
    options: { days?: number; page?: number; limit?: number } = {}
  ): Promise<{
    data: UsageSnapshotSelect[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { days = 30, page = 1, limit = 50 } = options;
    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [rows, countResult] = await Promise.all([
      this.executeQuery(() =>
        db
          .select()
          .from(usageSnapshots)
          .where(and(eq(usageSnapshots.projectId, projectId), gte(usageSnapshots.date, since)))
          .orderBy(desc(usageSnapshots.date))
          .limit(safeLimit)
          .offset(offset)
      ),
      this.executeQuery(() =>
        db
          .select({ count: sql<number>`count(*)` })
          .from(usageSnapshots)
          .where(and(eq(usageSnapshots.projectId, projectId), gte(usageSnapshots.date, since)))
      ),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return {
      data: rows,
      meta: { page, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }
}

export const usageRepository = new UsageRepository();
