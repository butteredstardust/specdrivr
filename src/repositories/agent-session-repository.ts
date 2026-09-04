import { db } from '@/db';
import {
  agentSessions,
  agentEvents,
  taskAttempts,
  auditLog,
  tasks,
  planJobs,
  type AgentSessionSelect as AgentSession,
  type AgentEventInsert,
  type AgentEventSelect,
  projects,
  specifications,
} from '@/db/schema';
import { eq, desc, inArray, asc, lt, and, sql, or, isNull, isNotNull } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, DatabaseError } from '@/lib/errors';
import { dispatchWebhookEvent, type WebhookEventType } from '@/lib/webhooks';
import { sendSlackNotification, type SlackEventType } from '@/lib/slack';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export { type AgentSessionSelect as AgentSession } from '@/db/schema';

export class AgentSessionRepository extends BaseRepository {
  /**
   * Identifies "Ghost Sessions" (running sessions that haven't updated their heartbeat)
   * and reverts their current tasks to 'todo'.
   */
  async recoverGhostSessions(thresholdSeconds = 60): Promise<number> {
    return await this.executeQuery(async () => {
      const thresholdDate = new Date(Date.now() - thresholdSeconds * 1000);

      return await db.transaction(async (tx) => {
        // 1. Find sessions that are running but haven't pulsed a heartbeat since threshold
        const staleSessions = await tx
          .select()
          .from(agentSessions)
          .where(
            and(
              eq(agentSessions.status, 'running'),
              or(
                and(
                  isNotNull(agentSessions.lastHeartbeatAt),
                  lt(agentSessions.lastHeartbeatAt, thresholdDate)
                ),
                and(
                  isNull(agentSessions.lastHeartbeatAt),
                  lt(agentSessions.startedAt, thresholdDate)
                )
              )
            )
          );

        if (staleSessions.length === 0) return 0;

        const sessionIds = staleSessions.map((s) => s.id);
        const activeAttempts = await tx
          .select({
            id: taskAttempts.id,
            taskId: taskAttempts.taskId,
            sessionId: taskAttempts.sessionId,
          })
          .from(taskAttempts)
          .where(
            and(inArray(taskAttempts.sessionId, sessionIds), eq(taskAttempts.status, 'running'))
          )
          .for('update');
        const leasedTaskIds = activeAttempts.map((attempt) => attempt.taskId);

        if (activeAttempts.length > 0) {
          await tx
            .update(taskAttempts)
            .set({
              status: 'failed',
              errorMessage: 'Lease recovered after session heartbeat timeout',
              endedAt: new Date(),
            })
            .where(
              inArray(
                taskAttempts.id,
                activeAttempts.map((attempt) => attempt.id)
              )
            );

          await tx
            .update(tasks)
            .set({ status: 'todo', currentAttemptId: null, startedAt: null, updatedAt: new Date() })
            .where(and(eq(tasks.status, 'in_progress'), inArray(tasks.id, leasedTaskIds)));

          for (const attempt of activeAttempts) {
            const owner = staleSessions.find((session) => session.id === attempt.sessionId);
            await tx.insert(agentEvents).values({
              sessionId: attempt.sessionId,
              specId: owner?.specId ?? null,
              taskId: attempt.taskId,
              eventType: 'GHOST_TASK_RESET',
              message: 'Recovered task lease after heartbeat timeout',
              metadata: { attemptId: attempt.id, thresholdSeconds },
            });
          }
        }

        // 3. Mark sessions as failed
        await tx
          .update(agentSessions)
          .set({
            status: 'failed',
            currentTaskId: null,
            errorMessage: `Session timed out (no heartbeat for >${thresholdSeconds}s)`,
            endedAt: new Date(),
          })
          .where(inArray(agentSessions.id, sessionIds));

        // 4. Log events for each recovered session
        for (const session of staleSessions) {
          await tx.insert(agentEvents).values({
            sessionId: session.id,
            specId: session.specId || null,
            taskId: session.currentTaskId || null,
            eventType: 'SESSION_FAILED',
            message: `Ghost Buster: Recovered session after heartbeat timeout`,
            metadata: { thresholdSeconds, lastHeartbeatAt: session.lastHeartbeatAt },
          });

          // Trigger session.failed webhook
          void dispatchWebhookEvent(session.projectId, 'session.failed', {
            sessionId: session.id,
            specId: session.specId || undefined,
            data: { reason: 'heartbeat_timeout' },
          });

          // Trigger Slack notification
          void this.notifySlack(session.id, 'session_failed');
        }

        return sessionIds.length;
      });
    });
  }

