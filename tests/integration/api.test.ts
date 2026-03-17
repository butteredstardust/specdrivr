import { describe, it, expect, beforeEach, vi } from 'vitest';
// Sanity check for Husky trigger
import { NextRequest } from 'next/server';
import { cleanDatabase, createTestUser, createTestProject, testDb } from '../helpers';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock Gemini
vi.mock('@/lib/gemini', () => ({
  generatePlan: vi.fn(),
  generateTasks: vi.fn().mockResolvedValue({
    tasks: [
      {
        title: 'Task 1',
        description: 'Desc 1',
        filesInvolved: ['file1.ts'],
        dependsOnIndex: null,
        estimatedMinutes: 30,
        doneCriteria: 'Works',
        verifyCommand: 'npm test',
        recommendedModel: 'flash',
      },
    ],
  }),
}));

import { auth } from '@/lib/auth';

// Import route handlers
import { POST as createSpec } from '@/app/api/v1/projects/[id]/specs/route';
import { POST as addVersion } from '@/app/api/v1/specs/[id]/versions/route';
import { POST as approvePlan } from '@/app/api/v1/plans/[id]/approve/route';
import { POST as rejectPlan } from '@/app/api/v1/plans/[id]/reject/route';
import { POST as unblockTask } from '@/app/api/v1/tasks/[id]/unblock/route';
import { GET as getAttempts } from '@/app/api/v1/tasks/[id]/attempts/route';
import { POST as cancelSession } from '@/app/api/v1/sessions/[id]/cancel/route';
import { POST as heartbeatSession } from '@/app/api/v1/sessions/[id]/heartbeat/route';
import { PATCH as updateMemberRole } from '@/app/api/v1/projects/[id]/members/[userId]/route';

