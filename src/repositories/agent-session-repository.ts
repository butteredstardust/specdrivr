import { db } from '@/db';
import { agentSessions, type AgentSessionSelect as AgentSession } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, DatabaseError } from '@/lib/errors';

export { type AgentSessionSelect as AgentSession } from '@/db/schema';

export class AgentSessionRepository extends BaseRepository {
  async getAll(): Promise<AgentSession[]> {
    return await this.execQuery(() =>
      db.select().from(agentSessions)
    );
  }

  async getById(id: number): Promise<AgentSession | null> {
    const result = await this.execQuery(() =>
      db.select().from(agentSessions).where(eq(agentSessions.id, id)).limit(1)
    );

    return result[0] || null;
  }

  async getByProjectId(projectId: number): Promise<AgentSession[]> {
    return await this.execQuery(() =>
      db.select().from(agentSessions).where(eq(agentSessions.projectId, projectId))
    );
  }

  async getByStatus(status: import('@/db/schema').SessionStatus): Promise<AgentSession[]> {
    return await this.execQuery(() =>
      db.select().from(agentSessions).where(eq(agentSessions.status, status))
    );
  }

  async create(data: { projectId: number; specId?: number; planId?: number; startedBy?: string }): Promise<AgentSession> {
    const [session] = await this.execQuery(() =>
      db.insert(agentSessions).values({
        projectId: data.projectId,
        specId: data.specId || null,
        planId: data.planId || null,
        startedBy: data.startedBy || null,
        status: 'running',
      }).returning()
    );

    if (!session) {
      throw new DatabaseError('Failed to create agent session');
    }

    return session;
  }

  async update(id: number, data: Partial<import('@/db/schema').AgentSessionInsert>): Promise<AgentSession> {
    const [updatedSession] = await this.execQuery(() =>
      db
        .update(agentSessions)
        .set(data as import('@/db/schema').AgentSessionInsert)
        .where(eq(agentSessions.id, id))
        .returning()
    );

    if (!updatedSession) {
      throw new NotFoundError(`Agent session with ID ${id} not found`);
    }

    return updatedSession;
  }

  async delete(id: number): Promise<void> {
    const result = await this.execQuery(() =>
      db.delete(agentSessions).where(eq(agentSessions.id, id)).returning()
    );

    if (result.length === 0) {
      throw new NotFoundError(`Agent session with ID ${id} not found`);
    }
  }
}

export const agentSessionRepository = new AgentSessionRepository();
