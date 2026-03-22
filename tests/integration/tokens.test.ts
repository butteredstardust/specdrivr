import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cleanDatabase, createTestUser, createTestProject, testDb } from '../helpers';
import { createAgentTokenAction, revokeAgentTokenAction } from '@/actions/tokens';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

// Mock auth and revalidatePath
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from '@/lib/auth';

describe('Agent Tokens Server Actions', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  describe('createAgentTokenAction', () => {
    it('allows an Admin to create a token', async () => {
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
      formData.append('name', 'My Test Token');

      const result = await createAgentTokenAction(formData);

      expect(result.success).toBe(true);
      expect(result.plaintextToken).toBeDefined();
      expect(result.data).toBeDefined();

      const tokens = await testDb
        .select()
        .from(schema.agentTokens)
        .where(eq(schema.agentTokens.projectId, project.id));
      expect(tokens.length).toBe(1);
      expect(tokens[0].name).toBe('My Test Token');
      expect(tokens[0].userId).toBe(admin.id);
    });

    it('prevents a Viewer from creating a token', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const viewer = await createTestUser('user_viewer', 'viewer@example.com', 'viewer');
      const project = await createTestProject('Test Project', owner.id);

      // Add viewer to project
      await testDb.insert(schema.projectMembers).values({
        projectId: project.id,
        userId: viewer.id,
        role: 'viewer',
      });

      // Mock viewer session
      vi.mocked(auth).mockResolvedValue({
        user: { id: viewer.id, email: viewer.email, name: viewer.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('projectId', String(project.id));
      formData.append('name', 'Secret Token');

      const result = await createAgentTokenAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
      expect(result.error?.message).toContain('must be a project admin');

      const tokens = await testDb
        .select()
        .from(schema.agentTokens)
        .where(eq(schema.agentTokens.projectId, project.id));
      expect(tokens.length).toBe(0);
    });
  });

  describe('revokeAgentTokenAction', () => {
    it('allows a user to revoke their own token', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const project = await createTestProject('Test Project', owner.id);

      const [token] = await testDb
        .insert(schema.agentTokens)
        .values({
          projectId: project.id,
          userId: owner.id,
          name: 'My Token to Revoke',
          prefix: 'prefix_',
          tokenHash: 'hashed_value',
        })
        .returning();

      // Mock session
      vi.mocked(auth).mockResolvedValue({
        user: { id: owner.id, email: owner.email, name: owner.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('id', String(token.id));

      const result = await revokeAgentTokenAction(formData);

      expect(result.success).toBe(true);

      const [updatedToken] = await testDb
        .select()
        .from(schema.agentTokens)
        .where(eq(schema.agentTokens.id, token.id));
      expect(updatedToken.revokedAt).not.toBeNull();
    });

    it('prevents a user from revoking someone else token', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const hacker = await createTestUser('user_hacker', 'hacker@example.com', 'member');
      const project = await createTestProject('Test Project', owner.id);

      const [token] = await testDb
        .insert(schema.agentTokens)
        .values({
          projectId: project.id,
          userId: owner.id,
          name: 'Owner Token',
          prefix: 'prefix_',
          tokenHash: 'hashed_value',
        })
        .returning();

      // Mock hacker session
      vi.mocked(auth).mockResolvedValue({
        user: { id: hacker.id, email: hacker.email, name: hacker.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('id', String(token.id));

      const result = await revokeAgentTokenAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');

      const [updatedToken] = await testDb
        .select()
        .from(schema.agentTokens)
        .where(eq(schema.agentTokens.id, token.id));
      expect(updatedToken.revokedAt).toBeNull();
    });
  });
});
