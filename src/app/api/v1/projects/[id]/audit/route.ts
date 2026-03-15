import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditRepository } from '@/repositories/audit-repository';
import { handleApiError } from '@/lib/error-handler';
import { requireAdmin } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const PAGE_SIZE = 50;

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Audit log requires Admin or Owner role',
          },
        },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const offset = (page - 1) * PAGE_SIZE;

    const filters = {
      search: searchParams.get('search') ?? undefined,
      actor: searchParams.get('actor') ?? undefined,
      action: searchParams.get('action') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    };

    const hasFilters = Object.values(filters).some(Boolean);

    const [entries, total] = await Promise.all([
      hasFilters
        ? auditRepository.getFilteredByProjectId(projectId, filters, PAGE_SIZE, offset)
        : auditRepository.getByProjectId(projectId, PAGE_SIZE, offset),
      hasFilters
        ? auditRepository.countFilteredByProjectId(projectId, filters)
        : auditRepository.countByProjectId(projectId),
    ]);

    return NextResponse.json({
      data: { items: entries, meta: { page, total, pageSize: PAGE_SIZE } },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
