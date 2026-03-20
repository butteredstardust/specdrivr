import { NextRequest, NextResponse } from 'next/server';
import {
  planRepository,
  specificationRepository,
  taskRepository,
  agentConfigRepository,
} from '@/repositories';
import { auth } from '@/lib/auth';
import { env } from '@/lib/env';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { requireAdmin } from '@/lib/rbac';
import { generateTasks } from '@/lib/gemini';
import { logger } from '@/lib/logger';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ApprovePlanSchema = z.object({
  id: z.number().int().positive('Plan ID is required'),
  notes: z.string().max(2000, 'Notes too long').optional().nullable(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const planId = parseInt(id, 10);

    const plan = await planRepository.getById(planId);
    if (!plan)
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Plan not found' } },
        { status: 404 }
      );

    const spec = await specificationRepository.getByIdWithVersion(plan.specId);
    if (!spec || !spec.currentVersion)
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Specification or version not found' } },
        { status: 404 }
      );

    // RBAC: require admin to approve
    const { allowed } = await requireAdmin(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You must be a project admin to approve plans' } },
        { status: 403 }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is okay for simple approval
    }

    const parsed = ApprovePlanSchema.parse({ id: planId, ...body });

    // 1. Approve the plan and create agent session
    const { plan: updatedPlan, sessionId } = await planRepository.approvePlan({
      planId: parsed.id,
      userId: session.user.id,
      notes: parsed.notes,
    });

    const config = await agentConfigRepository.getByProjectId(spec.projectId);
    const geminiKey = config?.geminiApiKey || env.GEMINI_API_KEY || '';

    if (!geminiKey && env.NODE_ENV === 'production') {
      logger.warn('Gemini API key is missing in production. Skipping task generation.');
      return NextResponse.json({
        data: {
          plan: updatedPlan,
          sessionId,
          tasksCount: 0,
          warning: 'Plan approved but tasks could not be generated (missing API key).',
        },
      });
    }

    let generatedTasks;
    if (!geminiKey && env.NODE_ENV === 'development') {
      logger.info('Gemini API key is missing in development. Using mock tasks.');
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
      // 2. Generate tasks immediately after approval
      generatedTasks = await generateTasks(
        { name: spec.name, content: spec.currentVersion.markdownContent },
        { markdownContent: updatedPlan.markdownContent || '' },
        { apiKey: geminiKey, model: config?.geminiModel }
      );
    }

    // 3. Create task records in order
    const taskIdMap = new Map<number, string>(); // generatedIndex → externalId

    for (let i = 0; i < generatedTasks.tasks.length; i++) {
      const t = generatedTasks.tasks[i];
      const externalId = `T-${(i + 1).toString().padStart(3, '0')}`;

      const dependsOn =
        t.dependsOnIndex !== null
          ? ([taskIdMap.get(t.dependsOnIndex)].filter(Boolean) as string[])
          : [];

      await taskRepository.create({
        planId: updatedPlan.id,
        specId: updatedPlan.specId,
        externalId,
        title: t.title,
        description: t.description,
        status: 'todo',
        dependsOn,
        executionOrder: i + 1,
        estimatedMinutes: t.estimatedMinutes,
        doneCriteria: t.doneCriteria,
        verifyCommand: t.verifyCommand,
        recommendedModel: t.recommendedModel === 'pro' ? 'pro' : 'sonnet', // Mapping flash/pro to project specific model names if needed, but schema uses 'sonnet' as default.
      });

      taskIdMap.set(i, externalId);
    }

    // Update plan task count
    await planRepository.update(updatedPlan.id, {
      taskCount: generatedTasks.tasks.length,
    });

    return NextResponse.json({
      data: { plan: updatedPlan, sessionId, tasksCount: generatedTasks.tasks.length },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Validation failed', details: error.errors }),
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