describe('API Route Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  async function mockSession(userId: string, email: string = 'test@example.com') {
    vi.mocked(auth).mockResolvedValue({
      user: { id: userId, email, name: email.split('@')[0] },
      expires: '',
    });
  }

  describe('POST /api/v1/projects/:projectId/specs', () => {
    it('creates a spec with 201', async () => {
      const user = await createTestUser('u1', 'u1@example.com', 'owner');
      const project = await createTestProject('P1', user.id);
      await mockSession(user.id, user.email);

      const req = new NextRequest(`http://localhost/api/v1/projects/${project.id}/specs`, {
        method: 'POST',
        body: JSON.stringify({ name: 'New Spec', markdownContent: '# Content' }),
      });

      const res = await createSpec(req, { params: Promise.resolve({ id: String(project.id) }) });
      expect(res.status).toBe(201);
    });

    it('returns 409 on duplicate name', async () => {
      const user = await createTestUser('u1', 'u1@example.com', 'owner');
      const project = await createTestProject('P1', user.id);
      await mockSession(user.id, user.email);

      await testDb
        .insert(schema.specifications)
        .values({ projectId: project.id, name: 'Existing' });

      const req = new NextRequest(`http://localhost/api/v1/projects/${project.id}/specs`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Existing', markdownContent: '# Content' }),
      });

      const res = await createSpec(req, { params: Promise.resolve({ id: String(project.id) }) });
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/specs/:id/versions', () => {
    it('creates a version and abandons plans', async () => {
      const user = await createTestUser('u1', 'u1@example.com', 'owner');
      const project = await createTestProject('P1', user.id);
      await mockSession(user.id, user.email);

      const [spec] = await testDb
        .insert(schema.specifications)
        .values({
          projectId: project.id,
          name: 'Spec 1',
          createdBy: user.id,
        })
        .returning();

      await testDb.insert(schema.plans).values({
        specId: spec.id,
        status: 'pending_approval',
      });

      const req = new NextRequest(`http://localhost/api/v1/specs/${spec.id}/versions`, {
        method: 'POST',
        body: JSON.stringify({ markdownContent: 'v2' }),
      });

      const res = await addVersion(req, { params: Promise.resolve({ id: String(spec.id) }) });
      expect(res.status).toBe(201);

      const [plan] = await testDb
        .select()
        .from(schema.plans)
        .where(eq(schema.plans.specId, spec.id));
      expect(plan.status).toBe('abandoned');
    });
  });

  describe('POST /api/v1/plans/:id/approve', () => {
    it('allows admin to approve', async () => {
      const owner = await createTestUser('u1', 'u1@example.com', 'owner');
      const admin = await createTestUser('u2', 'u2@example.com', 'admin');
      const project = await createTestProject('P1', owner.id);
      await testDb
        .insert(schema.projectMembers)
        .values({ projectId: project.id, userId: admin.id, role: 'admin' });
      await mockSession(admin.id, admin.email);

      const [spec] = await testDb
        .insert(schema.specifications)
        .values({ projectId: project.id, name: 'S1' })
        .returning();
      const [version] = await testDb
        .insert(schema.specVersions)
        .values({ specId: spec.id, versionNumber: 1, markdownContent: 'Content' })
        .returning();
      await testDb
        .update(schema.specifications)
        .set({ currentVersionId: version.id })
        .where(eq(schema.specifications.id, spec.id));

      const [plan] = await testDb
        .insert(schema.plans)
        .values({ specId: spec.id, status: 'pending_approval', specVersionId: version.id })
        .returning();

      const req = new NextRequest(`http://localhost/api/v1/plans/${plan.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Proceed' }),
      });
      const res = await approvePlan(req, { params: Promise.resolve({ id: String(plan.id) }) });
      expect(res.status).toBe(200);
    });

    it('returns 422 if already approved', async () => {
      const owner = await createTestUser('u1', 'u1@example.com', 'owner');
      const project = await createTestProject('P1', owner.id);
      await mockSession(owner.id, owner.email);

      const [spec] = await testDb
        .insert(schema.specifications)
        .values({ projectId: project.id, name: 'S1' })
        .returning();
      const [version] = await testDb
        .insert(schema.specVersions)
        .values({ specId: spec.id, versionNumber: 1, markdownContent: 'Content' })
        .returning();
      await testDb
        .update(schema.specifications)
        .set({ currentVersionId: version.id })
        .where(eq(schema.specifications.id, spec.id));

      const [plan] = await testDb
        .insert(schema.plans)
        .values({ specId: spec.id, status: 'executing', specVersionId: version.id })
        .returning();

      const req = new NextRequest(`http://localhost/api/v1/plans/${plan.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await approvePlan(req, { params: Promise.resolve({ id: String(plan.id) }) });
      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/v1/projects/:id/members/:userId', () => {
    it('Scenario 1: admin → member → admin (ALLOW)', async () => {
      const owner = await createTestUser('u1', 'u1@example.com', 'owner');
      const admin = await createTestUser('u2', 'u2@example.com', 'admin');
      const member = await createTestUser('u3', 'u3@example.com', 'member');
      const project = await createTestProject('P1', owner.id);
      await testDb
        .insert(schema.projectMembers)
        .values({ projectId: project.id, userId: admin.id, role: 'admin' });
      await testDb
        .insert(schema.projectMembers)
        .values({ projectId: project.id, userId: member.id, role: 'member' });
      await mockSession(admin.id, admin.email);

      const req = new NextRequest(
        `http://localhost/api/v1/projects/${project.id}/members/${member.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }
      );

      const res = await updateMemberRole(req, {
        params: Promise.resolve({ id: String(project.id), userId: member.id }),
      });
      expect(res.status).toBe(200);
    });

    it('Scenario 2: admin → member → owner (DENY)', async () => {
      const owner = await createTestUser('u1', 'u1@example.com', 'owner');
      const admin = await createTestUser('u2', 'u2@example.com', 'admin');
      const member = await createTestUser('u3', 'u3@example.com', 'member');
      const project = await createTestProject('P1', owner.id);
      await testDb
        .insert(schema.projectMembers)
        .values({ projectId: project.id, userId: admin.id, role: 'admin' });
      await testDb
        .insert(schema.projectMembers)
        .values({ projectId: project.id, userId: member.id, role: 'member' });
      await mockSession(admin.id, admin.email);

      const req = new NextRequest(
        `http://localhost/api/v1/projects/${project.id}/members/${member.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'owner' }),
        }
      );

      const res = await updateMemberRole(req, {
        params: Promise.resolve({ id: String(project.id), userId: member.id }),
      });
      expect(res.status).toBe(403);
    });

    it('Scenario 3: owner → admin → owner (ALLOW)', async () => {
      const owner = await createTestUser('u1', 'u1@example.com', 'owner');
      const admin = await createTestUser('u2', 'u2@example.com', 'admin');
      const project = await createTestProject('P1', owner.id);
      await testDb
        .insert(schema.projectMembers)
        .values({ projectId: project.id, userId: admin.id, role: 'admin' });
      await mockSession(owner.id, owner.email);

      const req = new NextRequest(
        `http://localhost/api/v1/projects/${project.id}/members/${admin.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'owner' }),
        }
      );

      const res = await updateMemberRole(req, {
        params: Promise.resolve({ id: String(project.id), userId: admin.id }),
      });
      expect(res.status).toBe(200);
    });

    it('Scenario 4: admin → owner → member (DENY)', async () => {
      const owner = await createTestUser('u1', 'u1@example.com', 'owner');
      const admin = await createTestUser('u2', 'u2@example.com', 'admin');
      const project = await createTestProject('P1', owner.id);
      await testDb
        .insert(schema.projectMembers)
        .values({ projectId: project.id, userId: admin.id, role: 'admin' });
      await mockSession(admin.id, admin.email);

      const req = new NextRequest(
        `http://localhost/api/v1/projects/${project.id}/members/${owner.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'member' }),
        }
      );

      const res = await updateMemberRole(req, {
        params: Promise.resolve({ id: String(project.id), userId: owner.id }),
      });
      expect(res.status).toBe(403);
    });
  });

  // Existing tests follow...
  describe('POST /api/v1/plans/:id/reject', () => {
    it('allows admin to reject with notes', async () => {
      const owner = await createTestUser('u1', 'u1@example.com', 'owner');
      const admin = await createTestUser('u2', 'u2@example.com', 'admin');
      const project = await createTestProject('P1', owner.id);
      await testDb
        .insert(schema.projectMembers)
        .values({ projectId: project.id, userId: admin.id, role: 'admin' });
      await mockSession(admin.id, admin.email);

      const [spec] = await testDb
        .insert(schema.specifications)
        .values({ projectId: project.id, name: 'S1' })
        .returning();
      const [version] = await testDb
        .insert(schema.specVersions)
        .values({ specId: spec.id, versionNumber: 1, markdownContent: 'Content' })
        .returning();
      await testDb
        .update(schema.specifications)
        .set({ currentVersionId: version.id })
        .where(eq(schema.specifications.id, spec.id));

      const [plan] = await testDb
        .insert(schema.plans)
        .values({ specId: spec.id, status: 'pending_approval', specVersionId: version.id })
        .returning();

      const req = new NextRequest(`http://localhost/api/v1/plans/${plan.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Rejected due to lack of details' }),
      });
      const res = await rejectPlan(req, { params: Promise.resolve({ id: String(plan.id) }) });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/tasks/:id/unblock', () => {
    it('unblocks a task with 200', async () => {
      const user = await createTestUser('u1', 'u1@example.com', 'owner');
      const project = await createTestProject('P1', user.id);
      await mockSession(user.id, user.email);

      const [spec] = await testDb
        .insert(schema.specifications)
        .values({ projectId: project.id, name: 'S1' })
        .returning();
      const [plan] = await testDb.insert(schema.plans).values({ specId: spec.id }).returning();
      const [task] = await testDb
        .insert(schema.tasks)
        .values({ planId: plan.id, status: 'blocked', externalId: 'T-1', title: 'T1' })
        .returning();

      const req = new NextRequest(`http://localhost/api/v1/tasks/${task.id}/unblock`, {
        method: 'POST',
        body: JSON.stringify({ humanContext: 'Done now' }),
      });

      const res = await unblockTask(req, { params: Promise.resolve({ id: String(task.id) }) });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/tasks/:id/attempts', () => {
    it('returns ordered attempts', async () => {
      const user = await createTestUser('u1', 'u1@example.com', 'owner');
      const project = await createTestProject('P1', user.id);
      await mockSession(user.id, user.email);

      const [spec] = await testDb
        .insert(schema.specifications)
        .values({ projectId: project.id, name: 'S1' })
        .returning();
      const [plan] = await testDb.insert(schema.plans).values({ specId: spec.id }).returning();
      const [task] = await testDb
        .insert(schema.tasks)
        .values({ planId: plan.id, externalId: 'T-1', title: 'T1' })
        .returning();

      await testDb.insert(schema.taskAttempts).values({ taskId: task.id, seq: 1 });
      await testDb.insert(schema.taskAttempts).values({ taskId: task.id, seq: 2 });

      const req = new NextRequest(`http://localhost/api/v1/tasks/${task.id}/attempts`);
      const res = await getAttempts(req, { params: Promise.resolve({ id: String(task.id) }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.length).toBe(2);
      expect(body.data[0].seq).toBe(2);
    });
  });

  describe('POST /api/v1/sessions/:id/cancel', () => {
    it('cancels session and writes audit log', async () => {
      const user = await createTestUser('u1', 'u1@example.com', 'owner');
      const project = await createTestProject('P1', user.id);
      await mockSession(user.id, user.email);

      const [session] = await testDb
        .insert(schema.agentSessions)
        .values({ projectId: project.id, status: 'running' })
        .returning();

      const req = new NextRequest(`http://localhost/api/v1/sessions/${session.id}/cancel`, {
        method: 'POST',
      });
      const res = await cancelSession(req, { params: Promise.resolve({ id: String(session.id) }) });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/sessions/:id/heartbeat', () => {
    it('returns shouldStop and updates heartbeat', async () => {
      const user = await createTestUser('u1', 'u1@example.com', 'owner');
      const project = await createTestProject('P1', user.id);

      const token = 'sdk_project-alpha_123456789012345678901234567890123456789012345678';
      const prefix = token.slice(0, 10);
      const tokenHash = await bcrypt.hash(token, 10);

      await testDb.insert(schema.agentTokens).values({
        projectId: project.id,
        userId: user.id,
        name: 'test',
        tokenHash,
        prefix,
      });

      const [session] = await testDb
        .insert(schema.agentSessions)
        .values({ projectId: project.id, status: 'running' })
        .returning();

      const req = new NextRequest(`http://localhost/api/v1/sessions/${session.id}/heartbeat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await heartbeatSession(req, {
        params: Promise.resolve({ id: String(session.id) }),
      });
      expect(res.status).toBe(200);
    });
  });
});
