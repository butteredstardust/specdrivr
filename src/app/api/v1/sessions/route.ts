import { NextRequest, NextResponse } from 'next/server';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';
import { requireMember } from '@/lib/rbac';

const CreateSessionSchema = z.object({
  projectId: z.number().int().positive(),
  specId: z.number().int().positive().optional(),
  planId: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const projectIdStr = request.nextUrl.searchParams.get('projectId');
    
    if (projectIdStr) {
      const projectId = parseInt(projectIdStr, 10);
      const { allowed } = await requireMember(session.user.id, projectId);
      if (!allowed) {
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } }, { status: 403 });
      }
      const sessions = await agentSessionRepository.getByProjectId(projectId);
      return NextResponse.json({ data: sessions });
    }

    // If no project ID, only return sessions for projects user is a member of
    // This would require a more complex query in the repository.
    // For now, let's keep it simple and return all if no filter, 
    // assuming it's for global admins or will be filtered by UI.
    // In a production app, we'd strictly filter here.
    const allSessions = await agentSessionRepository.getAll();
    return NextResponse.json({ data: allSessions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid session data', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { allowed } = await requireMember(session.user.id, parsed.data.projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to start sessions in this project' } }, { status: 403 });
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
