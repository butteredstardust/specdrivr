import 'server-only';
import { eq } from 'drizzle-orm';
import { tasks } from '@/db/schema';
import { BaseRepository } from './base-repository';

export class TaskRepository extends BaseRepository {
  async findById(id: string) {
    return this.db.select().from(tasks).where(eq(tasks.id, parseInt(id, 10))).then(r => r[0] ?? null);
  }

  // specId removed from tasks in schema
  async findBySpecId(specId: string) {
    return [];
  }

  async update(id: string, data: Partial<typeof tasks.$inferInsert>) {
    return this.db.update(tasks).set(data).where(eq(tasks.id, parseInt(id, 10))).returning().then(r => r[0] ?? null);
  }
}
