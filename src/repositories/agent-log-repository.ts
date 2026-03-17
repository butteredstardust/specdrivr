import { db } from '@/db';
import { agentLogs, type AgentLogInsert, type AgentLogSelect } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { BaseRepository } from './base-repository';

export class AgentLogRepository extends BaseRepository {
  async create(data: AgentLogInsert): Promise<AgentLogSelect> {
    const [log] = await this.executeQuery(() => db.insert(agentLogs).values(data).returning());
    return log;
  }

  async findBySessionId(
    sessionId: number,
    options: { limit?: number } = {}
  ): Promise<AgentLogSelect[]> {
    return this.executeQuery(() =>
      db
        .select()
        .from(agentLogs)
        .where(eq(agentLogs.sessionId, sessionId))
        .orderBy(desc(agentLogs.timestamp))
        .limit(options.limit || 100)
    );
  }

  async findByTaskId(taskId: number): Promise<AgentLogSelect[]> {
    return this.executeQuery(() =>
      db
        .select()
        .from(agentLogs)
        .where(eq(agentLogs.taskId, taskId))
        .orderBy(desc(agentLogs.timestamp))
    );
  }
}

export const agentLogRepository = new AgentLogRepository();
