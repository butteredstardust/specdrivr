#!/usr/bin/env tsx
import {
  planJobRepository,
  planRepository,
  specificationRepository,
  agentConfigRepository,
  memberRepository,
  notificationRepository,
} from '../src/repositories';
import { generatePlan, generateTasks } from '../src/lib/gemini';
import { logger } from '../src/lib/logger';
import { env } from '../src/lib/env';
import {
  type PlanJobSelect as PlanJob,
  agentEvents,
  agentSessions,
  planJobs,
  plans,
  specifications,
  tasks,
} from '../src/db/schema';
import { db } from '../src/db';
import { eq, desc, and } from 'drizzle-orm';

const POLL_INTERVAL_MS = 5000;
const JOB_HEARTBEAT_INTERVAL_MS = 60_000;

class StalePlanJobError extends Error {}

async function logEvent(
  job: PlanJob,
  eventType: string,
  message: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    // Attempt to find session for the plan
    if (!job.planId) return;

    const [session] = await db
      .select({ id: agentSessions.id })
      .from(agentSessions)
      .where(eq(agentSessions.planId, job.planId))
      .orderBy(desc(agentSessions.startedAt))
      .limit(1);

    if (session) {
      await db.insert(agentEvents).values({
        sessionId: session.id,
        specId: job.specId,
        eventType,
        message,
        metadata: { ...metadata, jobId: job.id, jobType: job.type },
      });
    }
  } catch (err) {
    logger.warn({ err, jobId: job.id }, 'Failed to log background job event to agent_events');
  }
}

