import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cleanDatabase, createTestUser, createTestProject, testDb } from '../helpers';
import { updateMemberRoleAction, removeMemberAction } from '@/actions/members';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Mock auth and revalidatePath
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from '@/lib/auth';

describe('Team Management Server Actions', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  describe('updateMemberRoleAction', () => {
    it('prevents an Admin from escalating a user to Owner', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const admin = await createTestUser('user_admin', 'admin@example.com', 'admin');
      const member = await createTestUser('user_member', 'member@example.com', 'member');
      const project = await createTestProject('Test Project', owner.id);

      // Add admin to project
      await testDb.insert(schema.projectMembers).values({
        projectId: project.id,
        userId: admin.id,
        role: 'admin',
      });

      // Add member to project
      await testDb.insert(schema.projectMembers).values({
        projectId: project.id,
        userId: member.id,
        role: 'member',
      });

      // Mock admin session
      vi.mocked(auth).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('projectId', String(project.id));
      formData.append('userId', member.id);
      formData.append('role', 'owner');

      const result = await updateMemberRoleAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
      expect(result.error?.message).toContain('Only owners');

      // Verify role did not change
      const [updatedMember] = await testDb
        .select()
        .from(schema.projectMembers)
        .where(
          and(
            eq(schema.projectMembers.projectId, project.id),
            eq(schema.projectMembers.userId, member.id)
          )
        );
      expect(updatedMember.role).toBe('member');
    });

    it('prevents an Admin from demoting an Owner', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const admin = await createTestUser('user_admin', 'admin@example.com', 'admin');
      const project = await createTestProject('Test Project', owner.id);

      // Add admin to project
      await testDb.insert(schema.projectMembers).values({
        projectId: project.id,
        userId: admin.id,
        role: 'admin',
      });

      // Mock admin session
      vi.mocked(auth).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('projectId', String(project.id));
      formData.append('userId', owner.id);
      formData.append('role', 'member');

      const result = await updateMemberRoleAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
      expect(result.error?.message).toContain('Only owners');

      // Verify role did not change
      const [updatedOwner] = await testDb
        .select()
        .from(schema.projectMembers)
        .where(
          and(
            eq(schema.projectMembers.projectId, project.id),
            eq(schema.projectMembers.userId, owner.id)
          )
        );
      expect(updatedOwner.role).toBe('owner');
    });

    it('allows an Owner to promote an Admin to Owner', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const admin = await createTestUser('user_admin', 'admin@example.com', 'admin');
      const project = await createTestProject('Test Project', owner.id);

      // Add admin to project
      await testDb.insert(schema.projectMembers).values({
        projectId: project.id,
        userId: admin.id,
        role: 'admin',
      });

      // Mock owner session
      vi.mocked(auth).mockResolvedValue({
        user: { id: owner.id, email: owner.email, name: owner.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('projectId', String(project.id));
      formData.append('userId', admin.id);
      formData.append('role', 'owner');

      const result = await updateMemberRoleAction(formData);

      expect(result.success).toBe(true);

      // Verify role changed
      const [updatedAdmin] = await testDb
        .select()
        .from(schema.projectMembers)
        .where(
          and(
            eq(schema.projectMembers.projectId, project.id),
            eq(schema.projectMembers.userId, admin.id)
          )
        );
      expect(updatedAdmin.role).toBe('owner');
    });
  });

  describe('removeMemberAction', () => {
    it('prevents a user from removing themselves', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const project = await createTestProject('Test Project', owner.id);

      vi.mocked(auth).mockResolvedValue({
        user: { id: owner.id, email: owner.email, name: owner.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('projectId', String(project.id));
      formData.append('userId', owner.id);

      const result = await removeMemberAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('cannot remove yourself');
    });
  });
});
