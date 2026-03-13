import { db } from '@/db';
import { specifications, specVersions, plans, auditLog, type SpecificationSelect as Specification } from '@/db/schema';
import { eq, and, ne, desc } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, DatabaseError } from '@/lib/errors';
import { dispatchWebhookEvent } from '@/lib/webhooks';

export { type SpecificationSelect as Specification } from '@/db/schema';

export class SpecificationRepository extends BaseRepository {
  async getAll(): Promise<Specification[]> {
    return await this.executeQuery(() =>
      db.select().from(specifications)
    );
  }

  async getById(id: number): Promise<Specification | null> {
    const result = await this.executeQuery(() =>
      db.select().from(specifications).where(eq(specifications.id, id)).limit(1)
    );

    return result[0] || null;
  }

  async getByProjectId(projectId: number): Promise<Specification[]> {
    return await this.executeQuery(() =>
      db.select().from(specifications).where(eq(specifications.projectId, projectId))
    );
  }

  async create(data: { projectId: number; name: string; createdBy?: string }): Promise<Specification> {
    const [spec] = await this.executeQuery(() =>
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

    // Trigger spec.created webhook
    void dispatchWebhookEvent(spec.projectId, 'spec.created', {
      specId: spec.id,
      data: {}
    });

    return spec;
  }

  /**
   * Creates a specification and its initial version in a transaction.
   */
  async createWithVersion(data: { 
    projectId: number; 
    name: string; 
    markdownContent: string; 
    createdBy: string;
  }): Promise<Specification> {
    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        // 1. Create the specification
        const [spec] = await tx.insert(specifications).values({
          projectId: data.projectId,
          name: data.name,
          createdBy: data.createdBy,
          status: 'drafting',
        }).returning();

        if (!spec) throw new DatabaseError('Failed to create specification');

        // 2. Create the first version
        const [version] = await tx.insert(specVersions).values({
          specId: spec.id,
          versionNumber: 1,
          markdownContent: data.markdownContent,
          createdBy: data.createdBy,
        }).returning();

        if (!version) throw new DatabaseError('Failed to create initial specification version');

        // 3. Link back to current version
        const [updatedSpec] = await tx.update(specifications)
          .set({ currentVersionId: version.id })
          .where(eq(specifications.id, spec.id))
          .returning();

        // 4. Audit log
        await tx.insert(auditLog).values({
          projectId: data.projectId,
          userId: data.createdBy,
          action: 'create_specification',
          targetType: 'specification',
          targetId: String(spec.id),
          detail: { name: data.name, version: 1 },
        });

        return updatedSpec;
      });
    }).then((updatedSpec) => {
      // Trigger spec.created webhook after transaction commits
      void dispatchWebhookEvent(updatedSpec.projectId, 'spec.created', {
        specId: updatedSpec.id,
        data: {}
      });
      return updatedSpec;
    });
  }

  /**
   * Adds a new version to a specification and abandons any non-complete plans.
   */
  async addVersion(data: {
    specId: number;
    markdownContent: string;
    createdBy: string;
  }): Promise<Specification> {
    const spec = await this.getById(data.specId);
    if (!spec) throw new NotFoundError(`Specification with ID ${data.specId} not found`);

    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        // 1. Get latest version number
        const latestVersion = await tx.select({ num: specVersions.versionNumber })
          .from(specVersions)
          .where(eq(specVersions.specId, data.specId))
          .orderBy(desc(specVersions.versionNumber))
          .limit(1);
        
        const nextVersionNumber = latestVersion.length > 0 ? latestVersion[0].num + 1 : 1;

        // 2. Create the new version
        const [version] = await tx.insert(specVersions).values({
          specId: data.specId,
          versionNumber: nextVersionNumber,
          markdownContent: data.markdownContent,
          createdBy: data.createdBy,
        }).returning();

        if (!version) throw new DatabaseError('Failed to create new specification version');

        // 3. Abandon any non-complete plans for this specification
        // Non-complete = anything that isn't 'completed', 'rejected', or 'abandoned' already
        await tx.update(plans)
          .set({ status: 'abandoned' })
          .where(and(
            eq(plans.specId, data.specId),
            ne(plans.status, 'completed'),
            ne(plans.status, 'rejected'),
            ne(plans.status, 'abandoned')
          ));

        // 4. Update the specification
        const [updatedSpec] = await tx.update(specifications)
          .set({ 
            currentVersionId: version.id,
            status: 'drafting', // Reset status when edited
            updatedAt: new Date(),
          })
          .where(eq(specifications.id, data.specId))
          .returning();

        // 5. Audit log
        await tx.insert(auditLog).values({
          projectId: spec.projectId,
          userId: data.createdBy,
          action: 'add_spec_version',
          targetType: 'specification',
          targetId: String(data.specId),
          detail: { version: nextVersionNumber },
        });

        return updatedSpec;
      });
    }).then((updatedSpec) => {
      // Trigger spec.updated webhook after transaction commits
      void dispatchWebhookEvent(updatedSpec.projectId, 'spec.updated', {
        specId: updatedSpec.id,
        data: {}
      });
      return updatedSpec;
    });
  }

  async update(id: number, data: Partial<Specification>): Promise<Specification> {
    const [updatedSpec] = await this.executeQuery(() =>
      db
        .update(specifications)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(specifications.id, id))
        .returning()
    );

    if (!updatedSpec) {
      throw new NotFoundError(`Specification with ID ${id} not found`);
    }

    // Trigger spec.updated webhook
    void dispatchWebhookEvent(updatedSpec.projectId, 'spec.updated', {
      specId: updatedSpec.id,
      data: {}
    });

    return updatedSpec;
  }

  async delete(id: number): Promise<void> {
    const result = await this.executeQuery(() =>
      db.delete(specifications).where(eq(specifications.id, id)).returning()
    );

    if (result.length === 0) {
      throw new NotFoundError(`Specification with ID ${id} not found`);
    }
  }
}

export const specificationRepository = new SpecificationRepository();
