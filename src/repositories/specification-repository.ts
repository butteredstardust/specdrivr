import { db } from '@/db';
import { specifications, type SpecificationSelect as Specification } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, DatabaseError } from '@/lib/errors';

export { type SpecificationSelect as Specification } from '@/db/schema';

export class SpecificationRepository extends BaseRepository {
  async getAll(): Promise<Specification[]> {
    return await this.execQuery(() =>
      db.select().from(specifications)
    );
  }

  async getById(id: number): Promise<Specification | null> {
    const result = await this.execQuery(() =>
      db.select().from(specifications).where(eq(specifications.id, id)).limit(1)
    );

    return result[0] || null;
  }

  async getByProjectId(projectId: number): Promise<Specification[]> {
    return await this.execQuery(() =>
      db.select().from(specifications).where(eq(specifications.projectId, projectId))
    );
  }

  async create(data: { projectId: number; name: string; createdBy?: number }): Promise<Specification> {
    const [spec] = await this.execQuery(() =>
      db.insert(specifications).values({
        projectId: data.projectId,
        name: data.name,
        createdBy: data.createdBy || null,
        status: 'drafting',
      }).returning()
    );

    if (!spec) {
      throw new DatabaseError('Failed to create specification');
    }

    return spec;
  }

  async update(id: number, data: Partial<Specification>): Promise<Specification> {
    const [updatedSpec] = await this.execQuery(() =>
      db
        .update(specifications)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(specifications.id, id))
        .returning()
    );

    if (!updatedSpec) {
      throw new NotFoundError(`Specification with ID ${id} not found`);
    }

    return updatedSpec;
  }

  async delete(id: number): Promise<void> {
    const result = await this.execQuery(() =>
      db.delete(specifications).where(eq(specifications.id, id)).returning()
    );

    if (result.length === 0) {
      throw new NotFoundError(`Specification with ID ${id} not found`);
    }
  }
}

export const specificationRepository = new SpecificationRepository();
