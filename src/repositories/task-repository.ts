import { db } from '@/db';
import {
  tasks,
  auditLog,
  plans,
  specifications,
  agentSessions,
  type TaskSelect as Task,
  type TaskStatus,
} from '@/db/schema';
import * as schema from '@/db/schema';
import { eq, desc, sql, and, asc, getTableColumns } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/errors';
import { dispatchWebhookEvent, type WebhookEventType } from '@/lib/webhooks';
import { sendSlackNotification } from '@/lib/slack';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export interface CreateTaskData {
  externalId: string;
  title: string;
  description: string;
  planId?: number | null;
  specId?: number | null;
  status?: TaskStatus;
  dependsOn?: string[];
  executionOrder?: number;
  estimateHours?: number | null;
  estimatedMinutes?: number | null;
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
  async getAll(options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = options;
    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;

    const [rows, countResult] = await Promise.all([
      this.executeQuery(() =>
        db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(safeLimit).offset(offset)
      ),
      this.executeQuery(() => db.select({ count: sql<number>`count(*)` }).from(tasks)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return {
      data: rows as Task[],
      meta: { page, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async getById(id: number): Promise<Task | null> {
    const result = await this.executeQuery(() =>
      db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
    );

    return (result[0] as Task) || null;
  }

  async getByPlanId(planId: number): Promise<Task[]> {
    const result = await this.executeQuery(() =>
      db.select().from(tasks).where(eq(tasks.planId, planId)).orderBy(desc(tasks.createdAt))
    );

    return result as Task[];
  }

  async getBySpecId(specId: number): Promise<Task[]> {
    const result = await this.executeQuery(() =>
      db.select().from(tasks).where(eq(tasks.specId, specId)).orderBy(asc(tasks.executionOrder))
    );
    return result as Task[];
  }

  async getByStatus(status: TaskStatus): Promise<Task[]> {
    const result = await this.executeQuery(() =>
      db.select().from(tasks).where(eq(tasks.status, status)).orderBy(desc(tasks.createdAt))
    );

    return result as Task[];
  }

  async getByExternalId(externalId: string): Promise<Task | null> {
    const result = await this.executeQuery(() =>
      db.select().from(tasks).where(eq(tasks.externalId, externalId)).limit(1)
    );

    return (result[0] as Task) || null;
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
      specId: data.specId ?? null,
      status: data.status ?? ('todo' as const),
      dependsOn: data.dependsOn ?? [],
      executionOrder: data.executionOrder ?? 0,
      estimatedMinutes:
        data.estimatedMinutes ?? (data.estimateHours ? data.estimateHours * 60 : null),
      verifyCommand: data.verifyCommand ?? null,
      doneCriteria: data.doneCriteria ?? null,
      recommendedModel: data.recommendedModel ?? 'sonnet',
      attemptCount: 0,
      completedAt: null,
      expectedFiles: [],
    };

    const [task] = await this.executeQuery(() => db.insert(tasks).values(cleanData).returning());

    if (!task) {
      throw new DatabaseError('Failed to create task');
    }

    return task;
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

    const [updatedTask] = await this.executeQuery(() =>
      db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning()
    );

    if (!updatedTask) {
      throw new DatabaseError('Failed to update task');
    }

    const t = updatedTask;

    // Trigger task.blocked or task.done webhook
    if (data.status === 'blocked' || data.status === 'done') {
      (async () => {
        try {
          const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
          const [spec] = await db
            .select({ pid: specifications.projectId })
            .from(specifications)
            .where(eq(specifications.id, plan.specId))
            .limit(1);
          const [session] = await db
            .select({ id: agentSessions.id })
            .from(agentSessions)
            .where(eq(agentSessions.planId, plan.id))
            .orderBy(desc(agentSessions.startedAt))
            .limit(1);

          if (spec) {
            void dispatchWebhookEvent(
              spec.pid,
              data.status === 'blocked' ? 'task.blocked' : 'task.done',
              {
                taskId: t.id,
                specId: plan.specId,
                sessionId: session?.id,
                data: data.status === 'blocked' ? { blockedReason: t.blockedReason } : {},
              }
            );

            if (data.status === 'blocked') {
              void this.notifySlackTaskBlocked(t.id);
            }
          }
        } catch (err) {
          logger.error({ err }, `Failed to dispatch task.${data.status} webhook`);
        }
      })();
    }

    return t;
  }

  async delete(id: number): Promise<void> {
    const task = await this.getById(id);

    if (!task) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    await this.executeQuery(() => db.delete(tasks).where(eq(tasks.id, id)));
  }

  async markAsCompleted(id: number): Promise<Task> {
    return this.update(id, {
      status: 'done',
      completedAt: new Date(),
    });
  }

  /**
   * Finds the next 'todo' task for a running session in a project and marks it 'in_progress'.
   * Respects dependencies: a task is only claimable if all tasks in its 'dependsOn' array are 'done'.
   */
  async claimNextTaskForProject(projectId: number): Promise<Task | null> {
    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        // 1. Find next task that is 'todo' AND has all dependencies met
        // We use a subquery to ensure NO tasks exist in the same plan that:
        // - have an externalId present in the current task's dependsOn array
        // - and are NOT 'done'
        const [nextTask] = await tx
          .select({ task: tasks })
          .from(tasks)
          .innerJoin(agentSessions, eq(tasks.planId, agentSessions.planId))
          .where(
            and(
              eq(agentSessions.projectId, projectId),
              eq(agentSessions.status, 'running'),
              eq(tasks.status, 'todo'),
              // Dependency Gate:
              sql`NOT EXISTS (
              SELECT 1 FROM ${tasks} AS t2 
              WHERE t2.plan_id = ${tasks.planId} 
              AND t2.external_id = ANY(${tasks.dependsOn}) 
              AND t2.status != 'done'
            )`
            )
          )
          .orderBy(asc(tasks.executionOrder))
          .limit(1)
          .for('update', { skipLocked: true });

        if (!nextTask) return null;

        // 2. Mark as in_progress
        const [updatedTask] = await tx
          .update(tasks)
          .set({
            status: 'in_progress',
            startedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, nextTask.task.id))
          .returning();

        return updatedTask as Task;
      });
    }).then((updatedTask) => {
      if (!updatedTask) return updatedTask;

      const t = updatedTask;

      // Trigger task.blocked if status is blocked
      if (t.status === 'blocked') {
        (async () => {
          try {
            const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
            const [spec] = await db
              .select({ pid: specifications.projectId })
              .from(specifications)
              .where(eq(specifications.id, plan.specId))
              .limit(1);
            const [session] = await db
              .select({ id: agentSessions.id })
              .from(agentSessions)
              .where(eq(agentSessions.planId, plan.id))
              .orderBy(desc(agentSessions.startedAt))
              .limit(1);
            if (spec) {
              void dispatchWebhookEvent(spec.pid, 'task.blocked', {
                taskId: t.id,
                specId: plan.specId,
                sessionId: session?.id,
                data: { blockedReason: t.blockedReason },
              });
              void this.notifySlackTaskBlocked(t.id);
            }
          } catch (err) {
            logger.error({ err }, 'Failed to dispatch task.blocked webhook');
          }
        })();
      } else if (t.status === 'done') {
        (async () => {
          try {
            const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
            const [spec] = await db
              .select({ pid: specifications.projectId })
              .from(specifications)
              .where(eq(specifications.id, plan.specId))
              .limit(1);
            const [session] = await db
              .select({ id: agentSessions.id })
              .from(agentSessions)
              .where(eq(agentSessions.planId, plan.id))
              .orderBy(desc(agentSessions.startedAt))
              .limit(1);
            if (spec) {
              void dispatchWebhookEvent(spec.pid, 'task.done', {
                taskId: t.id,
                specId: plan.specId,
                sessionId: session?.id,
                data: {},
              });
            }
          } catch (err) {
            logger.error({ err }, 'Failed to dispatch task.done webhook');
          }
        })();
      }
      return t;
    });
  }

  /**
   * Retries a task by resetting status and incrementing attemptCount.
   */
  async retryTask(id: number, userId: string): Promise<Task> {
    const task = await this.getById(id);
    if (!task) throw new NotFoundError(`Task with ID ${id} not found`);

    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedTask] = await tx
          .update(tasks)
          .set({
            status: 'todo',
            attemptCount: sql`${tasks.attemptCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, id))
          .returning();

        const plan = (await tx.select().from(plans).where(eq(plans.id, task.planId)).limit(1))[0];
        const projectId = (
          await tx
            .select({ pid: specifications.projectId })
            .from(specifications)
            .where(eq(specifications.id, plan.specId))
            .limit(1)
        )[0].pid;

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
    }).then((updatedTask) => {
      // Trigger task.retried webhook after transaction commits
      (async () => {
        try {
          const plan = (
            await db.select().from(plans).where(eq(plans.id, updatedTask.planId)).limit(1)
          )[0];
          const spec = (
            await db
              .select({ pid: specifications.projectId })
              .from(specifications)
              .where(eq(specifications.id, plan.specId))
              .limit(1)
          )[0];
          if (spec) {
            void dispatchWebhookEvent(spec.pid, 'task.retried', {
              taskId: updatedTask.id,
              specId: plan.specId,
              data: { attemptCount: updatedTask.attemptCount },
            });
          }
        } catch (err) {
          logger.error({ err }, 'Failed to dispatch task.retried webhook');
        }
      })();
      return updatedTask;
    });
  }

  /**
   * Unblocks a task with human context.
   */
  async unblockTask(id: number, humanContext: string, userId: string): Promise<Task> {
    const task = await this.getById(id);
    if (!task) throw new NotFoundError(`Task with ID ${id} not found`);

    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedTask] = await tx
          .update(tasks)
          .set({
            status: 'todo',
            humanContext,
            blockedReason: null,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, id))
          .returning();

        const plan = (await tx.select().from(plans).where(eq(plans.id, task.planId)).limit(1))[0];
        const projectId = (
          await tx
            .select({ pid: specifications.projectId })
            .from(specifications)
            .where(eq(specifications.id, plan.specId))
            .limit(1)
        )[0].pid;

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
    }).then((updatedTask) => {
      // Trigger task.unblocked webhook after transaction commits
      (async () => {
        try {
          const plan = (
            await db.select().from(plans).where(eq(plans.id, updatedTask.planId)).limit(1)
          )[0];
          const spec = (
            await db
              .select({ pid: specifications.projectId })
              .from(specifications)
              .where(eq(specifications.id, plan.specId))
              .limit(1)
          )[0];
          if (spec) {
            void dispatchWebhookEvent(spec.pid, 'task.unblocked', {
              taskId: updatedTask.id,
              specId: plan.specId,
              data: { humanContext },
            });
          }
        } catch (err) {
          logger.error({ err }, 'Failed to dispatch task.unblocked webhook');
        }
      })();
      return updatedTask;
    });
  }

  /**
   * Manually overrides a task status.
   */
  async overrideStatus(
    id: number,
    status: TaskStatus,
    userId: string,
    notes?: string | null
  ): Promise<Task> {
    const task = await this.getById(id);
    if (!task) throw new NotFoundError(`Task with ID ${id} not found`);

    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedTask] = await tx
          .update(tasks)
          .set({
            status,
            completedAt: status === 'done' ? new Date() : task.completedAt,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, id))
          .returning();

        const plan = (await tx.select().from(plans).where(eq(plans.id, task.planId)).limit(1))[0];
        const projectId = (
          await tx
            .select({ pid: specifications.projectId })
            .from(specifications)
            .where(eq(specifications.id, plan.specId))
            .limit(1)
        )[0].pid;

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
    }).then((updatedTask) => {
      // Trigger appropriate task webhook after transaction commits
      (async () => {
        try {
          const [plan] = await db
            .select()
            .from(plans)
            .where(eq(plans.id, updatedTask.planId))
            .limit(1);
          const [spec] = await db
            .select({ pid: specifications.projectId })
            .from(specifications)
            .where(eq(specifications.id, plan.specId))
            .limit(1);
          const [session] = await db
            .select({ id: agentSessions.id })
            .from(agentSessions)
            .where(eq(agentSessions.planId, plan.id))
            .orderBy(desc(agentSessions.startedAt))
            .limit(1);

          if (spec) {
            // Mapping for standard events, fallback to generic task.done or task.blocked if applicable
            let event: WebhookEventType | null = null;
            if (updatedTask.status === 'blocked') event = 'task.blocked';
            else if (updatedTask.status === 'done') event = 'task.done';

            if (event) {
              void dispatchWebhookEvent(spec.pid, event, {
                taskId: updatedTask.id,
                specId: plan.specId,
                sessionId: session?.id,
                data: { from: task.status, to: updatedTask.status, notes },
              });

              if (updatedTask.status === 'blocked') {
                void this.notifySlackTaskBlocked(updatedTask.id);
              }
            }
          }
        } catch (err) {
          logger.error({ err }, 'Failed to dispatch task webhook in overrideStatus');
        }
      })();
      return updatedTask;
    });
  }

  async getAttempts(taskId: number): Promise<(typeof schema.taskAttempts.$inferSelect)[]> {
    return this.executeQuery(() =>
      db
        .select()
        .from(schema.taskAttempts)
        .where(eq(schema.taskAttempts.taskId, taskId))
        .orderBy(desc(schema.taskAttempts.seq))
    );
  }

  async getFileChanges(taskId: number): Promise<(typeof schema.fileChanges.$inferSelect)[]> {
    return this.executeQuery(() =>
      db
        .select()
        .from(schema.fileChanges)
        .where(eq(schema.fileChanges.taskId, taskId))
        .orderBy(desc(schema.fileChanges.createdAt))
    );
  }

  async getFileChangesBySpecId(
    specId: number
  ): Promise<(typeof schema.fileChanges.$inferSelect)[]> {
    return this.executeQuery(() =>
      db
        .select(getTableColumns(schema.fileChanges))
        .from(schema.fileChanges)
        .innerJoin(tasks, eq(schema.fileChanges.taskId, tasks.id))
        .where(eq(tasks.specId, specId))
        .orderBy(asc(schema.fileChanges.createdAt))
    );
  }

  /**
   * Helper to fetch context and send Slack notification for a blocked task.
   */
  private async notifySlackTaskBlocked(taskId: number): Promise<void> {
    try {
      const [context] = await db
        .select({
          projectId: schema.projects.id,
          projectName: schema.projects.name,
          specId: specifications.id,
          specName: specifications.name,
          taskName: tasks.title,
          blockedReason: tasks.blockedReason,
        })
        .from(tasks)
        .innerJoin(plans, eq(tasks.planId, plans.id))
        .innerJoin(specifications, eq(plans.specId, specifications.id))
        .innerJoin(schema.projects, eq(specifications.projectId, schema.projects.id))
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (!context) return;

      await sendSlackNotification(context.projectId, 'task_blocked', {
        projectId: context.projectId,
        projectName: context.projectName,
        specId: context.specId,
        specName: context.specName,
        taskId: taskId,
        taskName: context.taskName,
        blockedReason: context.blockedReason || 'No reason provided.',
        appUrl: env.NEXT_PUBLIC_APP_URL,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to send task blocked Slack notification');
    }
  }

  async completeTaskAttempt(
    taskId: number,
    data: {
      status: 'done' | 'failed';
      output?: string;
      exitCode?: number;
      errorMessage?: string;
    }
  ): Promise<void> {
    const task = await this.getById(taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    // 1. Update task status (this triggers webhooks via update method)
    await this.update(taskId, {
      status: data.status === 'done' ? 'done' : 'failed',
    });

    // 2. Create task attempt record
    await this.executeQuery(async () => {
      const [latestAttempt] = await db
        .select({ seq: schema.taskAttempts.seq })
        .from(schema.taskAttempts)
        .where(eq(schema.taskAttempts.taskId, taskId))
        .orderBy(desc(schema.taskAttempts.seq))
        .limit(1);

      const nextSeq = (latestAttempt?.seq ?? 0) + 1;

      const [runningSession] = await db
        .select({ id: agentSessions.id })
        .from(agentSessions)
        .where(and(eq(agentSessions.planId, task.planId), eq(agentSessions.status, 'running')))
        .limit(1);

      await db.insert(schema.taskAttempts).values({
        taskId,
        sessionId: runningSession?.id || null,
        seq: nextSeq,
        status: data.status === 'done' ? 'succeeded' : 'failed',
        logLines: data.output ? [data.output] : [],
        exitCode: data.exitCode,
        errorMessage: data.errorMessage,
        endedAt: new Date(),
      });
    });

    // 3. Check if all tasks in the plan are done
    const allTasks = await this.getByPlanId(task.planId);
    const allDone = allTasks.every((t) => t.status === 'done' || t.status === 'skipped');

    if (allDone) {
      const [session] = await db
        .select()
        .from(agentSessions)
        .where(and(eq(agentSessions.planId, task.planId), eq(agentSessions.status, 'running')))
        .limit(1);

      if (session) {
        const { agentSessionRepository } = await import('@/repositories/agent-session-repository');
        await agentSessionRepository.update(session.id, {
          status: 'completed',
          endedAt: new Date(),
        });
      }
    }
  }
}

export const taskRepository = new TaskRepository();
