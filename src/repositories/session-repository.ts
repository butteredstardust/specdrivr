import { db } from '@/db';
import { sessions, type SessionSelect as Session } from '@/db/schema';
import { eq, ne, and } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import { BaseRepository } from './base-repository';

export { type SessionSelect as Session } from '@/db/schema';

export type SessionSummary = Pick<
  Session,
  'id' | 'userAgent' | 'ipAddress' | 'createdAt' | 'updatedAt'
>;

export class SessionRepository extends BaseRepository {
  async getByUserId(userId: string): Promise<SessionSummary[]> {
    return await this.executeQuery(() =>
      db
        .select({
          id: sessions.id,
          userAgent: sessions.userAgent,
          ipAddress: sessions.ipAddress,
          createdAt: sessions.createdAt,
          updatedAt: sessions.updatedAt,
        })
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.updatedAt))
    );
  }

  async findByIdAndUserId(sessionId: string, userId: string): Promise<{ id: string } | null> {
    const result = await this.executeQuery(() =>
      db
        .select({ id: sessions.id })
        .from(sessions)
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
        .limit(1)
    );
    return result[0] ?? null;
  }

  async deleteById(sessionId: string): Promise<void> {
    await this.executeQuery(() => db.delete(sessions).where(eq(sessions.id, sessionId)));
  }

  async deleteOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await this.executeQuery(() =>
      db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)))
    );
  }
}

export const sessionRepository = new SessionRepository();
