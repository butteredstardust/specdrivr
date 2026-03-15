import { db } from '@/db';
import { auditLog, type AuditLogSelect as AuditLogEntry, type AuditLogInsert } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { DatabaseError } from '@/lib/errors';

export { type AuditLogSelect as AuditLogEntry } from '@/db/schema';

export class AuditRepository extends BaseRepository {
  async create(data: Omit<AuditLogInsert, 'id' | 'createdAt'>): Promise<AuditLogEntry> {
    const [entry] = await this.executeQuery(() => db.insert(auditLog).values(data).returning());

    if (!entry) {
      throw new DatabaseError('Failed to create audit log entry');
    }

    return entry;
  }

  async getByProjectId(projectId: number, limit = 50, offset = 0): Promise<AuditLogEntry[]> {
    return await this.executeQuery(() =>
      db
        .select()
        .from(auditLog)
        .where(eq(auditLog.projectId, projectId))
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
        .offset(offset)
    );
  }
}

export const auditRepository = new AuditRepository();
