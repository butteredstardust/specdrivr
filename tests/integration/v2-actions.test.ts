import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cleanDatabase, createTestUser, createTestProject, testDb } from '../helpers';
import { terminateAgentSessionAction } from '@/actions/agents';
import { uploadTestResultsAction } from '@/actions/tests';
import { retryPlanJobAction, cancelPlanJobAction } from '@/actions/plans';
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

describe('V2 Observability & Orchestration Actions', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  describe('terminateAgentSessionAction', () => {
    it('allows project admin to terminate an agent session', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const project = await createTestProject('Test Project', owner.id);

      const [session] = await testDb
        .insert(schema.agentSessions)
        .values({
          projectId: project.id,
          status: 'running',
        })
        .returning();

      vi.mocked(auth).mockResolvedValue({
        user: { id: owner.id, email: owner.email, name: owner.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('sessionId', String(session.id));

      const result = await terminateAgentSessionAction(formData);

      expect(result.success).toBe(true);

      const [updatedSession] = await testDb
        .select()
        .from(schema.agentSessions)
        .where(eq(schema.agentSessions.id, session.id));

      expect(updatedSession.status).toBe('cancelled');
    });

    it('prevents non-admins from terminating sessions', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const viewer = await createTestUser('user_viewer', 'viewer@example.com', 'viewer');
      const project = await createTestProject('Test Project', owner.id);

      // Add viewer to project
      await testDb.insert(schema.projectMembers).values({
        projectId: project.id,
        userId: viewer.id,
        role: 'viewer',
      });

      const [session] = await testDb
        .insert(schema.agentSessions)
        .values({
          projectId: project.id,
          status: 'running',
        })
        .returning();

      vi.mocked(auth).mockResolvedValue({
        user: { id: viewer.id, email: viewer.email, name: viewer.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('sessionId', String(session.id));

      const result = await terminateAgentSessionAction(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('retryPlanJobAction & cancelPlanJobAction', () => {
    it('allows admins to retry a failed plan job', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const project = await createTestProject('Test Project', owner.id);

      const [job] = await testDb
        .insert(schema.planJobs)
        .values({
          projectId: project.id,
          status: 'failed',
          type: 'generate_plan',
          error: 'Generation failed',
        })
        .returning();

      vi.mocked(auth).mockResolvedValue({
        user: { id: owner.id, email: owner.email, name: owner.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('jobId', String(job.id));

      const result = await retryPlanJobAction(formData);

      expect(result.success).toBe(true);

      const [updatedJob] = await testDb
        .select()
        .from(schema.planJobs)
        .where(eq(schema.planJobs.id, job.id));

      expect(updatedJob.status).toBe('pending');
      expect(updatedJob.error).toBeNull();
    });

    it('allows admins to cancel a running job', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const project = await createTestProject('Test Project', owner.id);

      const [job] = await testDb
        .insert(schema.planJobs)
        .values({
          projectId: project.id,
          status: 'running',
          type: 'generate_plan',
        })
        .returning();

      vi.mocked(auth).mockResolvedValue({
        user: { id: owner.id, email: owner.email, name: owner.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('jobId', String(job.id));

      const result = await cancelPlanJobAction(formData);

      expect(result.success).toBe(true);

      const [updatedJob] = await testDb
        .select()
        .from(schema.planJobs)
        .where(eq(schema.planJobs.id, job.id));

      expect(updatedJob.status).toBe('failed');
      expect(updatedJob.error).toBe('Cancelled by user');
    });
  });

  describe('uploadTestResultsAction', () => {
    it('allows admins to upload test results for a task', async () => {
      const owner = await createTestUser('user_owner', 'owner@example.com', 'owner');
      const project = await createTestProject('Test Project', owner.id);

      const [spec] = await testDb
        .insert(schema.specifications)
        .values({
          projectId: project.id,
          name: 'Test Spec',
        })
        .returning();

      const [plan] = await testDb
        .insert(schema.plans)
        .values({
          specId: spec.id,
        })
        .returning();

      const [task] = await testDb
        .insert(schema.tasks)
        .values({
          planId: plan.id,
          externalId: 'T-101',
          title: 'Test Component',
        })
        .returning();

      vi.mocked(auth).mockResolvedValue({
        user: { id: owner.id, email: owner.email, name: owner.name },
        expires: '',
      });

      const formData = new FormData();
      formData.append('taskId', String(task.id));
      formData.append('success', 'true');
      formData.append('logs', 'All tests passed');

      const result = await uploadTestResultsAction(formData);

      expect(result.success).toBe(true);

      const [testResult] = await testDb
        .select()
        .from(schema.testResults)
        .where(eq(schema.testResults.taskId, task.id));

      expect(testResult.success).toBe(true);
      expect(testResult.logs).toBe('All tests passed');
    });
  });
});
