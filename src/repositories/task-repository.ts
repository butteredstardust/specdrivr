import { db } from '@/db';
import { tasks, type TaskSelect as Task, type TaskStatus } from '@/db/schema';
import * as schema from '@/db/schema';
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
    )) as unknown as unknown[];

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
    )) as unknown as unknown[];

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

  async getAttempts(taskId: number): Promise<(typeof schema.taskAttempts.$inferSelect)[]> {
    return this.execQuery(() =>
      db.select()
        .from(schema.taskAttempts)
        .where(eq(schema.taskAttempts.taskId, taskId))
        .orderBy(desc(schema.taskAttempts.seq))
    );
  }

  async getFileChanges(taskId: number): Promise<(typeof schema.fileChanges.$inferSelect)[]> {
    return this.execQuery(() =>
      db.select()
        .from(schema.fileChanges)
        .where(eq(schema.fileChanges.taskId, taskId))
        .orderBy(desc(schema.fileChanges.createdAt))
    );
  }
}

export const taskRepository = new TaskRepository();
