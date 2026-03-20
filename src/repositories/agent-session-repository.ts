import { db } from '@/db';
import {
  agentSessions,
  agentEvents,
  auditLog,
  tasks,
  type AgentSessionSelect as AgentSession,
  type AgentEventInsert,
  type AgentEventSelect,
  projects,
  specifications,
} from '@/db/schema';
import { eq, desc, inArray, asc, lt, and } from 'drizzle-orm';
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
  async recoverGhostSessions(thresholdMinutes = 5): Promise<number> {
    return await this.executeQuery(async () => {
      const thresholdDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

      return await db.transaction(async (tx) => {
        // 1. Find sessions that are running but haven't pulsed a heartbeat since threshold
        const staleSessions = await tx
          .select()
          .from(agentSessions)
          .where(
            and(
              eq(agentSessions.status, 'running'),
              lt(agentSessions.lastHeartbeatAt, thresholdDate)
            )
          );

        if (staleSessions.length === 0) return 0;

        const sessionIds = staleSessions.map((s) => s.id);
        const currentTaskIds = staleSessions
          .map((s) => s.currentTaskId)
          .filter((id): id is number => id !== null);

        // 2. Revert tasks to 'todo'
        if (currentTaskIds.length > 0) {
          await tx
            .update(tasks)
            .set({ status: 'todo', updatedAt: new Date() })
            .where(and(eq(tasks.status, 'in_progress'), inArray(tasks.id, currentTaskIds)));
        }

        // 3. Mark sessions as failed
        await tx
          .update(agentSessions)
          .set({
            status: 'failed',
            errorMessage: `Session timed out (no heartbeat for >${thresholdMinutes}m)`,
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
            metadata: { thresholdMinutes, lastHeartbeatAt: session.lastHeartbeatAt },
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
    data: { totalPromptTokens: number; totalCompletionTokens: number }
  ): Promise<void> {
    await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        await tx
          .update(agentSessions)
          .set({
            status: 'completed',
            endedAt: new Date(),
            totalPromptTokens: data.totalPromptTokens,
            totalCompletionTokens: data.totalCompletionTokens,
          })
          .where(eq(agentSessions.id, sessionId));

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
