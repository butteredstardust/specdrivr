import { db } from '@/db';
import { apiRequestLogs, type ApiRequestLogSelect } from '@/db/schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';
import { BaseRepository } from './base-repository';

export class ApiRequestLogRepository extends BaseRepository {
  async getFilteredByProject(
    projectId: number,
    options: { endpoint?: string; statusCode?: number },
    limit: number,
    offset: number
  ): Promise<ApiRequestLogSelect[]> {
    return this.executeQuery(() => {
      const conditions: SQL[] = [eq(apiRequestLogs.projectId, projectId)];
      if (options.endpoint) {
        conditions.push(eq(apiRequestLogs.endpoint, options.endpoint));
      }
      if (options.statusCode) {
        conditions.push(eq(apiRequestLogs.statusCode, options.statusCode));
      }
      return db
        .select()
        .from(apiRequestLogs)
        .where(and(...conditions))
        .orderBy(desc(apiRequestLogs.requestedAt))
        .limit(limit)
        .offset(offset);
    });
  }

  async countFilteredByProject(
    projectId: number,
    options: { endpoint?: string; statusCode?: number }
  ): Promise<number> {
    return this.executeQuery(async () => {
      const conditions: SQL[] = [eq(apiRequestLogs.projectId, projectId)];
      if (options.endpoint) {
        conditions.push(eq(apiRequestLogs.endpoint, options.endpoint));
      }
      if (options.statusCode) {
        conditions.push(eq(apiRequestLogs.statusCode, options.statusCode));
      }

      const { sql } = await import('drizzle-orm');
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(apiRequestLogs)
        .where(and(...conditions));
      return result?.count ?? 0;
    });
  }
}

export const apiRequestLogRepository = new ApiRequestLogRepository();
