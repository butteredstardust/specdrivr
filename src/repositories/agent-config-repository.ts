import { db } from '@/db';
import { agentConfig, type AgentConfigSelect, type AgentConfigInsert } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';

export class AgentConfigRepository extends BaseRepository {
  async getByProjectId(projectId: number): Promise<AgentConfigSelect | null> {
    const result = await this.executeQuery(() =>
      db.select().from(agentConfig).where(eq(agentConfig.projectId, projectId)).limit(1)
    );
    return result[0] ?? null;
  }

  async upsertByProjectId(
    projectId: number,
    data: Partial<Omit<AgentConfigInsert, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>
  ): Promise<AgentConfigSelect> {
    const [result] = await this.executeQuery(() =>
      db
        .insert(agentConfig)
        .values({ projectId, ...data } as AgentConfigInsert)
        .onConflictDoUpdate({
          target: agentConfig.projectId,
          set: { ...data, updatedAt: new Date() },
        })
        .returning()
    );
    return result!;
  }
}

export const agentConfigRepository = new AgentConfigRepository();
