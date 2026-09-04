import { db } from '@/db';
import {
  tasks,
  auditLog,
  plans,
  specifications,
  agentSessions,
  agentEvents,
  taskAttempts,
  type TaskSelect as Task,
  type TaskStatus,
} from '@/db/schema';
import * as schema from '@/db/schema';
import { specificationRepository, agentConfigRepository } from '@/repositories';
import { getGitHubConfig, createPullRequest } from '@/lib/github';
import { eq, desc, sql, and, asc, getTableColumns } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, ValidationError, DatabaseError, BusinessError } from '@/lib/errors';
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
  expectedFiles?: string[];
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

  async getProjectId(id: number): Promise<number | null> {
    const [row] = await this.executeQuery(() =>
      db
        .select({ projectId: specifications.projectId })
        .from(tasks)
        .innerJoin(plans, eq(tasks.planId, plans.id))
        .innerJoin(specifications, eq(plans.specId, specifications.id))
        .where(eq(tasks.id, id))
        .limit(1)
    );
    return row?.projectId ?? null;
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

  /**
   * Returns all blocked tasks belonging to a specific project.
   * Joins through specifications to scope by projectId.
   */
  async getBlockedByProjectId(projectId: number): Promise<Task[]> {
    return this.executeQuery(() =>
      db
        .select(getTableColumns(tasks))
        .from(tasks)
        .innerJoin(specifications, eq(tasks.specId, specifications.id))
        .where(and(eq(tasks.status, 'blocked'), eq(specifications.projectId, projectId)))
        .orderBy(desc(tasks.createdAt))
    ) as Promise<Task[]>;
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
      planId: (() => {
        if (!data.planId) throw new ValidationError('planId is required to create a task');
        return data.planId;
      })(),
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
      expectedFiles: data.expectedFiles ?? [],
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
      await this.dispatchTaskWebhookAsync(
        t.id,
        t.planId,
        data.status === 'blocked' ? 'task.blocked' : 'task.done',
        data.status === 'blocked' ? { blockedReason: t.blockedReason } : {}
      );
      if (data.status === 'blocked') void this.notifySlackTaskBlocked(t.id);
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
  async claimNextTaskForProject(
    projectId: number,
    sessionId: number
  ): Promise<(Task & { attemptId: number; sessionId: number }) | null> {
    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        // Serialize capacity accounting for a session. Every claim for the same
        // session must acquire this row lock before it counts active leases.
        const [session] = await tx
          .select({
            maxConcurrentTasks: agentSessions.maxConcurrentTasks,
            status: agentSessions.status,
            projectId: agentSessions.projectId,
          })
          .from(agentSessions)
          .where(eq(agentSessions.id, sessionId))
          .limit(1)
          .for('update');

        if (!session || session.projectId !== projectId || session.status !== 'running')
          return null;

        // A running attempt is the durable lease and the capacity source of truth.
        const [activeCountResult] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(taskAttempts)
          .where(and(eq(taskAttempts.sessionId, sessionId), eq(taskAttempts.status, 'running')));

        const activeCount = Number(activeCountResult?.count ?? 0);

        if (activeCount >= session.maxConcurrentTasks) {
          logger.info(
            { sessionId, activeCount, max: session.maxConcurrentTasks },
            'Session reached max concurrent tasks limit'
          );
          return null;
        }

        // Find the next dependency-ready task and lock it before leasing it.
        const [nextTask] = await tx
          .select({ task: tasks })
          .from(tasks)
          .innerJoin(agentSessions, eq(tasks.planId, agentSessions.planId))
          .where(
            and(
              eq(agentSessions.projectId, projectId),
              eq(agentSessions.id, sessionId), // Scope to the specific session
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

        const [latestAttempt] = await tx
          .select({ seq: taskAttempts.seq })
          .from(taskAttempts)
          .where(eq(taskAttempts.taskId, nextTask.task.id))
          .orderBy(desc(taskAttempts.seq))
          .limit(1);

        const [attempt] = await tx
          .insert(taskAttempts)
          .values({
            taskId: nextTask.task.id,
            sessionId,
            seq: (latestAttempt?.seq ?? 0) + 1,
            status: 'running',
          })
          .returning({ id: taskAttempts.id });

        // Mark the task in progress and bind it to the lease before returning.
        const [updatedTask] = await tx
          .update(tasks)
          .set({
            status: 'in_progress',
            currentAttemptId: attempt.id,
            attemptCount: sql`${tasks.attemptCount} + 1`,
            startedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(tasks.id, nextTask.task.id), eq(tasks.status, 'todo')))
          .returning();

        if (!updatedTask) throw new BusinessError('Task was claimed concurrently', 'TASK_CLAIMED');

        // 5. Update agent session with current task ID
        await tx
          .update(agentSessions)
          .set({ currentTaskId: updatedTask.id })
          .where(eq(agentSessions.id, sessionId));

        // 6. Log TASK_START event
        const startEvent = {
          sessionId,
          specId: updatedTask.specId,
          taskId: updatedTask.id,
          eventType: 'TASK_START',
          message: `Agent started Task ${updatedTask.externalId}: ${updatedTask.title}`,
          metadata: { externalId: updatedTask.externalId },
        };
        await tx.insert(agentEvents).values(startEvent);
        void this.publishToSession(sessionId, 'events', startEvent);

        return { ...updatedTask, attemptId: attempt.id, sessionId };
      });
    }).then(async (updatedTask) => {
      if (!updatedTask) return updatedTask;
      const t = updatedTask;
      if (t.status === 'blocked') {
        await this.dispatchTaskWebhookAsync(t.id, t.planId, 'task.blocked', {
          blockedReason: t.blockedReason,
        });
        void this.notifySlackTaskBlocked(t.id);
      } else if (t.status === 'done') {
        await this.dispatchTaskWebhookAsync(t.id, t.planId, 'task.done', {});
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
    if (!['failed', 'done', 'skipped'].includes(task.status)) {
      throw new BusinessError(`Task in ${task.status} state cannot be retried`, 'INVALID_STATE');
    }

    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedTask] = await tx
          .update(tasks)
          .set({
            status: 'todo',
            completedAt: null,
            currentAttemptId: null,
            forcedDone: false,
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
    }).then(async (updatedTask) => {
      await this.dispatchTaskWebhookAsync(updatedTask.id, updatedTask.planId, 'task.retried', {
        attemptCount: updatedTask.attemptCount,
      });
      return updatedTask;
    });
  }

  /**
   * Unblocks a task with human context.
   */
  async unblockTask(id: number, humanContext: string, userId: string): Promise<Task> {
    const task = await this.getById(id);
    if (!task) throw new NotFoundError(`Task with ID ${id} not found`);
    if (task.status !== 'blocked') {
      throw new BusinessError(`Task in ${task.status} state cannot be unblocked`, 'INVALID_STATE');
    }

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
    }).then(async (updatedTask) => {
      await this.dispatchTaskWebhookAsync(updatedTask.id, updatedTask.planId, 'task.unblocked', {
        humanContext,
      });
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
    if (status === 'done' && !notes?.trim()) {
      throw new ValidationError('A reason is required to manually complete a task');
    }
    if (task.status === 'in_progress') {
      throw new BusinessError(
        'Cancel the owning session before overriding this task',
        'ACTIVE_LEASE'
      );
    }

    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedTask] = await tx
          .update(tasks)
          .set({
            status,
            completedAt: status === 'done' ? new Date() : task.completedAt,
            forcedDone: status === 'done' ? true : task.forcedDone,
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
    }).then(async (updatedTask) => {
      if (updatedTask.status === 'blocked') {
        await this.dispatchTaskWebhookAsync(updatedTask.id, updatedTask.planId, 'task.blocked', {
          from: task.status,
          to: updatedTask.status,
          notes,
        });
        void this.notifySlackTaskBlocked(updatedTask.id);
      } else if (updatedTask.status === 'done') {
        await this.dispatchTaskWebhookAsync(updatedTask.id, updatedTask.planId, 'task.done', {
          from: task.status,
          to: updatedTask.status,
          notes,
        });
      }
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
   * Fetches the plan/spec/session context for a task and dispatches a webhook event asynchronously.
   * Centralises the repeated fire-and-forget pattern used after every task status mutation.
   */
  private async dispatchTaskWebhookAsync(
    taskId: number,
    planId: number,
    event: WebhookEventType,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
      if (!plan) return;
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
        await dispatchWebhookEvent(spec.pid, event, {
          taskId,
          specId: plan.specId,
          sessionId: session?.id,
          data,
        });
      }
    } catch (err) {
      logger.error({ err }, `Failed to dispatch ${event} webhook`);
    }
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
    expectedProjectId: number,
    data: {
      attemptId: number;
      sessionId: number;
      completionKey: string;
      status: 'done' | 'failed';
      output?: string;
      exitCode?: number;
      errorMessage?: string;
      gitBranch?: string;
      gitCommitHash?: string;
      totalCostUsd?: number;
      verificationPassed?: boolean;
      verificationOutput?: string;
      verificationExitCode?: number;
    }
  ): Promise<{ sessionId: number | null }> {
    const task = await this.getById(taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    const projectId = await this.getProjectId(taskId);
    if (projectId !== expectedProjectId) {
      throw new NotFoundError(`Task with ID ${taskId} not found in project ${expectedProjectId}`);
    }

    const finalStatus = data.status === 'done' ? ('done' as const) : ('failed' as const);
    const activeSessionId: number | null = data.sessionId;
    let planCompleted = false;
    let didTransition = false;

    await this.executeQuery(() =>
      db.transaction(async (tx) => {
        const [attempt] = await tx
          .select()
          .from(taskAttempts)
          .where(eq(taskAttempts.id, data.attemptId))
          .limit(1)
          .for('update');

        if (!attempt || attempt.taskId !== taskId || attempt.sessionId !== data.sessionId) {
          throw new BusinessError('Attempt does not own this task and session', 'INVALID_LEASE');
        }

        const [ownedSession] = await tx
          .select({ projectId: agentSessions.projectId, status: agentSessions.status })
          .from(agentSessions)
          .where(eq(agentSessions.id, data.sessionId))
          .limit(1)
          .for('update');

        if (!ownedSession || ownedSession.projectId !== expectedProjectId) {
          throw new BusinessError('Session does not belong to this project', 'INVALID_LEASE');
        }

        if (attempt.status !== 'running') {
          if (attempt.completionKey === data.completionKey) return;
          throw new BusinessError('Attempt has already been completed', 'ATTEMPT_COMPLETED');
        }

        const [updatedTask] = await tx
          .update(tasks)
          .set({
            status: finalStatus,
            completedAt: finalStatus === 'done' ? new Date() : null,
            gitBranch: data.gitBranch || task.gitBranch,
            gitCommitHash: data.gitCommitHash || task.gitCommitHash,
            totalCostUsd: data.totalCostUsd || task.totalCostUsd,
            verificationPassed: data.verificationPassed ?? task.verificationPassed,
            verificationOutput: data.verificationOutput ?? task.verificationOutput,
            verificationExitCode: data.verificationExitCode ?? task.verificationExitCode,
            verificationCompletedAt:
              data.verificationPassed !== undefined ? new Date() : task.verificationCompletedAt,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(tasks.id, taskId),
              eq(tasks.status, 'in_progress'),
              eq(tasks.currentAttemptId, data.attemptId)
            )
          )
          .returning({ id: tasks.id });

        if (!updatedTask) {
          throw new BusinessError('Task is not owned by this active attempt', 'INVALID_LEASE');
        }

        await tx
          .update(taskAttempts)
          .set({
            status: finalStatus === 'done' ? 'succeeded' : 'failed',
            completionKey: data.completionKey,
            logLines: data.output ? [data.output] : [],
            exitCode: data.exitCode,
            errorMessage: data.errorMessage,
            endedAt: new Date(),
          })
          .where(and(eq(taskAttempts.id, data.attemptId), eq(taskAttempts.status, 'running')));

        await tx
          .update(agentSessions)
          .set({
            tasksExecuted: sql`${agentSessions.tasksExecuted} + 1`,
            tasksSucceeded:
              finalStatus === 'done'
                ? sql`${agentSessions.tasksSucceeded} + 1`
                : agentSessions.tasksSucceeded,
            tasksFailed:
              finalStatus === 'failed'
                ? sql`${agentSessions.tasksFailed} + 1`
                : agentSessions.tasksFailed,
            currentTaskId: null,
          })
          .where(eq(agentSessions.id, data.sessionId));

        didTransition = true;

        // 3. Check if all tasks in the plan are done and close the session atomically
        const allTasks = await tx
          .select({ status: tasks.status })
          .from(tasks)
          .where(eq(tasks.planId, task.planId));

        const allDone = allTasks.every((t) => t.status === 'done' || t.status === 'skipped');

        if (allDone) {
          await tx
            .update(agentSessions)
            .set({ status: 'completed', endedAt: new Date() })
            .where(eq(agentSessions.id, data.sessionId));
          planCompleted = true;
        }
      })
    );

    // A replay with the same completion key returns successfully without
    // emitting duplicate events, counters, webhooks, or pull requests.
    if (didTransition) {
      await this.dispatchTaskWebhookAsync(
        task.id,
        task.planId,
        finalStatus === 'done' ? 'task.done' : 'task.failed',
        planCompleted ? { planCompleted: true } : {}
      );

      // Persist the event before returning so process teardown cannot lose it.
      try {
        const [plan] = await db.select().from(plans).where(eq(plans.id, task.planId)).limit(1);
        if (plan) {
          const eventData = {
            sessionId: data.sessionId,
            specId: plan.specId,
            taskId: task.id,
            eventType: finalStatus === 'done' ? 'TASK_DONE' : 'TASK_FAILED',
            message:
              finalStatus === 'done'
                ? `Task completed: ${task.externalId}`
                : `Task failed: ${task.externalId}`,
            metadata: {
              externalId: task.externalId,
              exitCode: data.exitCode,
              error: data.errorMessage,
            },
          };
          await db.insert(agentEvents).values(eventData);
          void this.publishToSession(data.sessionId, 'events', eventData);
          void this.publishToSession(data.sessionId, 'updates', { type: 'update' });
        }
      } catch (err) {
        logger.warn({ err, taskId: task.id }, 'Failed to log task completion event');
      }

      if (finalStatus === 'done') void this.triggerPullRequestAutomation(task.id, planCompleted);
    }

    return { sessionId: activeSessionId };
  }

  /**
   * Triggers GitHub PR creation if configured for the project.
   */
  private async triggerPullRequestAutomation(
    taskId: number,
    planCompleted: boolean
  ): Promise<void> {
    try {
      const task = await this.getById(taskId);
      if (!task || !task.specId) return;

      const spec = await specificationRepository.getById(task.specId);
      if (!spec) return;

      const config = await agentConfigRepository.getByProjectId(spec.projectId);
      if (!config || !config.prAutoCreate) return;

      // Only create PR if task has a git branch
      if (!task.gitBranch) {
        logger.info({ taskId }, 'Skipping PR automation: Task has no gitBranch');
        return;
      }

      // Check if PR already exists for this task
      if (task.pullRequestUrl) {
        logger.info({ taskId, url: task.pullRequestUrl }, 'PR already exists for task');
        return;
      }

      const ghConfig = await getGitHubConfig(spec.projectId);
      if (!ghConfig) return;

      logger.info({ taskId, repo: ghConfig.repo }, 'Triggering automated PR creation');

      const pr = await createPullRequest({
        token: ghConfig.token,
        repo: ghConfig.repo,
        title: `feat(${task.externalId}): ${task.title}`,
        head: task.gitBranch,
        base: config.prTargetBranch || ghConfig.branch || 'main',
        body: `### Task Detail\n${task.description}\n\n**Expected Files**:\n${(task.expectedFiles ?? []).join('\n')}\n\n---\n*Automated PR created by Specdrivr DAEMON*`,
      });

      if (pr?.html_url) {
        await db.update(tasks).set({ pullRequestUrl: pr.html_url }).where(eq(tasks.id, taskId));
        logger.info({ taskId, prUrl: pr.html_url }, 'Successfully created automated PR');

        // If plan is completed, also update the session
        const [session] = await db
          .select({ id: agentSessions.id })
          .from(agentSessions)
          .where(eq(agentSessions.planId, task.planId))
          .orderBy(desc(agentSessions.startedAt))
          .limit(1);

        if (session && planCompleted) {
          await db
            .update(agentSessions)
            .set({ pullRequestUrl: pr.html_url })
            .where(eq(agentSessions.id, session.id));
        }
      }
    } catch (err) {
      logger.error({ err, taskId }, 'Failed to execute PR automation');
    }
  }
}

export const taskRepository = new TaskRepository();
