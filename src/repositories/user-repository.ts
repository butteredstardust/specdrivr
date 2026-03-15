import { db } from '@/db';
import { users, type UserSelect as User, type UserInsert } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { DatabaseError } from '@/lib/errors';

export { type UserSelect as User } from '@/db/schema';

export class UserRepository extends BaseRepository {
  async getById(id: string): Promise<User | null> {
    const result = await this.executeQuery(() =>
      db.select().from(users).where(eq(users.id, id)).limit(1)
    );
    return result[0] || null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const result = await this.executeQuery(() =>
      db.select().from(users).where(eq(users.email, email)).limit(1)
    );
    return result[0] || null;
  }

  async create(data: UserInsert): Promise<User> {
    const user = await this.executeQuery(async () => {
      const [newUser] = await db.insert(users).values(data).returning();
      return newUser;
    });

    if (!user) {
      throw new DatabaseError('Failed to create user');
    }

    return user;
  }

  async update(id: string, data: Partial<UserInsert>): Promise<User> {
    const updatedUser = await this.executeQuery(async () => {
      const [user] = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return user;
    });

    if (!updatedUser) {
      throw new DatabaseError('Failed to update user');
    }

    return updatedUser;
  }

  async updateOnboardingStep(userId: string, step: number): Promise<void> {
    await this.executeQuery(() =>
      db
        .update(users)
        .set({ onboardingStep: step, updatedAt: new Date() })
        .where(eq(users.id, userId))
    );
  }

  async delete(id: string): Promise<void> {
    await this.executeQuery(() => db.delete(users).where(eq(users.id, id)));
  }
}

export const userRepository = new UserRepository();
