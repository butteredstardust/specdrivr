import 'server-only';
import { eq } from 'drizzle-orm';
import { projects } from '@/db/schema';
import { BaseRepository } from './base-repository';

export class ProjectRepository extends BaseRepository {
  async findById(id: string) {
    return this.db.select().from(projects).where(eq(projects.id, parseInt(id, 10))).then(r => r[0] ?? null);
  }

  async findAll() {
    return this.db.select().from(projects);
  }

  async create(data: typeof projects.$inferInsert) {
    return this.db.insert(projects).values(data).returning().then(r => r[0]);
  }

  async update(id: string, data: Partial<typeof projects.$inferInsert>) {
    return this.db.update(projects).set(data).where(eq(projects.id, parseInt(id, 10))).returning().then(r => r[0] ?? null);
  }

  async delete(id: string) {
    return this.db.delete(projects).where(eq(projects.id, parseInt(id, 10)));
  }
}
