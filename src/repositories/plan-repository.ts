import { db } from '@/db';
import {
  plans,
  specifications,
  agentSessions,
  planReviews,
  auditLog,
  agentEvents,
  type PlanSelect as Plan,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, DatabaseError, BusinessError } from '@/lib/errors';
import { dispatchWebhookEvent } from '@/lib/webhooks';
import { logger } from '@/lib/logger';

export { type PlanSelect as Plan } from '@/db/schema';

export class PlanRepository extends BaseRepository {
  async getAll(): Promise<Plan[]> {
    return await this.executeQuery(() => db.select().from(plans));
  }

  async getById(id: number): Promise<Plan | null> {
    const result = await this.executeQuery(() =>
      db.select().from(plans).where(eq(plans.id, id)).limit(1)
    );

    return result[0] || null;
  }

  async getBySpecId(specId: number): Promise<Plan[]> {
    return await this.executeQuery(() => db.select().from(plans).where(eq(plans.specId, specId)));
  }

  async getBySpecVersionId(specVersionId: number): Promise<Plan | null> {
    const result = await this.executeQuery(() =>
      db.select().from(plans).where(eq(plans.specVersionId, specVersionId)).limit(1)
    );

    return result[0] || null;
  }

  async create(data: Partial<import('@/db/schema').PlanInsert>): Promise<Plan> {
    if (!data.specId) {
      throw new DatabaseError('specId is required to create a plan');
    }

    const [plan] = await this.executeQuery(() =>
      db
        .insert(plans)
        .values(data as import('@/db/schema').PlanInsert)
        .returning()
    );

    if (!plan) {
      throw new DatabaseError('Failed to create plan');
    }

    // Trigger plan.generated webhook
    (async () => {
      try {
        const [spec] = await db
          .select({ projectId: specifications.projectId })
          .from(specifications)
          .where(eq(specifications.id, plan.specId))
          .limit(1);

        if (spec) {
          void dispatchWebhookEvent(spec.projectId, 'plan.generated', {
            planId: plan.id,
            specId: plan.specId,
            data: {},
          });
        }
      } catch (err) {
        // Log error but don't throw from repository
        logger.error({ err }, 'Failed to dispatch plan.generated webhook');
      }
    })();

    return plan;
  }

