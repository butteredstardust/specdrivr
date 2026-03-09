sed -i "s/import { db } from '@\/lib\/db';/import { db } from '@\/db';/g" src/repositories/project-repository.ts
sed -i "s/from '@\/lib\/schema';/from '@\/db\/schema';/g" src/repositories/project-repository.ts

cat << 'INNER_EOF' > src/repositories/project-repository.ts
import { db } from '@/db';
import { projects, type ProjectSelect as Project } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/errors';

interface CreateProjectData {
  name: string;
  description?: string | null;
  createdBy?: number;
}

interface UpdateProjectData {
  name?: string;
  description?: string | null;
  status?: 'active' | 'completed' | 'archived';
}

export { type ProjectSelect as Project } from '@/db/schema';

export class ProjectRepository extends BaseRepository {
  async getAll(): Promise<Project[]> {
    const result = await this.execQuery(() =>
      db.select().from(projects)
    );

    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as unknown as Project[];
  }

  async getById(id: number): Promise<Project | null> {
    const result = await this.execQuery(() =>
      db.select().from(projects).where(eq(projects.id, id)).limit(1)
    );

    return (result[0] as unknown as Project) || null;
  }

  async getByUserId(userId: number): Promise<Project[]> {
    const result = await this.execQuery(() =>
      db.select().from(projects).where(eq(projects.createdBy, userId))
    );

    return result as unknown as Project[];
  }

  async getActive(): Promise<Project[]> {
    const result = await this.execQuery(() =>
      db.select().from(projects).where(eq(projects.status, 'active'))
    );

    return result as unknown as Project[];
  }

  async create(data: CreateProjectData): Promise<Project> {
    const slugBase = data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanData = {
      name: data.name.trim(),
      slug: \`\${slugBase}-\${Date.now()}\`,
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

    const [project] = await this.execQuery(() =>
      db.insert(projects).values(cleanData).returning()
    ) as unknown as any[];

    if (!project) {
      throw new DatabaseError('Failed to create project');
    }

    return project as unknown as Project;
  }

  async update(id: number, data: UpdateProjectData): Promise<Project> {
    const project = await this.getById(id);

    if (!project) {
      throw new NotFoundError(\`Project with ID \${id} not found\`);
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
      if (updateData.description && typeof updateData.description === 'string' && updateData.description.length > 1000) {
        throw new ValidationError('Project description cannot exceed 1000 characters');
      }
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No fields to update');
    }

    const [updatedProject] = await this.execQuery(() =>
      db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, id))
        .returning()
    ) as unknown as any[];

    if (!updatedProject) {
      throw new DatabaseError('Failed to update project');
    }

    return updatedProject as unknown as Project;
  }

  async delete(id: number): Promise<void> {
    const project = await this.getById(id);

    if (!project) {
      throw new NotFoundError(\`Project with ID \${id} not found\`);
    }

    await this.execQuery(() =>
      db.delete(projects).where(eq(projects.id, id))
    );
  }

  async archive(id: number): Promise<Project> {
    return this.update(id, { status: 'archived' });
  }

  async complete(id: number): Promise<Project> {
    return this.update(id, { status: 'completed' as any });
  }
}

export const projectRepository = new ProjectRepository();
INNER_EOF

sed -i 's/"paused"/"failed"/g' src/app/api/tasks/[id]/route.ts

sed -i 's/users.username/users.email/g' src/app/api/auth/accept-invite/route.ts
sed -i 's/users.username/users.email/g' src/app/api/v1/auth/signup/route.ts
sed -i 's/username:/email:/g' src/app/api/auth/accept-invite/route.ts
sed -i 's/username:/email:/g' src/app/api/v1/auth/signup/route.ts

sed -i 's/project.state/project.description/g' src/app/api/v1/projects/route.ts
