import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { requireMember } from '@/lib/rbac';
import { z } from 'zod';
import { getEnrichedSpecs } from '@/queries/specs-query';

const SpecsQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(50),
});

export async function GET(request: NextRequest) {
  await connection();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = SpecsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid query parameters', details: parsed.error.errors }),
        { status: 400 }
      );
    }

    const { projectId, page, limit } = parsed.data;

    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;

    const { data: rows, total } = await getEnrichedSpecs({
      projectId,
      limit: safeLimit,
      offset,
    });

    return NextResponse.json({
      data: rows,
      meta: { page, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
