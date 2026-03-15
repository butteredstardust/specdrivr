import { db } from '@/db';
import { auditLog, type AuditLogSelect as AuditLogEntry, type AuditLogInsert } from '@/db/schema';
import { eq, desc, sql, ilike, or, and, gte, lte } from 'drizzle-orm';
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

  async getFilteredByProjectId(
    projectId: number,
    filters: {
      search?: string;
      actor?: string;
      action?: string;
      from?: string;
      to?: string;
    },
    limit = 50,
    offset = 0
  ): Promise<AuditLogEntry[]> {
    const conditions = [eq(auditLog.projectId, projectId)];

    if (filters.search) {
      conditions.push(
        or(
          ilike(auditLog.action, `%${filters.search}%`),
          ilike(auditLog.targetType, `%${filters.search}%`)
        )!
      );
    }

    if (filters.actor) {
      conditions.push(eq(auditLog.userId, filters.actor));
    }

    if (filters.action) {
      conditions.push(eq(auditLog.action, filters.action));
    }

    if (filters.from) {
      conditions.push(gte(auditLog.createdAt, new Date(filters.from)));
    }

    if (filters.to) {
      conditions.push(lte(auditLog.createdAt, new Date(filters.to)));
    }

    return await this.executeQuery(() =>
      db
        .select()
        .from(auditLog)
        .where(and(...conditions))
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
        .offset(offset)
    );
  }

  async countByProjectId(projectId: number): Promise<number> {
    const result = await this.executeQuery(() =>
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLog)
        .where(eq(auditLog.projectId, projectId))
    );
    return result[0]?.count ?? 0;
  }

  async countFilteredByProjectId(
    projectId: number,
    filters: {
      search?: string;
      actor?: string;
      action?: string;
      from?: string;
      to?: string;
    }
  ): Promise<number> {
    const conditions = [eq(auditLog.projectId, projectId)];

    if (filters.search) {
      conditions.push(
        or(
          ilike(auditLog.action, `%${filters.search}%`),
          ilike(auditLog.targetType, `%${filters.search}%`)
        )!
      );
    }

    if (filters.actor) {
      conditions.push(eq(auditLog.userId, filters.actor));
    }

    if (filters.action) {
      conditions.push(eq(auditLog.action, filters.action));
    }

    if (filters.from) {
      conditions.push(gte(auditLog.createdAt, new Date(filters.from)));
    }

    if (filters.to) {
      conditions.push(lte(auditLog.createdAt, new Date(filters.to)));
    }

    const result = await this.executeQuery(() =>
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLog)
        .where(and(...conditions))
    );
    return result[0]?.count ?? 0;
  }
}

export const auditRepository = new AuditRepository();
