import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { specVersions, specifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const versions = await db.select().from(specVersions).where(eq(specVersions.specId, Number(id))).orderBy(desc(specVersions.versionNumber));

    return NextResponse.json({ data: versions });
  } catch (error) {
    console.error('Error fetching spec versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { markdownContent } = await request.json();

    if (!markdownContent) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const [spec] = await db.select().from(specifications).where(eq(specifications.id, Number(id))).limit(1);

    if (!spec) {
      return NextResponse.json({ error: 'Specification not found' }, { status: 404 });
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

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating spec version:', error);
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
  }
}
