import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { specificationRepository } from '@/repositories/specification-repository';
import { taskRepository } from '@/repositories/task-repository';
import { handleApiError } from '@/lib/error-handler';
import { requireMember } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

type DiffFileStatus = 'added' | 'modified' | 'deleted' | 'renamed';

function toFileStatus(changeType: string): DiffFileStatus {
  if (changeType === 'created') return 'added';
  if (changeType === 'deleted') return 'deleted';
  if (changeType === 'renamed') return 'renamed';
  return 'modified';
}

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

    if (Number.isNaN(specId)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid spec id' } },
        { status: 400 }
      );
    }

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
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const fileChanges = await taskRepository.getFileChangesBySpecId(specId);

    const files = fileChanges.map((fc) => ({
      filename: fc.filePath,
      patch: fc.diff ?? '',
      additions: fc.linesAdded ?? 0,
      deletions: fc.linesRemoved ?? 0,
      status: toFileStatus(fc.changeType),
    }));

    return NextResponse.json({ files });
  } catch (error) {
    return handleApiError(error);
  }
}
