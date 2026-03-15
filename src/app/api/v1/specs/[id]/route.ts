import { NextRequest, NextResponse } from 'next/server';
import { specificationRepository } from '@/repositories/specification-repository';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { requireMember, requireAdmin } from '@/lib/rbac';
import { z } from 'zod';
import { specStatusEnum } from '@/db/schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UpdateSpecSchema = z.object({
  name: z.string().optional(),
  status: z.enum(specStatusEnum.enumValues).optional(),
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
    const specId = parseInt(id, 10);

    const spec = await specificationRepository.getById(specId);
    if (!spec) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Specification not found' } },
        { status: 404 }
      );
    }

    const { allowed } = await requireMember(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: spec });
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
    const specId = parseInt(id, 10);

    const spec = await specificationRepository.getById(specId);
    if (!spec) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Specification not found' } },
        { status: 404 }
      );
    }

    const { allowed } = await requireAdmin(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this specification',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = UpdateSpecSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Validation failed', details: parsed.error.errors }),
        { status: 400 }
      );
    }

    const updated = await specificationRepository.update(specId, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Specification not found' } },
        { status: 404 }
      );
    }

    const { allowed } = await requireAdmin(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this specification',
          },
        },
        { status: 403 }
      );
    }

    if (spec.status === 'executing') {
      return NextResponse.json(
        {
          error: { code: 'CONFLICT', message: 'Cannot delete a spec that is currently executing' },
        },
        { status: 409 }
      );
    }

    await specificationRepository.delete(specId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
