import { NextResponse } from 'next/server';
import { specificationRepository } from '@/repositories/specification-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: Request, context: { params: Promise<{ id: string; vId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id, vId } = await context.params;

    const spec = await specificationRepository.getVersionById(Number(id), Number(vId));
    if (!spec) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Specification version not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: spec.id.toString(),
        versionNumber: spec.versionNumber,
        markdownContent: spec.markdownContent,
        createdAt: spec.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching spec version by ID');
    return handleApiError(error);
  }
}
