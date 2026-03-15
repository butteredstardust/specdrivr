import { db } from '@/db';
import {
  agentSessions,
  agentEvents,
  auditLog,
  type AgentSessionSelect as AgentSession,
  type AgentEventInsert,
  type AgentEventSelect,
  projects,
  specifications,
} from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, DatabaseError } from '@/lib/errors';
import { dispatchWebhookEvent, type WebhookEventType } from '@/lib/webhooks';
import { sendSlackNotification, type SlackEventType } from '@/lib/slack';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export { type AgentSessionSelect as AgentSession } from '@/db/schema';

export class AgentSessionRepository extends BaseRepository {
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
