import { db } from '@/db';
import { projectMembers, invites, users, auditLog, type UserRole } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, DatabaseError } from '@/lib/errors';

export class MemberRepository extends BaseRepository {
  async getByProjectId(projectId: number, limit = 50, offset = 0) {
    return await this.executeQuery(() =>
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          role: projectMembers.role,
          joinedAt: projectMembers.joinedAt,
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, projectId))
        .limit(limit)
        .offset(offset)
    );
  }

  async updateRole(projectId: number, userId: string, role: UserRole, actorId: string) {
    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(projectMembers)
          .set({ role })
          .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
          .returning();

        if (!updated) throw new NotFoundError('Member not found');

        await tx.insert(auditLog).values({
          projectId,
          userId: actorId,
          action: 'update_member_role',
          targetType: 'user',
          targetId: userId,
          detail: { role },
        });

        return updated;
      });
    });
  }

  async remove(projectId: number, userId: string, actorId: string) {
    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        // Prevent removing the last owner
        const owners = await tx
          .select()
          .from(projectMembers)
          .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, 'owner')));

        const memberToRemove = await tx
          .select()
          .from(projectMembers)
          .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
          .limit(1);

        if (memberToRemove[0]?.role === 'owner' && owners.length <= 1) {
          throw new DatabaseError('Cannot remove the last project owner');
        }

        await tx
          .delete(projectMembers)
          .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));

        await tx.insert(auditLog).values({
          projectId,
          userId: actorId,
          action: 'remove_member',
          targetType: 'user',
          targetId: userId,
        });
      });
    });
  }

  async createInvite(data: {
    projectId: number;
    email: string;
    role: UserRole;
    invitedBy: string;
  }) {
    return await this.executeQuery(async () => {
      return await db.transaction(async (tx) => {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const [invite] = await tx
          .insert(invites)
          .values({
            projectId: data.projectId,
            email: data.email,
            role: data.role,
            invitedBy: data.invitedBy,
            token,
            expiresAt,
          })
          .returning();

        await tx.insert(auditLog).values({
          projectId: data.projectId,
          userId: data.invitedBy,
          action: 'create_invite',
          targetType: 'invite',
          targetId: String(invite.id),
          detail: { email: data.email, role: data.role },
        });

        return invite;
      });
    });
  }
}

export const memberRepository = new MemberRepository();
