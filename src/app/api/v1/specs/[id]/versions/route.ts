import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { specVersions, specifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const versions = await db.select().from(specVersions).where(eq(specVersions.specId, Number(id))).orderBy(desc(specVersions.versionNumber));

    return NextResponse.json({ success: true, data: versions });
  } catch (error) {
    logger.error('Error fetching spec versions', { error });
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { markdownContent } = await request.json();

    if (!markdownContent) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Content is required' } },
        { status: 400 }
      );
    }

    const [spec] = await db.select().from(specifications).where(eq(specifications.id, Number(id))).limit(1);

    if (!spec) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Specification not found' } },
        { status: 404 }
      );
    }

    const currentVersions = await db.select().from(specVersions).where(eq(specVersions.specId, Number(id))).orderBy(desc(specVersions.versionNumber)).limit(1);
    const nextVersionNumber = currentVersions.length > 0 ? currentVersions[0].versionNumber + 1 : 1;

    const result = await db.transaction(async (tx) => {
      const [newVersion] = await tx.insert(specVersions).values({
        specId: Number(id),
        versionNumber: nextVersionNumber,
        markdownContent,
        createdBy: Number(session.user!.id)
      }).returning();

      await tx.update(specifications).set({
        currentVersionId: newVersion.id,
        updatedAt: new Date()
      }).where(eq(specifications.id, Number(id)));

      return newVersion;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    logger.error('Error creating spec version', { error });
    return handleApiError(error);
  }
}
