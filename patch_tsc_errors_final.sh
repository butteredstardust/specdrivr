sed -i "s/import \* as postgres from 'postgres';/import postgres from 'postgres';/g" db/seed.ts
sed -i "s/import \* as postgres from \"postgres\";/import postgres from \"postgres\";/g" db/seed.ts
sed -i "s/import \* as bcrypt from \"bcryptjs\";/import bcrypt from \"bcryptjs\";/g" db/seed.ts

sed -i "s/import { db } from '@\/lib\/db';/import { db } from '@\/db';/g" src/repositories/task-repository.ts
sed -i "s/import { db } from '@\/lib\/db';/import { db } from '@\/db';/g" src/repositories/project-repository.ts
sed -i "s/from '@\/lib\/schema';/from '@\/db\/schema';/g" src/repositories/task-repository.ts
sed -i "s/from '@\/lib\/schema';/from '@\/db\/schema';/g" src/repositories/project-repository.ts

cat << 'INNER_EOF' > src/repositories/task-repository.ts
import { db } from '@/db';
import { tasks, type TaskSelect as Task, type TaskStatus } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/errors';

export interface CreateTaskData {
  externalId: string;
  title: string;
  description: string;
  planId?: number | null;
  status?: TaskStatus;
  estimateHours?: number | null;
  verifyCommand?: string | null;
  doneCriteria?: string | null;
  recommendedModel?: string;
  createdByUserId?: number | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  estimateHours?: number | null;
  verifyCommand?: string | null;
  doneCriteria?: string | null;
  recommendedModel?: string;
  notes?: string | null;
  completedAt?: Date | null;
}

export class TaskRepository extends BaseRepository {
  async getAll(): Promise<Task[]> {
    const result = await this.execQuery(() =>
      db.select().from(tasks).orderBy(desc(tasks.createdAt))
    );

    return result as Task[];
  }

  async getById(id: number): Promise<Task | null> {
    const result = await this.execQuery(() =>
      db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
    );

    return (result[0] as Task) || null;
  }

  async getByPlanId(planId: number): Promise<Task[]> {
    const result = await this.execQuery(() =>
      db.select()
        .from(tasks)
        .where(eq(tasks.planId, planId))
        .orderBy(desc(tasks.createdAt))
    );

    return result as Task[];
  }

  async getByStatus(
    status: TaskStatus
  ): Promise<Task[]> {
    const result = await this.execQuery(() =>
      db.select().from(tasks).where(eq(tasks.status, status)).orderBy(desc(tasks.createdAt))
    );

    return result as Task[];
  }

  async create(data: CreateTaskData): Promise<Task> {
    if (!data.description || data.description.trim().length === 0) {
      throw new ValidationError('Task description is required');
    }

    if (data.description.length > 5000) {
      throw new ValidationError('Task description cannot exceed 5000 characters');
    }

    if (data.estimateHours !== undefined && data.estimateHours !== null) {
      if (data.estimateHours < 0) {
        throw new ValidationError('Estimate hours must be non-negative');
      }
    }

    const cleanData = {
      description: data.description.trim(),
      externalId: data.externalId,
      title: data.title,
      planId: data.planId ?? 1,
      status: data.status ?? 'todo' as const,
      estimatedMinutes: data.estimateHours ? data.estimateHours * 60 : null,
      recommendedModel: data.recommendedModel ?? 'sonnet',
      attemptCount: 0,
      completedAt: null,
      expectedFiles: [],
    };

    const [task] = (await this.execQuery(() =>
      db.insert(tasks).values(cleanData).returning()
    )) as unknown as any[];

    if (!task) {
      throw new DatabaseError('Failed to create task');
    }

    return task as Task;
  }

  async update(id: number, data: UpdateTaskData): Promise<Task> {
    const existingTask = await this.getById(id);

    if (!existingTask) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = {};

    if (data.description !== undefined) {
      const trimmedDescription = data.description.trim();
      if (trimmedDescription.length === 0) {
        throw new ValidationError('Task description cannot be empty');
      }
      if (trimmedDescription.length > 5000) {
        throw new ValidationError('Task description cannot exceed 5000 characters');
      }
      updateData.description = trimmedDescription;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'done' && existingTask.status !== 'done') {
        updateData.completedAt = new Date();
      }
    }

    if (data.estimateHours !== undefined) {
      if (data.estimateHours !== null && data.estimateHours < 0) {
        throw new ValidationError('Estimate hours must be non-negative');
      }
      updateData.estimatedMinutes = data.estimateHours ? data.estimateHours * 60 : null;
    }

