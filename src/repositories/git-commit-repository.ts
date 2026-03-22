import { db } from '@/db';
import { gitCommits, type GitCommitInsert, type GitCommitSelect } from '@/db/schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';
import { BaseRepository } from './base-repository';

export class GitCommitRepository extends BaseRepository {
  async create(data: GitCommitInsert): Promise<GitCommitSelect> {
    return this.executeQuery(async () => {
      const [result] = await db.insert(gitCommits).values(data).returning();
      return result;
    });
  }

  async getFilteredByProject(
    projectId: number,
    options: { branch?: string },
    limit: number,
    offset: number
  ): Promise<GitCommitSelect[]> {
    return this.executeQuery(() => {
      const conditions: SQL[] = [eq(gitCommits.projectId, projectId)];
      if (options.branch) {
        conditions.push(eq(gitCommits.branch, options.branch));
      }
      return db
        .select()
        .from(gitCommits)
        .where(and(...conditions))
        .orderBy(desc(gitCommits.committedAt))
        .limit(limit)
        .offset(offset);
    });
  }

  async countFilteredByProject(projectId: number, options: { branch?: string }): Promise<number> {
    return this.executeQuery(async () => {
      const conditions: SQL[] = [eq(gitCommits.projectId, projectId)];
      if (options.branch) {
        conditions.push(eq(gitCommits.branch, options.branch));
      }

      const { sql } = await import('drizzle-orm');
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(gitCommits)
        .where(and(...conditions));
      return result?.count ?? 0;
    });
  }
}

export const gitCommitRepository = new GitCommitRepository();
