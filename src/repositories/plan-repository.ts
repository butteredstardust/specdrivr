import { db } from '@/db';
import { plans, specifications, agentSessions, planReviews, auditLog, type PlanSelect as Plan } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, DatabaseError } from '@/lib/errors';

export { type PlanSelect as Plan } from '@/db/schema';

export class PlanRepository extends BaseRepository {
  async getAll(): Promise<Plan[]> {
    return await this.execQuery(() =>
      db.select().from(plans)
    );
  }

  async getById(id: number): Promise<Plan | null> {
    const result = await this.execQuery(() =>
      db.select().from(plans).where(eq(plans.id, id)).limit(1)
    );

    return result[0] || null;
  }

  async getBySpecId(specId: number): Promise<Plan[]> {
    return await this.execQuery(() =>
      db.select().from(plans).where(eq(plans.specId, specId))
    );
  }

  async getBySpecVersionId(specVersionId: number): Promise<Plan | null> {
    const result = await this.execQuery(() =>
      db.select().from(plans).where(eq(plans.specVersionId, specVersionId)).limit(1)
    );

    return result[0] || null;
  }

  async create(data: Partial<import('@/db/schema').PlanInsert>): Promise<Plan> {
    if (!data.specId) {
      throw new DatabaseError('specId is required to create a plan');
    }

    const [plan] = await this.execQuery(() =>
      db.insert(plans).values(data as import('@/db/schema').PlanInsert).returning()
    );

    if (!plan) {
      throw new DatabaseError('Failed to create plan');
    }

    return plan;
  }

  async update(id: number, data: Partial<import('@/db/schema').PlanInsert>): Promise<Plan> {
    const [updatedPlan] = await this.execQuery(() =>
      db
        .update(plans)
        .set({ ...data })
        .where(eq(plans.id, id))
        .returning()
    );

    if (!updatedPlan) {
      throw new NotFoundError(`Plan with ID ${id} not found`);
    }

    return updatedPlan;
  }

  async delete(id: number): Promise<void> {
    const result = await this.execQuery(() =>
      db.delete(plans).where(eq(plans.id, id)).returning()
    );

    if (result.length === 0) {
      throw new NotFoundError(`Plan with ID ${id} not found`);
    }
  }

  /**
   * Approves a plan and starts a session in a transaction.
   */
  async approvePlan(data: {
    planId: number;
    userId: string;
    notes?: string | null;
  }): Promise<{ plan: Plan; sessionId: number }> {
    const plan = await this.getById(data.planId);
    if (!plan) throw new NotFoundError(`Plan with ID ${data.planId} not found`);

    return await this.execQuery(async () => {
      return await db.transaction(async (tx) => {
        // 1. Update plan status
        const [updatedPlan] = await tx.update(plans)
          .set({ 
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: data.userId,
            reviewerNotes: data.notes
          })
          .where(eq(plans.id, data.planId))
          .returning();

        // 2. Add to plan_reviews
        await tx.insert(planReviews).values({
          planId: data.planId,
          userId: data.userId,
          action: 'approved',
          notes: data.notes,
        });

        // 3. Update specification status
        await tx.update(specifications)
          .set({ status: 'executing' })
          .where(eq(specifications.id, plan.specId));

        // 4. Create agent session
        const [session] = await tx.insert(agentSessions).values({
          projectId: (await tx.select({ pid: specifications.projectId }).from(specifications).where(eq(specifications.id, plan.specId)).limit(1))[0].pid,
          specId: plan.specId,
          planId: plan.id,
          status: 'running',
          startedBy: data.userId,
        }).returning();

        // 5. Audit log
        await tx.insert(auditLog).values({
          projectId: (await tx.select({ pid: specifications.projectId }).from(specifications).where(eq(specifications.id, plan.specId)).limit(1))[0].pid,
          userId: data.userId,
          action: 'approve_plan',
          targetType: 'plan',
          targetId: String(data.planId),
          detail: { sessionId: session.id },
        });

        return { plan: updatedPlan, sessionId: session.id };
      });
    });
  }

