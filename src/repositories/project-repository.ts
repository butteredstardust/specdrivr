import { db } from '@/db';
import { projects, projectMembers, agentConfig, type ProjectSelect as Project } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/errors';

interface CreateProjectData {
  name: string;
  description?: string | null;
  createdBy?: string;
  repositoryUrl?: string | null;
}

interface UpdateProjectData {
  name?: string;
  description?: string | null;
  status?: 'active' | 'archived';
  repositoryUrl?: string | null;
  repositoryBranch?: string | null;
}

export { type ProjectSelect as Project } from '@/db/schema';

export class ProjectRepository extends BaseRepository {
  async getAll(limit = 50, offset = 0): Promise<Project[]> {
    const result = await this.executeQuery(() =>
      db.select().from(projects).limit(limit).offset(offset)
    );

    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getById(id: number): Promise<Project | null> {
    const result = await this.executeQuery(() =>
      db.select().from(projects).where(eq(projects.id, id)).limit(1)
    );

    return result[0] || null;
  }

  async getByUserId(userId: string, limit = 50, offset = 0): Promise<Project[]> {
    const result = await this.executeQuery(() =>
      db
        .select({
          project: projects,
        })
        .from(projects)
        .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
        .where(eq(projectMembers.userId, userId))
        .limit(limit)
        .offset(offset)
    );

    return result
      .map((r) => r.project)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActive(): Promise<Project[]> {
    const result = await this.executeQuery(() =>
      db.select().from(projects).where(eq(projects.status, 'active'))
    );

    return result;
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
      repositoryUrl: data.repositoryUrl?.trim() || null,
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

        return newProject;
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

    if (data.repositoryUrl !== undefined) {
      updateData.repositoryUrl = data.repositoryUrl;
    }

    if (data.repositoryBranch !== undefined) {
      updateData.repositoryBranch = data.repositoryBranch;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No fields to update');
    }

    const [updatedProject] = await this.executeQuery(() =>
      db.update(projects).set(updateData).where(eq(projects.id, id)).returning()
    );

    if (!updatedProject) {
      throw new DatabaseError('Failed to update project');
    }

    return updatedProject;
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
}

export const projectRepository = new ProjectRepository();
