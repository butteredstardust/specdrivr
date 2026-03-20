#!/usr/bin/env tsx
import {
  planJobRepository,
  planRepository,
  specificationRepository,
  agentConfigRepository,
  memberRepository,
  notificationRepository,
  taskRepository,
} from '../src/repositories';
import { generatePlan, generateTasks } from '../src/lib/gemini';
import { logger } from '../src/lib/logger';
import { env } from '../src/lib/env';
import { type PlanJobSelect as PlanJob } from '../src/db/schema';

const POLL_INTERVAL_MS = 5000;

async function processJob(job: PlanJob) {
  const startMs = Date.now();
  logger.info({ jobId: job.id, type: job.type }, '🚀 Processing plan job');

  try {
    if (!job.specId) throw new Error(`Job ${job.id} is missing specId`);
    if (!job.planId) throw new Error(`Job ${job.id} is missing planId`);

    const spec = await specificationRepository.getByIdWithVersion(job.specId);
    if (!spec || !spec.currentVersion) {
      throw new Error(`Specification ${job.specId} or its current version not found`);
    }

    const config = await agentConfigRepository.getByProjectId(job.projectId);
    const apiKey = config?.geminiApiKey || env.GEMINI_API_KEY || '';

    if (!apiKey && env.NODE_ENV === 'production') {
      throw new Error('Gemini API key is missing');
    }

    if (job.type === 'generate_plan') {
      const generated = await generatePlan(
        {
          name: spec.name,
          content: spec.currentVersion.markdownContent,
        },
        {
          apiKey,
          model: config?.geminiModel,
        }
      );

      // Synthesize Markdown
      const synthesizedMarkdown = `# Phase: ${generated.phaseLabel}

## Intent
${generated.intent}

## Architecture Decisions
${generated.architectureDecisions.map((d: { title: string; rationale: string; tradeoffs: string }) => `### ${d.title}\n**Rationale**: ${d.rationale}\n\n**Trade-offs**: ${d.tradeoffs}`).join('\n\n')}

*Estimated time: ${generated.estimatedTotalMinutes} minutes*
`;

      await planRepository.update(job.planId, {
        intent: generated.intent,
        phaseLabel: generated.phaseLabel,
        architectureDecisions: generated.architectureDecisions,
        markdownContent: synthesizedMarkdown,
        totalEstimatedMinutes: generated.estimatedTotalMinutes,
        modelVersion: config?.geminiModel || env.GEMINI_MODEL || 'gemini-2.0-flash',
        generationDurationMs: Date.now() - startMs,
        status: 'pending_approval',
      });

      // Update spec status
      await specificationRepository.updateStatus(job.specId, 'pending_approval');

      // Create notifications for project admins
      const admins = await memberRepository.getAdminsByProjectId(job.projectId);
      const notifications = admins.map((adminId) => ({
        userId: adminId,
        type: 'plan_generated',
        title: 'Plan Generated',
        body: `A new execution plan has been generated for spec: ${spec.name}`,
        linkUrl: `/projects/${job.projectId}/specs/${job.specId}/plan`,
        projectId: job.projectId,
        resourceType: 'plan',
        resourceId: String(job.planId),
      }));

      await notificationRepository.createMany(notifications);
    } else if (job.type === 'generate_tasks') {
      const plan = await planRepository.getById(job.planId);
      if (!plan) throw new Error(`Plan ${job.planId} not found`);

      let generatedTasks;
      if (!apiKey && env.NODE_ENV === 'development') {
        logger.info('Using mock tasks for development');
        generatedTasks = {
          tasks: [
            {
              title: 'Initial Research',
              description: 'Research the existing implementation and plan the changes.',
              filesInvolved: [],
              dependsOnIndex: null,
              estimatedMinutes: 30,
              doneCriteria: 'Research notes completed.',
              verifyCommand: null,
              recommendedModel: 'flash',
            },
            {
              title: 'Implementation Phase 1',
              description: 'Implement the first part of the plan.',
              filesInvolved: [],
              dependsOnIndex: 0,
              estimatedMinutes: 60,
              doneCriteria: 'Code implemented and verified.',
              verifyCommand: null,
              recommendedModel: 'flash',
            },
          ],
        };
      } else {
        generatedTasks = await generateTasks(
          { name: spec.name, content: spec.currentVersion.markdownContent },
          { markdownContent: plan.markdownContent || '' },
          { apiKey, model: config?.geminiModel }
        );
      }

      // Create task records
      const taskIdMap = new Map<number, string>();

      for (let i = 0; i < generatedTasks.tasks.length; i++) {
        const t = generatedTasks.tasks[i];
        const externalId = `T-${(i + 1).toString().padStart(3, '0')}`;

        const dependsOn =
          t.dependsOnIndex !== null
            ? ([taskIdMap.get(t.dependsOnIndex)].filter(Boolean) as string[])
            : [];

        await taskRepository.create({
          planId: job.planId,
          specId: job.specId,
          externalId,
          title: t.title,
          description: t.description,
          status: 'todo',
          dependsOn,
          executionOrder: i + 1,
          estimatedMinutes: t.estimatedMinutes,
          doneCriteria: t.doneCriteria,
          verifyCommand: t.verifyCommand,
          recommendedModel: t.recommendedModel === 'pro' ? 'pro' : 'sonnet',
        });

        taskIdMap.set(i, externalId);
      }

      // Update plan task count
      await planRepository.update(job.planId, {
        taskCount: generatedTasks.tasks.length,
      });
    }

    // Mark job as completed
    await planJobRepository.update(job.id, {
      status: 'completed',
      completedAt: new Date(),
    });

    logger.info(
      { jobId: job.id, durationMs: Date.now() - startMs },
      '✅ Job completed successfully'
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error({ err: error, jobId: job.id }, '❌ Job failed');

    await planJobRepository.update(job.id, {
      status: 'failed',
      error: error.message,
      completedAt: new Date(),
    });

    // If it was a plan generation job, set spec to stalled
    if (job.type === 'generate_plan' && job.specId) {
      await specificationRepository.updateStatus(job.specId, 'stalled');
    }
  }
}

async function main() {
  logger.info('🏗️ Specdrivr Plan Worker starting...');

  while (true) {
    try {
      // 1. Recover stuck jobs
      await planJobRepository.recoverStuckJobs();

      // 2. Claim next job
      const job = await planJobRepository.claimNext();

      if (job) {
        await processJob(job);
      } else {
        // No jobs, wait
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (err) {
      logger.error({ err }, 'Worker loop error');
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS * 2));
    }
  }
}

main().catch((err) => {
  logger.error({ err }, 'Fatal worker error');
  process.exit(1);
});
