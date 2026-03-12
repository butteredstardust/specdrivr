import { NextRequest, NextResponse } from 'next/server';
import { specificationRepository } from '@/repositories/specification-repository';
import { createSpecVersionSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { requireMember } from '@/lib/rbac';
import { db } from '@/db';
import { specVersions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const specId = parseInt(id, 10);

    const spec = await specificationRepository.getById(specId);
    if (!spec) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Specification not found' } }, { status: 404 });
    }

    // RBAC: require member to view versions
    const { allowed } = await requireMember(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } }, { status: 403 });
    }

    const versions = await db
      .select()
      .from(specVersions)
      .where(eq(specVersions.specId, specId))
      .orderBy(desc(specVersions.versionNumber));

    return NextResponse.json({ data: versions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const specId = parseInt(id, 10);

    const spec = await specificationRepository.getById(specId);
    if (!spec) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Specification not found' } }, { status: 404 });
    }

    // RBAC: require member to add version
    const { allowed } = await requireMember(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to update this specification' } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createSpecVersionSchema.parse({ specId, ...body });

    const updatedSpec = await specificationRepository.addVersion({
      specId: parsed.specId,
      markdownContent: parsed.markdownContent,
      createdBy: session.user.id,
    });

    return NextResponse.json({ data: updatedSpec }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
