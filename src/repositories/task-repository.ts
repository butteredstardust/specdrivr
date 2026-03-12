import { db } from '@/db';
import { tasks, auditLog, plans, specifications, agentSessions, type TaskSelect as Task, type TaskStatus } from '@/db/schema';
import * as schema from '@/db/schema';
import { eq, desc, sql, and, asc } from 'drizzle-orm';
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
  createdByUserId?: string | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  estimateHours?: number | null;
  verifyCommand?: string | null;
  doneCriteria?: string | null;
  recommendedModel?: string;
  humanContext?: string | null;
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
    if (data.humanContext !== undefined) updateData.humanContext = data.humanContext;

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

  /**
   * Finds the next 'todo' task for a running session in a project and marks it 'in_progress'.
   */
  async claimNextTaskForProject(projectId: number): Promise<Task | null> {
    return await this.execQuery(async () => {
      return await db.transaction(async (tx) => {
        // 1. Find next task
        const [nextTask] = await tx.select({ task: tasks })
          .from(tasks)
          .innerJoin(agentSessions, eq(tasks.planId, agentSessions.planId))
          .where(and(
            eq(agentSessions.projectId, projectId),
            eq(agentSessions.status, 'running'),
            eq(tasks.status, 'todo')
          ))
          .orderBy(asc(tasks.executionOrder))
          .limit(1);

        if (!nextTask) return null;

        // 2. Mark as in_progress
        const [updatedTask] = await tx.update(tasks)
          .set({ 
            status: 'in_progress',
            startedAt: new Date(),
            updatedAt: new Date() 
          })
          .where(eq(tasks.id, nextTask.task.id))
          .returning();

        return updatedTask as Task;
      });
    });
  }

  /**
   * Retries a task by resetting status and incrementing attemptCount.
   */
  async retryTask(id: number, userId: string): Promise<Task> {
    const task = await this.getById(id);
    if (!task) throw new NotFoundError(`Task with ID ${id} not found`);

    return await this.execQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedTask] = await tx.update(tasks)
          .set({ 
            status: 'todo', 
            attemptCount: sql`${tasks.attemptCount} + 1`,
            updatedAt: new Date() 
          })
          .where(eq(tasks.id, id))
          .returning();

        const plan = (await tx.select().from(plans).where(eq(plans.id, task.planId)).limit(1))[0];
        const projectId = (await tx.select({ pid: specifications.projectId }).from(specifications).where(eq(specifications.id, plan.specId)).limit(1))[0].pid;

        // 2. Audit log
        await tx.insert(auditLog).values({
          projectId,
          userId,
          action: 'retry_task',
          targetType: 'task',
          targetId: String(id),
        });

        return updatedTask as Task;
      });
    });
  }

  /**
   * Unblocks a task with human context.
   */
  async unblockTask(id: number, humanContext: string, userId: string): Promise<Task> {
    const task = await this.getById(id);
    if (!task) throw new NotFoundError(`Task with ID ${id} not found`);

    return await this.execQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedTask] = await tx.update(tasks)
          .set({ 
            status: 'todo', 
            humanContext,
            blockedReason: null,
            updatedAt: new Date() 
          })
          .where(eq(tasks.id, id))
          .returning();

        const plan = (await tx.select().from(plans).where(eq(plans.id, task.planId)).limit(1))[0];
        const projectId = (await tx.select({ pid: specifications.projectId }).from(specifications).where(eq(specifications.id, plan.specId)).limit(1))[0].pid;

        // 2. Audit log
        await tx.insert(auditLog).values({
          projectId,
          userId,
          action: 'unblock_task',
          targetType: 'task',
          targetId: String(id),
          detail: { humanContext },
        });

        return updatedTask as Task;
      });
    });
  }

  /**
   * Manually overrides a task status.
   */
  async overrideStatus(id: number, status: TaskStatus, userId: string, notes?: string | null): Promise<Task> {
    const task = await this.getById(id);
    if (!task) throw new NotFoundError(`Task with ID ${id} not found`);

    return await this.execQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedTask] = await tx.update(tasks)
          .set({ 
            status, 
            completedAt: status === 'done' ? new Date() : task.completedAt,
            updatedAt: new Date() 
          })
          .where(eq(tasks.id, id))
          .returning();

        const plan = (await tx.select().from(plans).where(eq(plans.id, task.planId)).limit(1))[0];
        const projectId = (await tx.select({ pid: specifications.projectId }).from(specifications).where(eq(specifications.id, plan.specId)).limit(1))[0].pid;

        // 2. Audit log
        await tx.insert(auditLog).values({
          projectId,
          userId,
          action: 'override_task_status',
          targetType: 'task',
          targetId: String(id),
          detail: { from: task.status, to: status, notes },
        });

        return updatedTask as Task;
      });
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
