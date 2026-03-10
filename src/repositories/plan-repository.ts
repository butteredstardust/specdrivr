import { db } from '@/db';
import { plans, type PlanSelect as Plan } from '@/db/schema';
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

  async approve(id: number, approvedBy: number): Promise<Plan> {
    return await this.update(id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    });
  }
}

export const planRepository = new PlanRepository();
