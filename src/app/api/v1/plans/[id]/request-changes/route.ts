import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { planRepository } from '@/repositories';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const requestChangesSchema = z.object({
  notes: z.string().min(1)
});

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
    const body = await request.json();
    const { notes } = requestChangesSchema.parse(body);

    const updated = await planRepository.update(planId, {
      status: 'changes_requested',
      reviewerNotes: notes
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
