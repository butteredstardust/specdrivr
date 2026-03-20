import { db } from '@/db';
import { planJobs, type PlanJobInsert, type PlanJobSelect as PlanJob } from '@/db/schema';
import { eq, and, asc, desc, lt, inArray } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError } from '@/lib/errors';

export class PlanJobRepository extends BaseRepository {
  async create(data: PlanJobInsert): Promise<PlanJob> {
    return await this.executeQuery(async () => {
      const [job] = await db.insert(planJobs).values(data).returning();
      return job as PlanJob;
    });
  }

  async getById(id: number): Promise<PlanJob | null> {
    return await this.executeQuery(async () => {
      const [job] = await db.select().from(planJobs).where(eq(planJobs.id, id)).limit(1);
      return (job as PlanJob) || null;
    });
  }

  async update(id: number, data: Partial<PlanJobInsert>): Promise<PlanJob> {
    return await this.executeQuery(async () => {
      const [updated] = await db
        .update(planJobs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(planJobs.id, id))
        .returning();

      if (!updated) {
        throw new NotFoundError(`Plan job with ID ${id} not found`);
      }

      return updated as PlanJob;
    });
  }

  /**
   * Atomically claims the next pending job.
   */
  async claimNext(): Promise<PlanJob | null> {
    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [nextJob] = await tx
          .select()
          .from(planJobs)
          .where(eq(planJobs.status, 'pending'))
          .orderBy(asc(planJobs.createdAt))
          .limit(1)
          .for('update', { skipLocked: true });

        if (!nextJob) return null;

        const [claimed] = await tx
          .update(planJobs)
          .set({
            status: 'running',
            startedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(planJobs.id, nextJob.id))
          .returning();

        return claimed as PlanJob;
      });
    });
  }

  async getPendingByProject(projectId: number): Promise<PlanJob[]> {
    return await this.executeQuery(async () => {
      return await db
        .select()
        .from(planJobs)
        .where(and(eq(planJobs.projectId, projectId), eq(planJobs.status, 'pending')))
        .orderBy(desc(planJobs.createdAt));
    });
  }

  async getActiveByProject(projectId: number): Promise<PlanJob[]> {
    return await this.executeQuery(async () => {
      return await db
        .select()
        .from(planJobs)
        .where(
          and(eq(planJobs.projectId, projectId), inArray(planJobs.status, ['pending', 'running']))
        )
        .orderBy(desc(planJobs.createdAt));
    });
  }

  /**
   * Recovers jobs that have been stuck in 'running' for too long.
   */
  async recoverStuckJobs(thresholdMinutes = 15): Promise<number> {
    return await this.executeQuery(async () => {
      const thresholdDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

      const stuckJobs = await db
        .update(planJobs)
        .set({
          status: 'failed',
          error: `Job timed out (stuck in running for >${thresholdMinutes}m)`,
          updatedAt: new Date(),
          completedAt: new Date(),
        })
        .where(and(eq(planJobs.status, 'running'), lt(planJobs.startedAt, thresholdDate)))
        .returning();

      return stuckJobs.length;
    });
  }
}

export const planJobRepository = new PlanJobRepository();