  async cancelWithLeaseRecovery(sessionId: number, actorId: string): Promise<AgentSession> {
    return this.executeQuery(() =>
      db.transaction(async (tx) => {
        const [session] = await tx
          .select()
          .from(agentSessions)
          .where(eq(agentSessions.id, sessionId))
          .limit(1)
          .for('update');
        if (!session) throw new NotFoundError(`Agent session with ID ${sessionId} not found`);

        const activeAttempts = await tx
          .select({ id: taskAttempts.id, taskId: taskAttempts.taskId })
          .from(taskAttempts)
          .where(and(eq(taskAttempts.sessionId, sessionId), eq(taskAttempts.status, 'running')))
          .for('update');

        if (activeAttempts.length > 0) {
          await tx
            .update(taskAttempts)
            .set({ status: 'failed', errorMessage: 'Session cancelled', endedAt: new Date() })
            .where(
              inArray(
                taskAttempts.id,
                activeAttempts.map((attempt) => attempt.id)
              )
            );
          await tx
            .update(tasks)
            .set({ status: 'todo', currentAttemptId: null, startedAt: null, updatedAt: new Date() })
            .where(
              inArray(
                tasks.id,
                activeAttempts.map((attempt) => attempt.taskId)
              )
            );

          for (const attempt of activeAttempts) {
            await tx.insert(agentEvents).values({
              sessionId,
              specId: session.specId,
              taskId: attempt.taskId,
              eventType: 'GHOST_TASK_RESET',
              message: 'Released task lease because the session was cancelled',
              metadata: { attemptId: attempt.id, reason: 'session_cancelled' },
            });
          }
        }

        const [cancelled] = await tx
          .update(agentSessions)
          .set({ status: 'cancelled', currentTaskId: null, endedAt: new Date() })
          .where(eq(agentSessions.id, sessionId))
          .returning();
        await tx.insert(auditLog).values({
          projectId: session.projectId,
          userId: actorId,
          action: 'cancel_session',
          targetType: 'agent_session',
          targetId: String(sessionId),
          detail: { recoveredTaskCount: activeAttempts.length },
        });
        await tx.insert(agentEvents).values({
          sessionId,
          specId: session.specId,
          eventType: 'SESSION_CANCELLED',
          message: 'Session cancelled by project administrator',
          metadata: { actorId, recoveredTaskCount: activeAttempts.length },
        });
        return cancelled;
      })
    );
  }

