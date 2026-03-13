import { NextResponse } from 'next/server';
import { db } from '@/db';
import { specVersions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

    const existing = await db
      .select()
      .from(specVersions)
      .where(and(eq(specVersions.specId, Number(id)), eq(specVersions.id, Number(vId))));
    if (existing.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Specification version not found' } },
        { status: 404 }
      );
    }

    const spec = existing[0];

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
