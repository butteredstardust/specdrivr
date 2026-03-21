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
}

export const fileChangeRepository = new FileChangeRepository();
