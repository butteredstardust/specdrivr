import { db } from '@/db';
import {
  invites,
  projects,
  users,
  projectMembers,
  type InviteSelect as Invite,
  type UserRole,
} from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { BaseRepository } from './base-repository';

export { type InviteSelect as Invite } from '@/db/schema';

export class InviteRepository extends BaseRepository {
  async getByToken(token: string): Promise<Invite | null> {
    const result = await this.executeQuery(() =>
      db
        .select()
        .from(invites)
        .where(and(eq(invites.token, token), gt(invites.expiresAt, new Date())))
        .limit(1)
    );

    return result[0] || null;
  }

  async getByTokenWithProject(token: string) {
    const result = await this.executeQuery(() =>
      db
        .select({
          id: invites.id,
          email: invites.email,
          projectId: invites.projectId,
          projectName: projects.name,
          role: invites.role,
          token: invites.token,
          invitedBy: invites.invitedBy,
          expiresAt: invites.expiresAt,
        })
        .from(invites)
        .innerJoin(projects, eq(invites.projectId, projects.id))
        .where(and(eq(invites.token, token), gt(invites.expiresAt, new Date())))
        .limit(1)
    );

    return result[0] || null;
  }

  async accept(inviteId: number, userId: string, projectId: number, role: UserRole): Promise<void> {
    await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        await tx.insert(projectMembers).values({ projectId, userId, role }).onConflictDoNothing();

        await tx.delete(invites).where(eq(invites.id, inviteId));
      });
    });
  }

  async invalidate(inviteId: number): Promise<void> {
    await this.executeQuery(() => db.delete(invites).where(eq(invites.id, inviteId)));
  }

  async checkUserExists(email: string): Promise<{ id: string } | null> {
    const result = await this.executeQuery(() =>
      db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    );

    return result[0] || null;
  }
}

export const inviteRepository = new InviteRepository();
