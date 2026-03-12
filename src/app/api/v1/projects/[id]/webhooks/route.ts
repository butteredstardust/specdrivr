import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { webhookRepository } from '@/repositories/webhook-repository';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { requireMember, requireAdmin } from '@/lib/rbac';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const CreateWebhookSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  url: z.string().url('Invalid webhook URL'),
  secret: z.string().max(255).optional().nullable(),
  events: z.array(z.string()).min(1, 'At least one event subscription is required'),
});

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } }, { status: 403 });
    }

    const list = await webhookRepository.getByProjectId(projectId);
    return NextResponse.json({ data: list });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You must be a project admin to manage webhooks' } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateWebhookSchema.parse({ projectId, ...body });

    const webhook = await webhookRepository.create(parsed);
    return NextResponse.json({ data: webhook }, { status: 201 });
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