  async getAll(limit = 50, offset = 0): Promise<AgentSession[]> {
    return await this.executeQuery(() =>
      db
        .select()
        .from(agentSessions)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(agentSessions.startedAt))
    );
  }

  async getById(id: number): Promise<AgentSession | null> {
    const result = await this.executeQuery(() =>
      db.select().from(agentSessions).where(eq(agentSessions.id, id)).limit(1)
    );

    return result[0] || null;
  }

  async heartbeatForProject(id: number, projectId: number): Promise<boolean> {
    const updated = await this.executeQuery(() =>
      db
        .update(agentSessions)
        .set({ lastHeartbeatAt: new Date() })
        .where(and(eq(agentSessions.id, id), eq(agentSessions.projectId, projectId)))
        .returning({ id: agentSessions.id })
    );
    return updated.length === 1;
  }

  async getByProjectId(projectId: number, limit = 50, offset = 0): Promise<AgentSession[]> {
    return await this.executeQuery(() =>
      db
        .select()
        .from(agentSessions)
        .where(eq(agentSessions.projectId, projectId))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(agentSessions.startedAt))
    );
  }

  async getByProjectIds(projectIds: number[], limit = 50, offset = 0): Promise<AgentSession[]> {
    return await this.executeQuery(() =>
      db
        .select()
        .from(agentSessions)
        .where(inArray(agentSessions.projectId, projectIds))
        .orderBy(desc(agentSessions.startedAt))
        .limit(limit)
        .offset(offset)
    );
  }

  async getByStatus(status: import('@/db/schema').SessionStatus): Promise<AgentSession[]> {
    return await this.executeQuery(() =>
      db.select().from(agentSessions).where(eq(agentSessions.status, status))
    );
  }

  async getFilteredByProject(
    projectId: number,
    options: { status?: string },
    limit: number,
    offset: number
  ): Promise<AgentSession[]> {
    return await this.executeQuery(() => {
      const conditions = [eq(agentSessions.projectId, projectId)];
      if (options.status) {
        conditions.push(
          eq(agentSessions.status, options.status as import('@/db/schema').SessionStatus)
        );
      }
      return db
        .select()
        .from(agentSessions)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(agentSessions.startedAt));
    });
  }

  async countFilteredByProject(projectId: number, options: { status?: string }): Promise<number> {
    return await this.executeQuery(async () => {
      const conditions = [eq(agentSessions.projectId, projectId)];
      if (options.status) {
        conditions.push(
          eq(agentSessions.status, options.status as import('@/db/schema').SessionStatus)
        );
      }
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentSessions)
        .where(and(...conditions));
      return result?.count ?? 0;
    });
  }

  async create(data: {
    projectId: number;
    specId?: number;
    planId?: number;
    startedBy?: string;
  }): Promise<AgentSession> {
    const [session] = await this.executeQuery(() =>
      db
        .insert(agentSessions)
        .values({
          projectId: data.projectId,
          specId: data.specId || null,
          planId: data.planId || null,
          startedBy: data.startedBy || null,
          status: 'running',
        })
        .returning()
    );

    if (!session) {
      throw new DatabaseError('Failed to create agent session');
    }

    // 1. Log Session Started event
    const startEvent = {
      sessionId: session.id,
      specId: session.specId || null,
      eventType: 'SESSION_STARTED',
      message: `Agent session SESS-${String(session.id).padStart(3, '0')} started`,
      metadata: {
        projectId: session.projectId,
        planId: session.planId,
        startedBy: session.startedBy,
      },
    };

    await this.executeQuery(() => db.insert(agentEvents).values(startEvent));
    void this.publishToSession(session.id, 'events', startEvent);

    // 2. Log Plan Approved event if this session is linked to a plan
    if (session.planId) {
      const planEvent = {
        sessionId: session.id,
        specId: session.specId || null,
        eventType: 'PLAN_APPROVED',
        message: `Plan #${session.planId} approved and execution started`,
        metadata: { planId: session.planId },
      };
      await this.executeQuery(() => db.insert(agentEvents).values(planEvent));
      void this.publishToSession(session.id, 'events', planEvent);
    }

    // Trigger session.started webhook
    void dispatchWebhookEvent(session.projectId, 'session.started', {
      sessionId: session.id,
      specId: session.specId || undefined,
      data: {},
    });

    // Trigger Slack notification
    void this.notifySlack(session.id, 'session_started');

    return session;
  }

  async update(
    id: number,
    data: Partial<import('@/db/schema').AgentSessionInsert>,
    actorId?: string
  ): Promise<AgentSession> {
    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updatedSession] = await tx
          .update(agentSessions)
          .set(data as import('@/db/schema').AgentSessionInsert)
          .where(eq(agentSessions.id, id))
          .returning();

        if (!updatedSession) {
          throw new NotFoundError(`Agent session with ID ${id} not found`);
        }

        if (actorId) {
          await tx.insert(auditLog).values({
            projectId: updatedSession.projectId,
            userId: actorId,
            action: data.status === 'cancelled' ? 'cancel_session' : 'update_session',
            targetType: 'agent_session',
            targetId: String(id),
            detail: data,
          });
        }

        // Log lifecycle events
        if (data.status) {
          const eventTypeMap: Record<string, string> = {
            running: 'SESSION_RESUMED',
            paused: 'SESSION_PAUSED',
            cancelled: 'SESSION_CANCELLED',
            completed: 'SESSION_COMPLETED',
            failed: 'SESSION_FAILED',
          };

          const eventType = eventTypeMap[data.status];
          if (eventType) {
            const eventData = {
              sessionId: id,
              specId: updatedSession.specId,
              eventType,
              message: `Session status changed to ${data.status}`,
              metadata: { actorId },
            };
            await tx.insert(agentEvents).values(eventData);
            void this.publishToSession(id, 'events', eventData);
          }
        }

        // 5. Trigger session update channel
        void this.publishToSession(id, 'updates', { type: 'update', status: data.status });

        return updatedSession;
      });
    }).then((updatedSession) => {
      // Trigger appropriate session webhook after transaction commits
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
        const eventMap: Record<string, WebhookEventType> = {
          completed: 'session.completed',
          failed: 'session.failed',
          cancelled: 'session.cancelled',
        };

        const event = eventMap[data.status];
        if (event) {
          void dispatchWebhookEvent(updatedSession.projectId, event, {
            sessionId: updatedSession.id,
            specId: updatedSession.specId || undefined,
            data: data.status === 'completed' ? { totalCostUsd: updatedSession.totalCostUsd } : {},
          });

          // Trigger Slack notification
          if (data.status === 'completed') {
            void this.notifySlack(updatedSession.id, 'session_completed');
          } else if (data.status === 'failed') {
            void this.notifySlack(updatedSession.id, 'session_failed');
          }
        }
      }
      return updatedSession;
    });
  }

  /**
   * Helper to fetch context and send Slack notification for a session.
   */
  private async notifySlack(sessionId: number, event: SlackEventType): Promise<void> {
    try {
      const [context] = await this.executeQuery(() =>
        db
          .select({
            projectId: projects.id,
            projectName: projects.name,
            specId: specifications.id,
            specName: specifications.name,
            totalCostUsd: agentSessions.totalCostUsd,
          })
          .from(agentSessions)
          .innerJoin(projects, eq(agentSessions.projectId, projects.id))
          .leftJoin(specifications, eq(agentSessions.specId, specifications.id))
          .where(eq(agentSessions.id, sessionId))
          .limit(1)
      );

      if (!context) return;

      await sendSlackNotification(context.projectId, event, {
        projectId: context.projectId,
        projectName: context.projectName,
        sessionId: sessionId,
        specId: context.specId || undefined,
        specName: context.specName || undefined,
        totalCostUsd: context.totalCostUsd || 0,
        appUrl: env.NEXT_PUBLIC_APP_URL,
      });
    } catch (err) {
      // Never throw from notification helper
      logger.error({ err }, 'Failed to send session Slack notification');
    }
  }

  /**
   * Returns the combined project activity feed (agent events + failed plan jobs),
   * ordered by recency. Corresponds to the /projects/:id/activity API route.
   */
  async getProjectActivity(projectId: number, limit = 20): Promise<Record<string, unknown>[]> {
    return await this.executeQuery(async () => {
      const events = await db
        .select({
          id: agentEvents.id,
          type: sql<string>`'event'`,
          eventType: agentEvents.eventType,
          message: agentEvents.message,
          metadata: agentEvents.metadata,
          createdAt: agentEvents.createdAt,
          sessionId: agentEvents.sessionId,
          specId: agentEvents.specId,
        })
        .from(agentEvents)
        .innerJoin(agentSessions, eq(agentEvents.sessionId, agentSessions.id))
        .where(eq(agentSessions.projectId, projectId))
        .orderBy(desc(agentEvents.createdAt))
        .limit(limit);

      const failedJobs = await db
        .select({
          id: planJobs.id,
          type: sql<string>`'job'`,
          eventType: sql<string>`'JOB_FAILED'`,
          message: sql<string>`'Background ' || ${planJobs.type} || ' failed'`,
          metadata: sql<
            Record<string, unknown>
          >`json_build_object('error', ${planJobs.error}, 'jobType', ${planJobs.type})`,
          createdAt: planJobs.updatedAt,
          sessionId: sql<number | null>`null`,
          specId: planJobs.specId,
        })
        .from(planJobs)
        .where(and(eq(planJobs.projectId, projectId), eq(planJobs.status, 'failed')))
        .orderBy(desc(planJobs.updatedAt))
        .limit(10);

      return [...events, ...failedJobs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit) as Record<string, unknown>[];
    });
  }

  async getEvents(sessionId: number, limit: number): Promise<AgentEventSelect[]> {
    const rows = await this.executeQuery(() =>
      db
        .select()
        .from(agentEvents)
        .where(eq(agentEvents.sessionId, sessionId))
        .orderBy(desc(agentEvents.createdAt))
        .limit(limit)
    );
    return rows.reverse(); // chronological order for log display
  }

  async getEventsBySpecId(
    specId: number,
    limit = 200
  ): Promise<(typeof agentEvents.$inferSelect)[]> {
    const rows = await this.executeQuery(() =>
      db
        .select()
        .from(agentEvents)
        .where(eq(agentEvents.specId, specId))
        .orderBy(asc(agentEvents.createdAt))
        .limit(limit)
    );
    return rows;
  }

  async addEvent(data: Omit<AgentEventInsert, 'id' | 'createdAt'>): Promise<void> {
    await this.executeQuery(() => db.insert(agentEvents).values(data));
  }

  async complete(
    sessionId: number,
    projectId: number,
    data: { totalPromptTokens: number; totalCompletionTokens: number }
  ): Promise<void> {
    await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [completedSession] = await tx
          .update(agentSessions)
          .set({
            status: 'completed',
            endedAt: new Date(),
            totalPromptTokens: data.totalPromptTokens,
            totalCompletionTokens: data.totalCompletionTokens,
          })
          .where(and(eq(agentSessions.id, sessionId), eq(agentSessions.projectId, projectId)))
          .returning({ id: agentSessions.id });

        if (!completedSession) {
          throw new NotFoundError(`Agent session with ID ${sessionId} not found in project`);
        }

        await tx.insert(agentEvents).values({
          sessionId,
          eventType: 'SESSION_COMPLETED',
          message: 'Agent session completed successfully',
          metadata: {
            totalPromptTokens: data.totalPromptTokens,
            totalCompletionTokens: data.totalCompletionTokens,
          },
        });
      });
    });
  }

  async delete(id: number): Promise<void> {
    const result = await this.executeQuery(() =>
      db.delete(agentSessions).where(eq(agentSessions.id, id)).returning()
    );

    if (result.length === 0) {
      throw new NotFoundError(`Agent session with ID ${id} not found`);
    }
  }
}

export const agentSessionRepository = new AgentSessionRepository();