async function processJob(job: PlanJob) {
  const startMs = Date.now();
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  logger.info(
    { correlationId: job.generationToken, jobId: job.id, type: job.type },
    '🚀 Processing plan job'
  );

  // Log job start
  await logEvent(
    job,
    'JOB_STARTED',
    job.type === 'generate_plan' ? 'Generating execution plan...' : 'Architecting tasks...'
  );

  try {
    if (!job.specId) throw new Error(`Job ${job.id} is missing specId`);
    if (!job.planId) throw new Error(`Job ${job.id} is missing planId`);

    if (!job.specVersionId || !job.generationToken) {
      throw new StalePlanJobError(`Job ${job.id} is not bound to a specification version`);
    }
    heartbeatTimer = setInterval(() => {
      void planJobRepository
        .heartbeat(job.id, job.generationToken!)
        .then((isAlive) => {
          if (!isAlive) {
            logger.warn({ jobId: job.id }, 'Plan job heartbeat rejected for inactive lease');
          }
        })
        .catch((err: unknown) => {
          logger.warn({ err, jobId: job.id }, 'Failed to heartbeat plan job');
        });
    }, JOB_HEARTBEAT_INTERVAL_MS);
    heartbeatTimer.unref();
    const spec = await specificationRepository.getById(job.specId);
    const targetVersion = await specificationRepository.getVersionById(
      job.specId,
      job.specVersionId
    );
    if (!spec || !targetVersion)
      throw new StalePlanJobError('Target specification version is gone');

    const config = await agentConfigRepository.getByProjectId(job.projectId);
    const apiKey = config?.geminiApiKey || env.GEMINI_API_KEY || '';

    if (!apiKey && env.NODE_ENV === 'production') {
      throw new Error('Gemini API key is missing');
    }

    if (job.type === 'generate_plan') {
      const generated = await generatePlan(
        {
          name: spec.name,
          content: targetVersion.markdownContent,
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

      await db.transaction(async (tx) => {
        const [currentJob] = await tx
          .select()
          .from(planJobs)
          .where(eq(planJobs.id, job.id))
          .limit(1)
          .for('update');
        const [currentSpec] = await tx
          .select({
            currentVersionId: specifications.currentVersionId,
            status: specifications.status,
          })
          .from(specifications)
          .where(eq(specifications.id, job.specId!))
          .limit(1);
        const [currentPlan] = await tx
          .select({ status: plans.status, specVersionId: plans.specVersionId })
          .from(plans)
          .where(eq(plans.id, job.planId!))
          .limit(1);

        if (
          currentJob?.status !== 'running' ||
          currentJob.generationToken !== job.generationToken ||
          currentSpec?.currentVersionId !== job.specVersionId ||
          currentSpec.status !== 'pending_plan' ||
          currentPlan?.specVersionId !== job.specVersionId ||
          currentPlan.status !== 'pending_approval'
        ) {
          throw new StalePlanJobError('Plan generation result was superseded');
        }

        await tx
          .update(plans)
          .set({
            intent: generated.intent,
            phaseLabel: generated.phaseLabel,
            architectureDecisions: generated.architectureDecisions,
            markdownContent: synthesizedMarkdown,
            totalEstimatedMinutes: generated.estimatedTotalMinutes,
            modelVersion: config?.geminiModel || env.GEMINI_MODEL || 'gemini-2.0-flash',
            generationDurationMs: Date.now() - startMs,
            status: 'pending_approval',
          })
          .where(eq(plans.id, job.planId!));
        await tx
          .update(specifications)
          .set({ status: 'pending_approval', updatedAt: new Date() })
          .where(eq(specifications.id, job.specId!));
        await tx
          .update(planJobs)
          .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
          .where(eq(planJobs.id, job.id));
      });

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
          { name: spec.name, content: targetVersion.markdownContent },
          { markdownContent: plan.markdownContent || '' },
          { apiKey, model: config?.geminiModel }
        );
      }

      // Validate and materialize the entire DAG before opening the transaction.
      const taskIdMap = new Map<number, string>();
      const taskRows: (typeof tasks.$inferInsert)[] = [];
      for (let i = 0; i < generatedTasks.tasks.length; i++) {
        const t = generatedTasks.tasks[i];
        const externalId = `T-${(i + 1).toString().padStart(3, '0')}`;

        const dependsOn =
          t.dependsOnIndex !== null
            ? ([taskIdMap.get(t.dependsOnIndex)].filter(Boolean) as string[])
            : [];

        if (t.dependsOnIndex !== null && !taskIdMap.has(t.dependsOnIndex)) {
          throw new Error(`Task ${i} has an invalid or forward dependency`);
        }
        taskRows.push({
          planId: job.planId,
          specId: job.specId,
          externalId,
          title: t.title,
          description: t.description,
          status: 'todo',
          dependsOn,
          executionOrder: i + 1,
          estimatedMinutes: t.estimatedMinutes,
          expectedFiles: t.filesInvolved,
          doneCriteria: t.doneCriteria,
          verifyCommand: t.verifyCommand,
          recommendedModel: t.recommendedModel === 'pro' ? 'pro' : 'sonnet',
        });

        taskIdMap.set(i, externalId);
      }

      await db.transaction(async (tx) => {
        const [currentJob] = await tx
          .select()
          .from(planJobs)
          .where(eq(planJobs.id, job.id))
          .limit(1)
          .for('update');
        const [currentSpec] = await tx
          .select({ currentVersionId: specifications.currentVersionId })
          .from(specifications)
          .where(eq(specifications.id, job.specId!))
          .limit(1);
        const [currentPlan] = await tx
          .select({ status: plans.status, specVersionId: plans.specVersionId })
          .from(plans)
          .where(eq(plans.id, job.planId!))
          .limit(1);
        if (
          currentJob?.status !== 'running' ||
          currentJob.generationToken !== job.generationToken ||
          currentSpec?.currentVersionId !== job.specVersionId ||
          currentPlan?.specVersionId !== job.specVersionId ||
          currentPlan.status !== 'executing'
        ) {
          throw new StalePlanJobError('Task generation result was superseded');
        }

        await tx.delete(tasks).where(eq(tasks.planId, job.planId!));
        if (taskRows.length > 0) await tx.insert(tasks).values(taskRows);
        await tx.update(plans).set({ taskCount: taskRows.length }).where(eq(plans.id, job.planId!));
        await tx
          .update(planJobs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(planJobs.id, job.id));
      });
    }

    // Log job completion
    await logEvent(
      job,
      'JOB_COMPLETED',
      job.type === 'generate_plan' ? 'Execution plan generated.' : 'Tasks architected successfully.'
    );

    logger.info(
      { jobId: job.id, durationMs: Date.now() - startMs },
      '✅ Job completed successfully'
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error({ err: error, jobId: job.id }, '❌ Job failed');

    await db
      .update(planJobs)
      .set({
        status: error instanceof StalePlanJobError ? 'cancelled' : 'failed',
        error: error.message,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(planJobs.id, job.id), eq(planJobs.status, 'running')));

    // Log job failure
    await logEvent(
      job,
      'JOB_FAILED',
      `${job.type === 'generate_plan' ? 'Plan generation' : 'Task architecture'} failed: ${error.message}`,
      { error: error.message }
    );

    // If it was a plan generation job, set spec to stalled
    if (job.type === 'generate_plan' && job.specId && !(error instanceof StalePlanJobError)) {
      await db
        .update(specifications)
        .set({ status: 'stalled', updatedAt: new Date() })
        .where(
          and(
            eq(specifications.id, job.specId),
            eq(specifications.currentVersionId, job.specVersionId!),
            eq(specifications.status, 'pending_plan')
          )
        );
    }
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
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
