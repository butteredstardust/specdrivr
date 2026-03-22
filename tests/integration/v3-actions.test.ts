import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordGitCommitAction } from '@/actions/git-commits';
import { submitTaskFileChangesAction } from '@/actions/tasks';
import { updateAgentConfigAction } from '@/actions/settings';
import { auth } from '@/lib/auth';
import { db as testDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createTestUser, createTestProject, cleanDatabase } from '../helpers';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('V3 Server Actions (Missing Entities)', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  describe('recordGitCommitAction', () => {
    it('prevents unauthenticated execution', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const formData = new FormData();
      const result = await recordGitCommitAction(formData);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('allows admins to record a commit', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const project = await createTestProject('Test Project', owner.id);

      vi.mocked(auth).mockResolvedValue({
        user: { id: owner.id, email: owner.email, name: owner.name },
        expires: '',
      } as unknown as Awaited<ReturnType<typeof auth>>);

      const formData = new FormData();
      formData.append('projectId', String(project.id));
      formData.append('commitSha', '1234567890abcdef');
      formData.append('branch', 'main');
      formData.append('message', 'Initial commit');

      const result = await recordGitCommitAction(formData);

      expect(result.success).toBe(true);

      const [commit] = await testDb
        .select()
        .from(schema.gitCommits)
        .where(eq(schema.gitCommits.projectId, project.id));
      expect(commit.commitSha).toBe('1234567890abcdef');
      expect(commit.message).toBe('Initial commit');
    });

    it('prevents non-admins from recording a commit', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const viewer = await createTestUser('user_viewer', 'viewer@example.com', 'viewer');
      const project = await createTestProject('Test Project', owner.id);

      // Add viewer to project
      await testDb.insert(schema.projectMembers).values({
        projectId: project.id,
        userId: viewer.id,
        role: 'viewer',
      });

      vi.mocked(auth).mockResolvedValue({
        user: { id: viewer.id, email: viewer.email, name: viewer.name },
        expires: '',
      } as unknown as Awaited<ReturnType<typeof auth>>);

      const formData = new FormData();
      formData.append('projectId', String(project.id));
      formData.append('commitSha', '1234567890abcdef');
      formData.append('branch', 'main');
      formData.append('message', 'Initial commit');

      const result = await recordGitCommitAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('submitTaskFileChangesAction', () => {
    it('allows admins to submit file changes payload', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const project = await createTestProject('Test Project', owner.id);

      const [spec] = await testDb
        .insert(schema.specifications)
        .values({ projectId: project.id, name: 'Spec' })
        .returning();

      const [plan] = await testDb.insert(schema.plans).values({ specId: spec.id }).returning();

      const [task] = await testDb
        .insert(schema.tasks)
        .values({ planId: plan.id, externalId: 'T-01', title: 'Task' })
        .returning();

      vi.mocked(auth).mockResolvedValue({
        user: { id: owner.id, email: owner.email, name: owner.name },
        expires: '',
      } as unknown as Awaited<ReturnType<typeof auth>>);

      const formData = new FormData();
      formData.append('taskId', String(task.id));
      formData.append(
        'changes',
        JSON.stringify([{ filePath: 'src/index.ts', changeType: 'added', diff: '+ const a = 1;' }])
      );

      const result = await submitTaskFileChangesAction(formData);
      expect(result.success).toBe(true);

      const [change] = await testDb
        .select()
        .from(schema.fileChanges)
        .where(eq(schema.fileChanges.taskId, task.id));

      expect(change.filePath).toBe('src/index.ts');
      expect(change.changeType).toBe('added');
      expect(change.diff).toBe('+ const a = 1;');
    });
  });

  describe('updateAgentConfigAction', () => {
    it('allows admins to upsert agent config securely', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const project = await createTestProject('Test Project', owner.id);

      vi.mocked(auth).mockResolvedValue({
        user: { id: owner.id, email: owner.email, name: owner.name },
        expires: '',
      } as unknown as Awaited<ReturnType<typeof auth>>);

      const formData = new FormData();
      formData.append('projectId', String(project.id));
      formData.append('modelId', 'claude-3-opus');
      formData.append('planModelId', 'claude-3-opus');
      formData.append('maxConcurrentTasks', '5');
      formData.append('taskTimeoutSeconds', '600');
      formData.append('maxRetriesPerTask', '3');
      formData.append('retryDelaySeconds', '60');
      formData.append('requireApproval', 'true');
      formData.append('autoGeneratePlan', 'true');
      formData.append('branchPrefix', 'agent');
      formData.append('commitMessagePrefix', 'fix');
      formData.append('maxDiffSizeKb', '1000');
      formData.append('prAutoCreate', 'false');
      formData.append('prTargetBranch', 'develop');
      formData.append('backend', 'claude');
      formData.append('geminiModel', 'gemini-1.5-pro');

      const result = await updateAgentConfigAction(formData);
      expect(result.success).toBe(true);

      const [config] = await testDb
        .select()
        .from(schema.agentConfig)
        .where(eq(schema.agentConfig.projectId, project.id));

      expect(config.modelId).toBe('claude-3-opus');
      expect(config.maxConcurrentTasks).toBe(5);
      expect(config.prTargetBranch).toBe('develop');
    });
  });
});