  async update(id: number, data: Partial<import('@/db/schema').PlanInsert>): Promise<Plan> {
    const [updatedPlan] = await this.executeQuery(() =>
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
    const result = await this.executeQuery(() =>
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

    if (plan.status !== 'pending_approval') {
      throw new BusinessError(
        `Plan is in ${plan.status} state and cannot be approved`,
        'INVALID_STATE'
      );
    }

    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        // 1. Update plan status
        const [updatedPlan] = await tx
          .update(plans)
          .set({
            status: 'executing',
            approvedAt: new Date(),
            approvedBy: data.userId,
            reviewerNotes: data.notes,
          })
          .where(eq(plans.id, data.planId))
          .returning();

        // 2. Add to plan_reviews
        await tx.insert(planReviews).values({
          planId: data.planId,
          userId: data.userId,
          action: 'executing',
          notes: data.notes,
        });

        // 3. Update specification status
        await tx
          .update(specifications)
          .set({ status: 'executing' })
          .where(eq(specifications.id, plan.specId));

        // 4. Create agent session
        const [session] = await tx
          .insert(agentSessions)
          .values({
            projectId: (
              await tx
                .select({ pid: specifications.projectId })
                .from(specifications)
                .where(eq(specifications.id, plan.specId))
                .limit(1)
            )[0].pid,
            specId: plan.specId,
            planId: plan.id,
            status: 'running',
            startedBy: data.userId,
          })
          .returning();

        // 5. Audit log
        await tx.insert(auditLog).values({
          projectId: (
            await tx
              .select({ pid: specifications.projectId })
              .from(specifications)
              .where(eq(specifications.id, plan.specId))
              .limit(1)
          )[0].pid,
          userId: data.userId,
          action: 'approve_plan',
          targetType: 'plan',
          targetId: String(data.planId),
          detail: { sessionId: session.id },
        });

        // 6. Log PLAN_APPROVED event
        await tx.insert(agentEvents).values({
          sessionId: session.id,
          specId: plan.specId,
          eventType: 'PLAN_APPROVED',
          message: `Plan approved by ${data.userId}`,
          metadata: { planId: plan.id, userId: data.userId },
        });

        return { plan: updatedPlan, sessionId: session.id };
      });
    }).then((result) => {
      // Trigger plan.approved webhook after transaction commits
      (async () => {
        try {
          const [spec] = await db
            .select({ projectId: specifications.projectId })
            .from(specifications)
            .where(eq(specifications.id, result.plan.specId))
            .limit(1);

          if (spec) {
            void dispatchWebhookEvent(spec.projectId, 'plan.approved', {
              planId: result.plan.id,
              specId: result.plan.specId,
              data: { approvedBy: data.userId },
            });
          }
        } catch (err) {
          logger.error({ err }, 'Failed to dispatch plan.approved webhook');
        }
      })();
      return result;
    });
  }

  /**
   * Rejects a plan in a transaction.
   */
  async rejectPlan(data: { planId: number; userId: string; notes: string }): Promise<Plan> {
    const plan = await this.getById(data.planId);
    if (!plan) throw new NotFoundError(`Plan with ID ${data.planId} not found`);

    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        // 1. Update plan
        const [updatedPlan] = await tx
          .update(plans)
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
        await tx
          .update(specifications)
          .set({ status: 'drafting' })
          .where(eq(specifications.id, plan.specId));

        // 4. Audit log
        await tx.insert(auditLog).values({
          projectId: (
            await tx
              .select({ pid: specifications.projectId })
              .from(specifications)
              .where(eq(specifications.id, plan.specId))
              .limit(1)
          )[0].pid,
          userId: data.userId,
          action: 'reject_plan',
          targetType: 'plan',
          targetId: String(data.planId),
          detail: { notes: data.notes },
        });

        // Log the decision to agent_events
        await tx.insert(agentEvents).values({
          sessionId: 0,
          specId: plan.specId,
          eventType: updatedPlan.status === 'rejected' ? 'PLAN_REJECTED' : 'CHANGES_REQUESTED',
          message: `Plan ${updatedPlan.status === 'rejected' ? 'rejected' : 'changes requested'} by ${data.userId}`,
          metadata: { planId: plan.id, userId: data.userId, notes: data.notes },
        });

        return updatedPlan;
      });
    }).then((updatedPlan) => {
      // Trigger plan.rejected webhook after transaction commits
      (async () => {
        try {
          const [spec] = await db
            .select({ projectId: specifications.projectId })
            .from(specifications)
            .where(eq(specifications.id, updatedPlan.specId))
            .limit(1);

          if (spec) {
            void dispatchWebhookEvent(spec.projectId, 'plan.rejected', {
              planId: updatedPlan.id,
              specId: updatedPlan.specId,
              data: { notes: data.notes, userId: data.userId },
            });
          }
        } catch (err) {
          logger.error({ err }, 'Failed to dispatch plan.rejected webhook');
        }
      })();
      return updatedPlan;
    });
  }

  /**
   * Requests changes on a plan in a transaction.
   */
  async requestChanges(data: { planId: number; userId: string; notes: string }): Promise<Plan> {
    const plan = await this.getById(data.planId);
    if (!plan) throw new NotFoundError(`Plan with ID ${data.planId} not found`);

    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        // 1. Update plan
        const [updatedPlan] = await tx
          .update(plans)
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
        await tx
          .update(specifications)
          .set({ status: 'drafting' })
          .where(eq(specifications.id, plan.specId));

        // 4. Audit log
        await tx.insert(auditLog).values({
          projectId: (
            await tx
              .select({ pid: specifications.projectId })
              .from(specifications)
              .where(eq(specifications.id, plan.specId))
              .limit(1)
          )[0].pid,
          userId: data.userId,
          action: 'request_changes',
          targetType: 'plan',
          targetId: String(data.planId),
          detail: { notes: data.notes },
        });

        // Log the decision to agent_events
        await tx.insert(agentEvents).values({
          sessionId: 0,
          specId: plan.specId,
          eventType: updatedPlan.status === 'rejected' ? 'PLAN_REJECTED' : 'CHANGES_REQUESTED',
          message: `Plan ${updatedPlan.status === 'rejected' ? 'rejected' : 'changes requested'} by ${data.userId}`,
          metadata: { planId: plan.id, userId: data.userId, notes: data.notes },
        });

        return updatedPlan;
      });
    }).then((updatedPlan) => {
      // Trigger plan.changes_requested webhook after transaction commits
      (async () => {
        try {
          const [spec] = await db
            .select({ projectId: specifications.projectId })
            .from(specifications)
            .where(eq(specifications.id, updatedPlan.specId))
            .limit(1);

          if (spec) {
            void dispatchWebhookEvent(spec.projectId, 'plan.changes_requested', {
              planId: updatedPlan.id,
              specId: updatedPlan.specId,
              data: { notes: data.notes, userId: data.userId },
            });
          }
        } catch (err) {
          logger.error({ err }, 'Failed to dispatch plan.changes_requested webhook');
        }
      })();
      return updatedPlan;
    });
  }

  /**
   * Abandons a plan.
   */
  async abandonPlan(data: { planId: number; userId: string }): Promise<Plan> {
    const plan = await this.getById(data.planId);
    if (!plan) throw new NotFoundError(`Plan with ID ${data.planId} not found`);

    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedPlan] = await tx
          .update(plans)
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
          projectId: (
            await tx
              .select({ pid: specifications.projectId })
              .from(specifications)
              .where(eq(specifications.id, plan.specId))
              .limit(1)
          )[0].pid,
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
