import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { requireMember } from '@/lib/rbac';
import { z } from 'zod';
import { db } from '@/db';
import { tasks, specVersions, specifications } from '@/db/schema';
import { count, eq, desc, sql } from 'drizzle-orm';

const SpecsQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(50),
});

export async function GET(request: NextRequest) {
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

    // Subquery: count tasks per spec
    const taskCountSubq = db
      .select({ specId: tasks.specId, total: count().as('total') })
      .from(tasks)
      .groupBy(tasks.specId)
      .as('task_counts');

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: specifications.id,
          name: specifications.name,
          status: specifications.status,
          currentVersionId: specifications.currentVersionId,
          createdAt: specifications.createdAt,
          updatedAt: specifications.updatedAt,
          taskCount: taskCountSubq.total,
          currentVersionNumber: specVersions.versionNumber,
        })
        .from(specifications)
        .leftJoin(taskCountSubq, eq(specifications.id, taskCountSubq.specId))
        .leftJoin(specVersions, eq(specifications.currentVersionId, specVersions.id))
        .where(eq(specifications.projectId, projectId))
        .orderBy(desc(specifications.createdAt))
        .limit(safeLimit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(specifications)
        .where(eq(specifications.projectId, projectId)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return NextResponse.json({
      data: rows,
      meta: { page, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
