import { db } from '@/db';
import {
  projects,
  projectMembers,
  agentConfig,
  auditLog,
  type ProjectSelect as Project,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/errors';

interface CreateProjectData {
  name: string;
  description?: string | null;
  createdBy?: string;
}

interface UpdateProjectData {
  name?: string;
  description?: string | null;
  status?: 'active' | 'archived';
}

export { type ProjectSelect as Project } from '@/db/schema';

export class ProjectRepository extends BaseRepository {
  async getAll(limit = 50, offset = 0): Promise<Project[]> {
    const result = await this.executeQuery(() =>
      db.select().from(projects).limit(limit).offset(offset)
    );

    return result.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    ) as unknown as Project[];
  }

  async getById(id: number): Promise<Project | null> {
    const result = await this.executeQuery(() =>
      db.select().from(projects).where(eq(projects.id, id)).limit(1)
    );

    return (result[0] as unknown as Project) || null;
  }

  async getByUserId(userId: string, limit = 50, offset = 0): Promise<Project[]> {
    const result = await this.executeQuery(() =>
      db.select().from(projects).where(eq(projects.createdBy, userId)).limit(limit).offset(offset)
    );

    return result as unknown as Project[];
  }

  async getActive(): Promise<Project[]> {
    const result = await this.executeQuery(() =>
      db.select().from(projects).where(eq(projects.status, 'active'))
    );

    return result as unknown as Project[];
  }

  async create(data: CreateProjectData): Promise<Project> {
    const slugBase = data.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const cleanData = {
      name: data.name.trim(),
      slug: `${slugBase}-${Date.now()}`,
      description: data.description ?? null,
      createdBy: data.createdBy || null,
      status: 'active' as const,
    };

    if (cleanData.name.length === 0) {
      throw new ValidationError('Project name cannot be empty');
    }

    if (cleanData.name.length > 255) {
      throw new ValidationError('Project name cannot exceed 255 characters');
    }

    if (cleanData.description && cleanData.description.length > 1000) {
      throw new ValidationError('Project description cannot exceed 1000 characters');
    }

    const project = await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [newProject] = await tx.insert(projects).values(cleanData).returning();

        if (!newProject) {
          throw new DatabaseError('Failed to create project');
        }

        // Initialize agent config with defaults
        await tx.insert(agentConfig).values({
          projectId: newProject.id,
        });

        if (cleanData.createdBy) {
          await tx.insert(projectMembers).values({
            projectId: newProject.id,
            userId: cleanData.createdBy,
            role: 'owner',
            status: 'active',
          });
        }

        return newProject as unknown as Project;
      });
    });

    return project;
  }

  async update(id: number, data: UpdateProjectData): Promise<Project> {
    const project = await this.getById(id);

    if (!project) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (trimmedName.length === 0) {
        throw new ValidationError('Project name cannot be empty');
      }
      if (trimmedName.length > 255) {
        throw new ValidationError('Project name cannot exceed 255 characters');
      }
      updateData.name = trimmedName;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
      if (
        updateData.description &&
        typeof updateData.description === 'string' &&
        updateData.description.length > 1000
      ) {
        throw new ValidationError('Project description cannot exceed 1000 characters');
      }
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No fields to update');
    }

    const [updatedProject] = (await this.executeQuery(() =>
      db.update(projects).set(updateData).where(eq(projects.id, id)).returning()
    )) as unknown as unknown[];

    if (!updatedProject) {
      throw new DatabaseError('Failed to update project');
    }

    return updatedProject as unknown as Project;
  }

  async delete(id: number): Promise<void> {
    const project = await this.getById(id);

    if (!project) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    await this.executeQuery(() => db.delete(projects).where(eq(projects.id, id)));
  }

  async archive(id: number): Promise<Project> {
    return this.update(id, { status: 'archived' });
  }

  async getAgentConfig(projectId: number) {
    const result = await this.executeQuery(() =>
      db.select().from(agentConfig).where(eq(agentConfig.projectId, projectId)).limit(1)
    );
    return result[0] || null;
  }

  async updateAgentConfig(
    projectId: number,
    data: Partial<import('@/db/schema').AgentConfigInsert>,
    actorId: string
  ) {
    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(agentConfig)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(agentConfig.projectId, projectId))
          .returning();

        if (!updated) {
          // If for some reason config doesn't exist, create it
          const [created] = await tx
            .insert(agentConfig)
            .values({ ...data, projectId } as import('@/db/schema').AgentConfigInsert)
            .returning();
          return created;
        }

        await tx.insert(auditLog).values({
          projectId,
          userId: actorId,
          action: 'update_agent_config',
          targetType: 'agent_config',
          targetId: String(updated.id),
          detail: data,
        });

        return updated;
      });
    });
  }
}

export const projectRepository = new ProjectRepository();
