import { describe, it, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase, createTestUser, createTestProject } from '../helpers';
import { projectRepository } from '@/repositories/project-repository';
import { specificationRepository } from '@/repositories/specification-repository';
import { planRepository } from '@/repositories/plan-repository';
import { taskRepository } from '@/repositories/task-repository';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { planJobRepository } from '@/repositories/plan-job-repository';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('Repository Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('AgentSessionRepository.recoverGhostSessions', () => {
    it('recovers sessions with stale heartbeats', async () => {
      const user = await createTestUser('user_1', 'test@example.com');
      const project = await createTestProject('Test Project', user.id);

      const spec = await specificationRepository.createWithVersion({
        projectId: project.id,
        name: 'Auth Spec',
        markdownContent: '# Initial version',
        createdBy: user.id,
      });

      const [plan] = await testDb
        .insert(schema.plans)
        .values({
          specId: spec.id,
          status: 'executing',
          specVersionId: spec.currentVersionId,
        })
        .returning();

      // 1. Create a stale session
      const staleHeartbeat = new Date(Date.now() - 10 * 60 * 1000); // 10m ago
      const [staleSession] = await testDb
        .insert(schema.agentSessions)
        .values({
          projectId: project.id,
          planId: plan.id,
          status: 'running',
          lastHeartbeatAt: staleHeartbeat,
        })
        .returning();

      // 2. Create an in_progress task for it
      const [task] = await testDb
        .insert(schema.tasks)
        .values({
          planId: plan.id,
          specId: spec.id,
          externalId: 'T-1',
          title: 'Task 1',
          status: 'in_progress',
        })
        .returning();

      await testDb
        .update(schema.agentSessions)
        .set({ currentTaskId: task.id })
        .where(eq(schema.agentSessions.id, staleSession.id));

      // 3. Create a fresh session (should NOT be recovered)
      const freshHeartbeat = new Date();
      const [freshSession] = await testDb
        .insert(schema.agentSessions)
        .values({
          projectId: project.id,
          planId: plan.id,
          status: 'running',
          lastHeartbeatAt: freshHeartbeat,
        })
        .returning();

      // 4. Run recovery
      const recoveredCount = await agentSessionRepository.recoverGhostSessions(5); // 5m threshold
      expect(recoveredCount).toBe(1);

      // 5. Verify stale session is failed
      const [recoveredSession] = await testDb
        .select()
        .from(schema.agentSessions)
        .where(eq(schema.agentSessions.id, staleSession.id));
      expect(recoveredSession.status).toBe('failed');
      expect(recoveredSession.errorMessage).toContain('Session timed out');

      // 6. Verify fresh session is still running
      const [stillRunningSession] = await testDb
        .select()
        .from(schema.agentSessions)
        .where(eq(schema.agentSessions.id, freshSession.id));
      expect(stillRunningSession.status).toBe('running');

      // 7. Verify task is back to todo
      const [updatedTask] = await testDb
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, task.id));
      expect(updatedTask.status).toBe('todo');
    });
  });

  describe('PlanJobRepository', () => {
    it('claims pending jobs atomically', async () => {
      const user = await createTestUser('user_1', 'test@example.com');
      const project = await createTestProject('Test Project', user.id);

      await planJobRepository.create({
        projectId: project.id,
        type: 'generate_plan',
        status: 'pending',
      });

      await planJobRepository.create({
        projectId: project.id,
        type: 'generate_tasks',
        status: 'pending',
      });

      const claimed1 = await planJobRepository.claimNext();
      expect(claimed1).not.toBeNull();
      expect(claimed1?.status).toBe('running');

      const claimed2 = await planJobRepository.claimNext();
      expect(claimed2).not.toBeNull();
      expect(claimed2?.id).not.toBe(claimed1?.id);

      const claimed3 = await planJobRepository.claimNext();
      expect(claimed3).toBeNull();
    });

    it('recovers stuck jobs', async () => {
      const user = await createTestUser('user_1', 'test@example.com');
      const project = await createTestProject('Test Project', user.id);

      const staleDate = new Date(Date.now() - 20 * 60 * 1000); // 20m ago
      const [stuckJob] = await testDb
        .insert(schema.planJobs)
        .values({
          projectId: project.id,
          type: 'generate_plan',
          status: 'running',
          startedAt: staleDate,
        })
        .returning();

      const recoveredCount = await planJobRepository.recoverStuckJobs(15);
      expect(recoveredCount).toBe(1);

      const [updatedJob] = await testDb
        .select()
        .from(schema.planJobs)
        .where(eq(schema.planJobs.id, stuckJob.id));
      expect(updatedJob.status).toBe('failed');
      expect(updatedJob.error).toContain('Job timed out');
    });
  });

  describe('ProjectRepository.create', () => {
    it('creates a project with owner and default agent config', async () => {
      const user = await createTestUser('user_1', 'test@example.com');
      const project = await projectRepository.create({
        name: 'Test Project',
        description: 'Testing description',
        createdBy: user.id,
      });

      expect(project.name).toBe('Test Project');
      expect(project.createdBy).toBe(user.id);

      // Verify owner membership
      const [member] = await testDb
        .select()
        .from(schema.projectMembers)
        .where(eq(schema.projectMembers.projectId, project.id));
      expect(member.userId).toBe(user.id);
      expect(member.role).toBe('owner');

      // Verify agent config
      const [config] = await testDb
        .select()
        .from(schema.agentConfig)
        .where(eq(schema.agentConfig.projectId, project.id));
      expect(config).toBeDefined();
    });
  });

  describe('SpecificationRepository.addVersion', () => {
    it('adds a new version and abandons non-complete plans', async () => {
      const user = await createTestUser('user_1', 'test@example.com');
      const project = await createTestProject('Test Project', user.id);

      const spec = await specificationRepository.createWithVersion({
        projectId: project.id,
        name: 'Auth Spec',
        markdownContent: '# Initial version',
        createdBy: user.id,
      });

      // Create a plan that should be abandoned
      const [plan] = await testDb
        .insert(schema.plans)
        .values({
          specId: spec.id,
          status: 'pending_approval',
          markdownContent: '# Plan 1',
          specVersionId: spec.currentVersionId,
        })
        .returning();

      // Create a completed plan that should NOT be abandoned
      const [completedPlan] = await testDb
        .insert(schema.plans)
        .values({
          specId: spec.id,
          status: 'completed',
          markdownContent: '# Completed Plan',
          specVersionId: spec.currentVersionId,
        })
        .returning();

      // Add a new version
      await specificationRepository.addVersion({
        specId: spec.id,
        markdownContent: '# Updated version',
        createdBy: user.id,
      });

      // Verify plan 1 is abandoned
      const [updatedPlan1] = await testDb
        .select()
        .from(schema.plans)
        .where(eq(schema.plans.id, plan.id));
      expect(updatedPlan1.status).toBe('abandoned');

      // Verify completed plan is still completed
      const [updatedCompletedPlan] = await testDb
        .select()
        .from(schema.plans)
        .where(eq(schema.plans.id, completedPlan.id));
      expect(updatedCompletedPlan.status).toBe('completed');
    });
  });

  describe('PlanRepository.approvePlan', () => {
    it('sets plan to approved and creates an agent session', async () => {
      const user = await createTestUser('user_1', 'test@example.com');
      const project = await createTestProject('Test Project', user.id);

      const spec = await specificationRepository.createWithVersion({
        projectId: project.id,
        name: 'Auth Spec',
        markdownContent: '# Initial version',
        createdBy: user.id,
      });

      const [plan] = await testDb
        .insert(schema.plans)
        .values({
          specId: spec.id,
          status: 'pending_approval',
          markdownContent: '# Plan 1',
          specVersionId: spec.currentVersionId,
        })
        .returning();

      await planRepository.approvePlan({
        planId: plan.id,
        userId: user.id,
      });

      // Verify plan status
      const [updatedPlan] = await testDb
        .select()
        .from(schema.plans)
        .where(eq(schema.plans.id, plan.id));
      expect(updatedPlan.status).toBe('executing');

      // Verify agent session
      const [session] = await testDb
        .select()
        .from(schema.agentSessions)
        .where(eq(schema.agentSessions.planId, plan.id));
      expect(session).toBeDefined();
      expect(session.status).toBe('running');
    });
  });

  describe('TaskRepository.claimNextTaskForProject', () => {
    it('claims the next available todo task while respecting dependencies', async () => {
      const user = await createTestUser('user_1', 'test@example.com');
      const project = await createTestProject('Test Project', user.id);

      const spec = await specificationRepository.createWithVersion({
        projectId: project.id,
        name: 'Auth Spec',
        markdownContent: '# Initial version',
        createdBy: user.id,
      });

      const [plan] = await testDb
        .insert(schema.plans)
        .values({
          specId: spec.id,
          status: 'executing',
          specVersionId: spec.currentVersionId,
        })
        .returning();

      const [session] = await testDb
        .insert(schema.agentSessions)
        .values({
          projectId: project.id,
          planId: plan.id,
          status: 'running',
        })
        .returning();

      // Task 1 (no dependencies)
      await testDb.insert(schema.tasks).values({
        planId: plan.id,
        specId: spec.id,
        externalId: 'T-1',
        title: 'Task 1',
        status: 'todo',
        executionOrder: 1,
      });

      // Task 2 (depends on T-1)
      await testDb.insert(schema.tasks).values({
        planId: plan.id,
        specId: spec.id,
        externalId: 'T-2',
        title: 'Task 2',
        status: 'todo',
        dependsOn: ['T-1'],
        executionOrder: 2,
      });

      // Claim first task
      const claimed1 = await taskRepository.claimNextTaskForProject(project.id, session.id);
      expect(claimed1?.externalId).toBe('T-1');
      expect(claimed1?.status).toBe('in_progress');

      // Verify session currentTaskId was updated
      const [updatedSession] = await testDb
        .select()
        .from(schema.agentSessions)
        .where(eq(schema.agentSessions.id, session.id));
      expect(updatedSession.currentTaskId).toBe(claimed1?.id);

      // Try to claim next task (should be null because T-2 depends on T-1 which is in_progress)
      const claimed2 = await taskRepository.claimNextTaskForProject(project.id, session.id);
      expect(claimed2).toBeNull();

      // Mark T-1 as done
      await testDb
        .update(schema.tasks)
        .set({ status: 'done' })
        .where(eq(schema.tasks.externalId, 'T-1'));

      // Now claim T-2
      const claimed3 = await taskRepository.claimNextTaskForProject(project.id, session.id);
      expect(claimed3?.externalId).toBe('T-2');
    });
  });

  describe('TaskRepository.completeTaskAttempt', () => {
    it('atomically updates task, inserts attempt record, and closes session when plan is complete', async () => {
      const user = await createTestUser('user_1', 'test@example.com');
      const project = await createTestProject('Test Project', user.id);

      const spec = await specificationRepository.createWithVersion({
        projectId: project.id,
        name: 'Auth Spec',
        markdownContent: '# v1',
        createdBy: user.id,
      });

      const [plan] = await testDb
        .insert(schema.plans)
        .values({ specId: spec.id, status: 'executing', specVersionId: spec.currentVersionId })
        .returning();

      const [session] = await testDb
        .insert(schema.agentSessions)
        .values({ projectId: project.id, planId: plan.id, status: 'running' })
        .returning();

      const [task] = await testDb
        .insert(schema.tasks)
        .values({
          planId: plan.id,
          specId: spec.id,
          externalId: 'T-1',
          title: 'Complete me',
          status: 'in_progress',
          executionOrder: 1,
        })
        .returning();

      const result = await taskRepository.completeTaskAttempt(task.id, {
        status: 'done',
        output: 'All checks passed',
        exitCode: 0,
      });

      // 1. Returns the running session ID
      expect(result.sessionId).toBe(session.id);

      // 2. Task is marked done with completedAt set
      const [updatedTask] = await testDb
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, task.id));
      expect(updatedTask.status).toBe('done');
      expect(updatedTask.completedAt).not.toBeNull();

      // 3. A taskAttempt record was created with correct values
      const [attempt] = await testDb
        .select()
        .from(schema.taskAttempts)
        .where(eq(schema.taskAttempts.taskId, task.id));
      expect(attempt).toBeDefined();
      expect(attempt.status).toBe('succeeded');
      expect(attempt.sessionId).toBe(session.id);
      expect(attempt.logLines).toContain('All checks passed');

      // 4. Session was closed because all plan tasks are done
      const [updatedSession] = await testDb
        .select()
        .from(schema.agentSessions)
        .where(eq(schema.agentSessions.id, session.id));
      expect(updatedSession.status).toBe('completed');
      expect(updatedSession.endedAt).not.toBeNull();
    });

    it('marks task as failed without closing the session when other tasks remain', async () => {
      const user = await createTestUser('user_2', 'other@example.com');
      const project = await createTestProject('Other Project', user.id);

      const spec = await specificationRepository.createWithVersion({
        projectId: project.id,
        name: 'Spec B',
        markdownContent: '# v1',
        createdBy: user.id,
      });

      const [plan] = await testDb
        .insert(schema.plans)
        .values({ specId: spec.id, status: 'executing', specVersionId: spec.currentVersionId })
        .returning();

      const [session] = await testDb
        .insert(schema.agentSessions)
        .values({ projectId: project.id, planId: plan.id, status: 'running' })
        .returning();

      // Two tasks — T-A fails, T-B is still todo
      const [taskA] = await testDb
        .insert(schema.tasks)
        .values({
          planId: plan.id,
          specId: spec.id,
          externalId: 'T-A',
          title: 'Task A',
          status: 'in_progress',
          executionOrder: 1,
        })
        .returning();
      await testDb.insert(schema.tasks).values({
        planId: plan.id,
        specId: spec.id,
        externalId: 'T-B',
        title: 'Task B',
        status: 'todo',
        executionOrder: 2,
      });

      await taskRepository.completeTaskAttempt(taskA.id, {
        status: 'failed',
        errorMessage: 'oops',
      });

      const [updatedTask] = await testDb
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, taskA.id));
      expect(updatedTask.status).toBe('failed');
      expect(updatedTask.completedAt).toBeNull();

      const [attempt] = await testDb
        .select()
        .from(schema.taskAttempts)
        .where(eq(schema.taskAttempts.taskId, taskA.id));
      expect(attempt.status).toBe('failed');
      expect(attempt.errorMessage).toBe('oops');

      // Session should still be running — T-B is not done
      const [updatedSession] = await testDb
        .select()
        .from(schema.agentSessions)
        .where(eq(schema.agentSessions.id, session.id));
      expect(updatedSession.status).toBe('running');
    });
  });
});
