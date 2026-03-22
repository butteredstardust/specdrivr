import { db } from '@/db';
import { agentLogs, type AgentLogInsert, type AgentLogSelect } from '@/db/schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';
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

  async queryLogs(options: {
    sessionId?: number;
    taskId?: number;
    level?: string;
    limit?: number;
    offset?: number;
  }): Promise<AgentLogSelect[]> {
    return this.executeQuery(() => {
      const conditions: SQL[] = [];
      if (options.sessionId) conditions.push(eq(agentLogs.sessionId, options.sessionId));
      if (options.taskId) conditions.push(eq(agentLogs.taskId, options.taskId));
      if (options.level)
        conditions.push(eq(agentLogs.level, options.level as 'debug' | 'info' | 'warn' | 'error'));

      const q = db.select().from(agentLogs);

      return q
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(agentLogs.timestamp))
        .limit(options.limit || 100)
        .offset(options.offset || 0);
    });
  }
}

export const agentLogRepository = new AgentLogRepository();
