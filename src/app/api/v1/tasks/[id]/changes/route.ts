import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { taskRepository } from '@/repositories';
import { handleApiError } from '@/lib/error-handler';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { id } = await params;
  const taskId = parseInt(id);

  try {
    const changes = await taskRepository.getFileChanges(taskId);
    return NextResponse.json({ data: changes });
  } catch (error) {
    return handleApiError(error);
  }
}