  /**
   * Rejects a plan in a transaction.
   */
  async rejectPlan(data: {
    planId: number;
    userId: string;
    notes: string;
  }): Promise<Plan> {
    const plan = await this.getById(data.planId);
    if (!plan) throw new NotFoundError(`Plan with ID ${data.planId} not found`);

    return await this.execQuery(async () => {
      return await db.transaction(async (tx) => {
        // 1. Update plan
        const [updatedPlan] = await tx.update(plans)
          .set({ status: 'rejected', reviewerNotes: data.notes })
          .where(eq(plans.id, data.planId))
          .returning();

        // 2. Add to plan_reviews
        await tx.insert(planReviews).values({
          planId: data.planId,
          userId: data.userId,
          action: 'rejected',
          notes: data.notes,
        });

        // 3. Update specification status back to drafting
        await tx.update(specifications)
          .set({ status: 'drafting' })
          .where(eq(specifications.id, plan.specId));

        // 4. Audit log
        await tx.insert(auditLog).values({
          projectId: (await tx.select({ pid: specifications.projectId }).from(specifications).where(eq(specifications.id, plan.specId)).limit(1))[0].pid,
          userId: data.userId,
          action: 'reject_plan',
          targetType: 'plan',
          targetId: String(data.planId),
          detail: { notes: data.notes },
        });

        return updatedPlan;
      });
    });
  }

  /**
   * Requests changes on a plan in a transaction.
   */
  async requestChanges(data: {
    planId: number;
    userId: string;
    notes: string;
  }): Promise<Plan> {
    const plan = await this.getById(data.planId);
    if (!plan) throw new NotFoundError(`Plan with ID ${data.planId} not found`);

    return await this.execQuery(async () => {
      return await db.transaction(async (tx) => {
        // 1. Update plan
        const [updatedPlan] = await tx.update(plans)
          .set({ status: 'changes_requested', reviewerNotes: data.notes })
          .where(eq(plans.id, data.planId))
          .returning();

        // 2. Add to plan_reviews
        await tx.insert(planReviews).values({
          planId: data.planId,
          userId: data.userId,
          action: 'changes_requested',
          notes: data.notes,
        });

        // 3. Update specification status back to drafting
        await tx.update(specifications)
          .set({ status: 'drafting' })
          .where(eq(specifications.id, plan.specId));

        // 4. Audit log
        await tx.insert(auditLog).values({
          projectId: (await tx.select({ pid: specifications.projectId }).from(specifications).where(eq(specifications.id, plan.specId)).limit(1))[0].pid,
          userId: data.userId,
          action: 'request_changes',
          targetType: 'plan',
          targetId: String(data.planId),
          detail: { notes: data.notes },
        });

        return updatedPlan;
      });
    });
  }

  /**
   * Abandons a plan.
   */
  async abandonPlan(data: {
    planId: number;
    userId: string;
  }): Promise<Plan> {
    const plan = await this.getById(data.planId);
    if (!plan) throw new NotFoundError(`Plan with ID ${data.planId} not found`);

    return await this.execQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedPlan] = await tx.update(plans)
          .set({ status: 'abandoned' })
          .where(eq(plans.id, data.planId))
          .returning();

        await tx.insert(planReviews).values({
          planId: data.planId,
          userId: data.userId,
          action: 'abandoned',
        });

        // 4. Audit log
        await tx.insert(auditLog).values({
          projectId: (await tx.select({ pid: specifications.projectId }).from(specifications).where(eq(specifications.id, plan.specId)).limit(1))[0].pid,
          userId: data.userId,
          action: 'abandon_plan',
          targetType: 'plan',
          targetId: String(data.planId),
        });

        return updatedPlan;
      });
    });
  }
}

export const planRepository = new PlanRepository();
