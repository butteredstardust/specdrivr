import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { requireAdmin, requireMember } from '@/lib/rbac';
import { agentConfigRepository } from '@/repositories/agent-config-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateAgentConfigSchema = z.object({
  modelId: z.string().optional(),
  planModelId: z.string().optional(),
  maxConcurrentTasks: z.number().int().min(1).max(10).optional(),
  taskTimeoutSeconds: z.number().int().min(30).max(3600).optional(),
  maxRetriesPerTask: z.number().int().min(0).max(5).optional(),
  retryDelaySeconds: z.number().int().min(15).max(300).optional(),
  requireApproval: z.boolean().optional(),
  autoGeneratePlan: z.boolean().optional(),
  branchPrefix: z.string().optional(),
  commitMessagePrefix: z.string().optional(),
  allowedFileGlobs: z.array(z.string()).optional(),
  forbiddenFileGlobs: z.array(z.string()).optional(),
  testCommand: z.string().nullable().optional(),
  lintCommand: z.string().nullable().optional(),
  setupCommand: z.string().nullable().optional(),
  maxDiffSizeKb: z.number().int().min(1).optional(),
  prAutoCreate: z.boolean().optional(),
  prTargetBranch: z.string().optional(),
  githubToken: z.string().nullable().optional(),
  githubRepo: z.string().nullable().optional(),
  githubBranch: z.string().nullable().optional(),
  githubWebhookSecret: z.string().nullable().optional(),
  slackBotToken: z.string().nullable().optional(),
  slackChannelId: z.string().nullable().optional(),
});

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(formatErrorResponse({ message: 'Invalid project ID' }), {
        status: 400,
      });
    }

    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    const config = await agentConfigRepository.getByProjectId(projectId);

    // Return config or null — client will use schema defaults when null
    return NextResponse.json({ data: config });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(formatErrorResponse({ message: 'Invalid project ID' }), {
        status: 400,
      });
    }

    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You must be a project admin to update agent configuration',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateAgentConfigSchema.parse(body);

    const updated = await agentConfigRepository.upsertByProjectId(projectId, parsed);

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