    if (data.recommendedModel !== undefined) updateData.recommendedModel = data.recommendedModel;

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No fields to update');
    }

    updateData.updatedAt = new Date();

    const [updatedTask] = (await this.execQuery(() =>
      db
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, id))
        .returning()
    )) as unknown as any[];

    if (!updatedTask) {
      throw new DatabaseError('Failed to update task');
    }

    return updatedTask as Task;
  }

  async delete(id: number): Promise<void> {
    const task = await this.getById(id);

    if (!task) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    await this.execQuery(() =>
      db.delete(tasks).where(eq(tasks.id, id))
    );
  }

  async markAsCompleted(id: number): Promise<Task> {
    return this.update(id, {
      status: 'done',
      completedAt: new Date(),
    });
  }

  async incrementRetryCount(id: number): Promise<Task> {
    const task = await this.getById(id);

    if (!task) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    const [updatedTask] = (await this.execQuery(() =>
      db
        .update(tasks)
        .set({
          attemptCount: task.attemptCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, id))
        .returning()
    )) as unknown as any[];

    if (!updatedTask) {
      throw new DatabaseError('Failed to update task');
    }

    return updatedTask as Task;
  }
}

export const taskRepository = new TaskRepository();
INNER_EOF

cat << 'INNER_EOF' > src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { type TaskSelect as Task } from "@/db/schema";
import { handleApiError } from '@/lib/error-handler';
import { taskQuerySchema, createTaskSchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = {
      status: searchParams.get('status'),
      planId: searchParams.get('planId'),
    };

    const validationResult = taskQuerySchema.safeParse(query);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: validationResult.error.errors } },
        { status: 400 }
      );
    }

    const { status, planId } = validationResult.data;
    let tasks: Task[] = [];

    if (planId) {
      tasks = await taskRepository.getByPlanId(planId);
      if (status) {
        tasks = tasks.filter(task => task.status === status);
      }
    } else if (status) {
      tasks = await taskRepository.getByStatus(status as any);
    } else {
      tasks = await taskRepository.getAll();
    }

    return NextResponse.json({ data: tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid task data', details: validationResult.error.errors } },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const taskData: any = { externalId: \`T-\${Date.now()}\`, title: data.description.substring(0, 50), ...data };
    const newTask = await taskRepository.create(taskData);

    return NextResponse.json(
      { data: newTask },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
INNER_EOF

sed -i 's/"developer"/"member"/g' src/app/api/v1/projects/[id]/members/[userId]/route.ts
sed -i 's/project.state/project.description/g' src/app/api/v1/projects/route.ts
sed -i 's/spec.name/spec.markdownContent/g' src/app/api/v1/specs/[id]/versions/route.ts
sed -i 's/version.markdownContent/version.markdownContent/g' src/app/api/v1/specs/[id]/versions/route.ts
sed -i 's/name: markdownContent/markdownContent: markdownContent/g' src/app/api/v1/specs/[id]/versions/route.ts

sed -i 's/status: 400/status: 400/g' src/app/api/webhooks/github/[projectId]/route.ts
sed -i 's/status: 401/status: 401/g' src/app/api/webhooks/github/[projectId]/route.ts
sed -i 's/status: 500/status: 500/g' src/app/api/webhooks/github/[projectId]/route.ts

sed -i 's/project.repositoryUrl/project.repositoryUrl || ""/g' src/app/api/webhooks/github/[projectId]/route.ts

cat << 'INNER_EOF' > src/app/api/webhooks/github/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { projects, webhookDeliveries } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;
  const projectId = parseInt(resolvedParams.projectId, 10);

  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const payload = await request.json();
  const event = request.headers.get('x-github-event') || 'unknown';

  await db.insert(webhookDeliveries).values({
    projectId: project.id,
    eventType: event,
    payload: payload,
    status: 'delivered',
  });

  return NextResponse.json({ success: true });
}
INNER_EOF

cat << 'INNER_EOF' > src/app/api/v1/specs/[id]/versions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { specVersions, specifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const versions = await db.select().from(specVersions).where(eq(specVersions.specId, Number(id))).orderBy(desc(specVersions.versionNumber));

    return NextResponse.json({ data: versions });
  } catch (error) {
    console.error('Error fetching spec versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { markdownContent } = await request.json();

    if (!markdownContent) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const [spec] = await db.select().from(specifications).where(eq(specifications.id, Number(id))).limit(1);

    if (!spec) {
      return NextResponse.json({ error: 'Specification not found' }, { status: 404 });
    }

    const currentVersions = await db.select().from(specVersions).where(eq(specVersions.specId, Number(id))).orderBy(desc(specVersions.versionNumber)).limit(1);
    const nextVersionNumber = currentVersions.length > 0 ? currentVersions[0].versionNumber + 1 : 1;

    const result = await db.transaction(async (tx) => {
      const [newVersion] = await tx.insert(specVersions).values({
        specId: Number(id),
        versionNumber: nextVersionNumber,
        markdownContent,
        createdBy: Number(session.user!.id)
      }).returning();

      await tx.update(specifications).set({
        currentVersionId: newVersion.id,
        updatedAt: new Date()
      }).where(eq(specifications.id, Number(id)));

      return newVersion;
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating spec version:', error);
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
  }
}
INNER_EOF
