import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { webhookRepository } from '@/repositories/webhook-repository';
import { handleApiError } from '@/lib/error-handler';
import { requireMember, requireAdmin } from '@/lib/rbac';
import { createWebhookSchema } from '@/lib/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
    const parsed = createWebhookSchema.parse({ projectId, ...body });

    const webhook = await webhookRepository.create(parsed);
    return NextResponse.json({ data: webhook }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
