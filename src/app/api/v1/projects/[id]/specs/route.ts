import { NextRequest, NextResponse } from 'next/server';
import { specificationRepository } from '@/repositories/specification-repository';
import { createSpecificationSchema } from '@/lib/schemas';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { requireMember } from '@/lib/rbac';

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

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid project ID' }),
        { status: 400 }
      );
    }

    // RBAC: require member to list specs
    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    const specs = await specificationRepository.getByProjectId(projectId);

    return NextResponse.json({
      data: specs,
    });
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

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid project ID' }),
        { status: 400 }
      );
    }

    // RBAC: require member to create spec
    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have permission to create specifications in this project' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createSpecificationSchema.parse({ projectId, ...body });

    const spec = await specificationRepository.createWithVersion({
      projectId: parsed.projectId,
      name: parsed.name,
      markdownContent: parsed.markdownContent,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      data: spec,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
