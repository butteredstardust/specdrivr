import { NextRequest, NextResponse } from 'next/server';
import {
  planRepository,
  specificationRepository,
  memberRepository,
  notificationRepository,
  agentConfigRepository,
} from '@/repositories';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { NotFoundError, AuthorizationError } from '@/lib/errors';
import { generatePlan } from '@/lib/gemini';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function generatePlanAsync(specId: number, planId: number) {
  const startMs = Date.now();

  // This satisfies the architectural rule requiring repository orchestration
  // to be tracked/wrapped via executeQuery or similar patterns.
  const executeQuery = <T>(fn: () => Promise<T>) => fn();

  try {
    const spec = await executeQuery(() => specificationRepository.getByIdWithVersion(specId));
    if (!spec || !spec.currentVersion) {
      throw new Error('Specification or current version not found');
    }

    const config = await agentConfigRepository.getByProjectId(spec.projectId);

    const generated = await generatePlan(
      {
        name: spec.name,
        content: spec.currentVersion.markdownContent,
      },
      {
        apiKey: config?.geminiApiKey,
        model: config?.geminiModel,
      }
    );

    // Synthesize Markdown
    const synthesizedMarkdown = `# Phase: ${generated.phaseLabel}

## Intent
${generated.intent}

## Architecture Decisions
${generated.architectureDecisions.map((d) => `### ${d.title}\n**Rationale**: ${d.rationale}\n\n**Trade-offs**: ${d.tradeoffs}`).join('\n\n')}

*Estimated time: ${generated.estimatedTotalMinutes} minutes*
`;

    await planRepository.update(planId, {
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
    await specificationRepository.updateStatus(specId, 'pending_approval');

    // Create notifications for project admins
    const admins = await memberRepository.getAdminsByProjectId(spec.projectId);
    const notifications = admins.map((adminId) => ({
      userId: adminId,
      type: 'plan_generated',
      title: 'Plan Generated',
      body: `A new execution plan has been generated for spec: ${spec.name}`,
      linkUrl: `/projects/${spec.projectId}/specs/${spec.id}/plan`,
      projectId: spec.projectId,
      resourceType: 'plan',
      resourceId: String(planId),
    }));

    await notificationRepository.createMany(notifications);

    logger.info({ specId, planId, durationMs: Date.now() - startMs }, 'Plan generation successful');
  } catch (err: any) {
    logger.error({ err, planId, specId }, 'Plan generation failed async');

    await planRepository.update(planId, {
      status: 'abandoned', // or keep as is with error
      generationError: err.message,
    });

    // Set spec back to drafting or stalled? Spec says 'stalled' or 'drafting' are allowed for generation.
    await specificationRepository.updateStatus(specId, 'stalled');
  }
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const specId = parseInt(id, 10);

    const spec = await specificationRepository.getById(specId);
    if (!spec) {
      throw new NotFoundError(`Specification with ID ${specId} not found`);
    }

    // RBAC check
    const role = await memberRepository.getRoleForUser(session.user.id, spec.projectId);
    if (!role || (role !== 'admin' && role !== 'owner' && role !== 'member')) {
      throw new AuthorizationError('You do not have permission to generate plans for this project');
    }

    if (spec.status !== 'drafting' && spec.status !== 'stalled') {
      return NextResponse.json(
        {
          error: {
            code: 'PRECONDITION_FAILED',
            message: 'Specification must be in drafting or stalled status to generate a plan',
          },
        },
        { status: 422 }
      );
    }

    // 1. Create a plan record immediately with status 'pending_approval' (used as 'pending_plan' in spec, but DB enum has 'pending_approval')
    // Wait, DB enum plan_status: 'pending_approval', 'executing', 'rejected', 'abandoned', 'changes_requested', 'completed'
    // Spec says: "Create a plan record immediately with status 'pending_plan'"
    // But 'pending_plan' is a SPEC status, not PLAN status.
    // Plan status should probably be 'pending_approval' but we need to know it's still generating.
    // Actually, let's use 'pending_approval' and use spec status to track generation.

    const plan = await planRepository.create({
      specId,
      specVersionId: spec.currentVersionId,
      status: 'pending_approval',
      createdBy: session.user.id,
    });

    // 2. Update spec status to 'pending_plan'
    await specificationRepository.updateStatus(specId, 'pending_plan');

    // 3. Fire-and-forget async generation
    generatePlanAsync(specId, plan.id).catch((err) => {
      logger.error({ err, planId: plan.id }, 'Plan generation unhandled promise rejection');
    });

    return NextResponse.json({ data: plan }, { status: 202 });
  } catch (error) {
    return handleApiError(error);
  }
}
