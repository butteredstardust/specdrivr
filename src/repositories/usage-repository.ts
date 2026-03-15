import { db } from '@/db';
import { usageSnapshots, type UsageSnapshotSelect } from '@/db/schema';
import { eq, gte, and, desc } from 'drizzle-orm';
import { BaseRepository } from './base-repository';

export class UsageRepository extends BaseRepository {
  async getByProjectId(projectId: number, days = 30): Promise<UsageSnapshotSelect[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return await this.executeQuery(() =>
      db
        .select()
        .from(usageSnapshots)
        .where(and(eq(usageSnapshots.projectId, projectId), gte(usageSnapshots.date, since)))
        .orderBy(desc(usageSnapshots.date))
    );
  }
}

export const usageRepository = new UsageRepository();
