import { NextRequest, NextResponse } from 'next/server';
import { agentSessionRepository } from '@/repositories';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const CreateSessionSchema = z.object({
  projectId: z.number().int().positive(),
  specId: z.number().int().positive().optional(),
  planId: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('projectId');
    
    let sessions;
    if (projectId) {
      sessions = await agentSessionRepository.getByProjectId(parseInt(projectId, 10));
    } else {
      sessions = await agentSessionRepository.getAll();
    }

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid session data', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const newSession = await agentSessionRepository.create({
      ...parsed.data,
      startedBy: Number(session.user.id),
    });

    return NextResponse.json({ success: true, data: newSession }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
