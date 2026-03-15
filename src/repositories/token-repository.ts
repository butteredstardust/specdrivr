import { db } from '@/db';
import {
  agentTokens,
  type AgentTokenSelect as AgentToken,
  type AgentTokenInsert,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { DatabaseError } from '@/lib/errors';

export { type AgentTokenSelect as AgentToken } from '@/db/schema';

export class TokenRepository extends BaseRepository {
  async getByUserId(userId: string) {
    return await this.executeQuery(() =>
      db
        .select({
          id: agentTokens.id,
          name: agentTokens.name,
          prefix: agentTokens.prefix,
          lastUsedAt: agentTokens.lastUsedAt,
          expiresAt: agentTokens.expiresAt,
          createdAt: agentTokens.createdAt,
        })
        .from(agentTokens)
        .where(eq(agentTokens.userId, userId))
    );
  }

  async create(data: Omit<AgentTokenInsert, 'id' | 'createdAt'>): Promise<AgentToken> {
    const [token] = await this.executeQuery(() => db.insert(agentTokens).values(data).returning());

    if (!token) {
      throw new DatabaseError('Failed to create agent token');
    }

    return token;
  }

  async getByPrefix(prefix: string): Promise<AgentToken | null> {
    const result = await this.executeQuery(() =>
      db.select().from(agentTokens).where(eq(agentTokens.prefix, prefix)).limit(1)
    );

    return result[0] || null;
  }

  async updateLastUsed(id: number): Promise<void> {
    await this.executeQuery(() =>
      db.update(agentTokens).set({ lastUsedAt: new Date() }).where(eq(agentTokens.id, id))
    );
  }

  async revoke(id: number): Promise<void> {
    await this.executeQuery(() =>
      db.update(agentTokens).set({ revokedAt: new Date() }).where(eq(agentTokens.id, id))
    );
  }

  async findByIdAndUserId(id: number, userId: string): Promise<{ id: number } | null> {
    const result = await this.executeQuery(() =>
      db
        .select({ id: agentTokens.id })
        .from(agentTokens)
        .where(and(eq(agentTokens.id, id), eq(agentTokens.userId, userId)))
        .limit(1)
    );
    return result[0] ?? null;
  }
}

export const tokenRepository = new TokenRepository();
