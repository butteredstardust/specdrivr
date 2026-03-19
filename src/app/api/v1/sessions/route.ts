import { NextRequest, NextResponse } from 'next/server';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { auth } from '@/lib/auth';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { z } from 'zod';
import { requireMember } from '@/lib/rbac';
import { db } from '@/db';
import { projectMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SessionQuerySchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  specId: z.coerce.number().int().positive().optional(),
  status: z.enum(['running', 'paused', 'completed', 'failed', 'cancelled']).optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const CreateSessionSchema = z.object({
  projectId: z.number().int().positive(),
  specId: z.number().int().positive().optional(),
  planId: z.number().int().positive().optional(),
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
    const query = SessionQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    let allowedProjectIds: number[] = [];

    if (query.projectId) {
      const { allowed } = await requireMember(session.user.id, query.projectId);
      if (!allowed) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
          { status: 403 }
        );
      }
      allowedProjectIds = [query.projectId];
    } else {
      // Scope to all projects the user is a member of
      allowedProjectIds = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, session.user.id))
        .then((rows) => rows.map((r) => r.projectId));

      if (allowedProjectIds.length === 0) {
        return NextResponse.json({
          data: [],
          meta: { limit: query.limit, offset: query.offset, count: 0 },
        });
      }
    }

    const { data: enrichedSessions, count } = await agentSessionRepository.getEnrichedSessions(
      query,
      allowedProjectIds
    );

    return NextResponse.json({
      data: enrichedSessions,
      meta: { limit: query.limit, offset: query.offset, count },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid query parameters', details: error.errors }),
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid session data',
            details: parsed.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { allowed } = await requireMember(session.user.id, parsed.data.projectId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to start sessions in this project',
          },
        },
        { status: 403 }
      );
    }

    const newSession = await agentSessionRepository.create({
      ...parsed.data,
      startedBy: session.user.id,
    });

    return NextResponse.json({ data: newSession }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
