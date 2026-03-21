import { db } from '@/db';
import { fileChanges, type FileChangeSelect } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { BaseRepository } from './base-repository';

export class FileChangeRepository extends BaseRepository {
  async getByTaskId(taskId: number): Promise<FileChangeSelect[]> {
    return this.executeQuery(() =>
      db
        .select()
        .from(fileChanges)
        .where(eq(fileChanges.taskId, taskId))
        .orderBy(desc(fileChanges.createdAt))
    );
  }

  async createMany(data: import('@/db/schema').FileChangeInsert[]): Promise<FileChangeSelect[]> {
    if (data.length === 0) return [];
    return this.executeQuery(async () => {
      return await db.insert(fileChanges).values(data).returning();
    });
  }
}

export const fileChangeRepository = new FileChangeRepository();
