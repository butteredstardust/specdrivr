import { describe, it, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase, createTestUser, createTestProject } from '../helpers';
import { projectRepository } from '@/repositories/project-repository';
import { specificationRepository } from '@/repositories/specification-repository';
import { planRepository } from '@/repositories/plan-repository';
import { taskRepository } from '@/repositories/task-repository';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('Repository Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
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
      const [member] = await testDb.select().from(schema.projectMembers).where(eq(schema.projectMembers.projectId, project.id));
      expect(member.userId).toBe(user.id);
      expect(member.role).toBe('owner');

      // Verify agent config
      const [config] = await testDb.select().from(schema.agentConfig).where(eq(schema.agentConfig.projectId, project.id));
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
      const [plan] = await testDb.insert(schema.plans).values({
        specId: spec.id,
        status: 'pending_approval',
        markdownContent: '# Plan 1',
        specVersionId: spec.currentVersionId,
      }).returning();

      // Create a completed plan that should NOT be abandoned
      const [completedPlan] = await testDb.insert(schema.plans).values({
        specId: spec.id,
        status: 'completed',
        markdownContent: '# Completed Plan',
        specVersionId: spec.currentVersionId,
      }).returning();

      // Add a new version
      await specificationRepository.addVersion({
        specId: spec.id,
        markdownContent: '# Updated version',
        createdBy: user.id,
      });

      // Verify plan 1 is abandoned
      const [updatedPlan1] = await testDb.select().from(schema.plans).where(eq(schema.plans.id, plan.id));
      expect(updatedPlan1.status).toBe('abandoned');

      // Verify completed plan is still completed
      const [updatedCompletedPlan] = await testDb.select().from(schema.plans).where(eq(schema.plans.id, completedPlan.id));
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

      const [plan] = await testDb.insert(schema.plans).values({
        specId: spec.id,
        status: 'pending_approval',
        markdownContent: '# Plan 1',
        specVersionId: spec.currentVersionId,
      }).returning();

      await planRepository.approvePlan({
        planId: plan.id,
        userId: user.id,
      });

      // Verify plan status
      const [updatedPlan] = await testDb.select().from(schema.plans).where(eq(schema.plans.id, plan.id));
      expect(updatedPlan.status).toBe('executing');

      // Verify agent session
      const [session] = await testDb.select().from(schema.agentSessions).where(eq(schema.agentSessions.planId, plan.id));
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

      const [plan] = await testDb.insert(schema.plans).values({
        specId: spec.id,
        status: 'executing',
        specVersionId: spec.currentVersionId,
      }).returning();

      await testDb.insert(schema.agentSessions).values({
        projectId: project.id,
        planId: plan.id,
        status: 'running',
      });

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
      const claimed1 = await taskRepository.claimNextTaskForProject(project.id);
      expect(claimed1?.externalId).toBe('T-1');
      expect(claimed1?.status).toBe('in_progress');

      // Try to claim next task (should be null because T-2 depends on T-1 which is in_progress)
      const claimed2 = await taskRepository.claimNextTaskForProject(project.id);
      expect(claimed2).toBeNull();

      // Mark T-1 as done
      await testDb.update(schema.tasks).set({ status: 'done' }).where(eq(schema.tasks.externalId, 'T-1'));

      // Now claim T-2
      const claimed3 = await taskRepository.claimNextTaskForProject(project.id);
      expect(claimed3?.externalId).toBe('T-2');
    });
  });
});
