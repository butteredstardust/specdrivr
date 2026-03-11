import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { planRepository } from '@/repositories';
import { handleApiError } from '@/lib/error-handler';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { id } = await params;
  const planId = parseInt(id);

  try {
    const updated = await planRepository.update(planId, {
      status: 'abandoned'
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
