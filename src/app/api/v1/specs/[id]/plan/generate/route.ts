import { NextRequest, NextResponse } from 'next/server';
import { planRepository, specificationRepository } from '@/repositories';
import type { PlanInsert } from '@/db/schema';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
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

    const spec = await specificationRepository.getById(specId);
    if (!spec) {
      throw new NotFoundError(`Specification with ID ${specId} not found`);
    }

    // Determine current version (dummy logic for now, or just 1)
    const version = 1;

    // Create a dummy/initial plan record
    const newPlan = await planRepository.create({
      specId,
      version,
      status: 'pending_approval',
      content: {
        title: `Plan for ${spec.name}`,
        steps: [
          { id: '1', title: 'Initialize implementation', status: 'pending' },
          { id: '2', title: 'Core logic implementation', status: 'pending' },
          { id: '3', title: 'Testing and verification', status: 'pending' },
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          engine: 'mock-gpt-4',
        },
      },
    } as unknown as PlanInsert);

    return NextResponse.json({ data: newPlan }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
