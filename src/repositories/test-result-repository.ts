import { db } from '@/db';
import { testResults, tasks, plans, specifications, type TestResultSelect } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { BaseRepository } from './base-repository';

export class TestResultRepository extends BaseRepository {
  async create(data: {
    taskId: number;
    success: boolean;
    logs?: string;
  }): Promise<TestResultSelect> {
    return this.executeQuery(async () => {
      const [result] = await db
        .insert(testResults)
        .values({
          taskId: data.taskId,
          success: data.success,
          logs: data.logs ?? null,
        })
        .returning();
      return result;
    });
  }

  async getLatestByProject(projectId: number): Promise<TestResultSelect[]> {
    return this.executeQuery(async () => {
      const rows = await db
        .select({
          testResult: testResults,
        })
        .from(testResults)
        .innerJoin(tasks, eq(testResults.taskId, tasks.id))
        .innerJoin(plans, eq(tasks.planId, plans.id))
        .innerJoin(specifications, eq(plans.specId, specifications.id))
        .where(eq(specifications.projectId, projectId))
        .orderBy(desc(testResults.createdAt))
        .limit(100);

      return rows.map((r) => r.testResult);
    });
  }
}

export const testResultRepository = new TestResultRepository();
