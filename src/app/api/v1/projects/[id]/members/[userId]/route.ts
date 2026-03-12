import { NextRequest, NextResponse } from 'next/server';
import { memberRepository } from '@/repositories/member-repository';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { requireAdmin } from '@/lib/rbac';
import { updateMemberRoleSchema } from '@/lib/schemas';

import type { UserRole } from '@/db/schema';

interface RouteParams {
  params: Promise<{ id: string, userId: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id, userId } = await params;
    const projectId = parseInt(id, 10);

    const { allowed, role: actorRole } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You must be a project admin to update roles' } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateMemberRoleSchema.parse({ projectId, userId, ...body });

    // Admin cannot create an owner
    if (parsed.role === 'owner' && actorRole !== 'owner') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only owners can appoint new owners' } }, { status: 403 });
    }

    const updated = await memberRepository.updateRole(
      parsed.projectId,
      parsed.userId,
      parsed.role as UserRole,
      session.user.id
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id, userId } = await params;
    const projectId = parseInt(id, 10);

    if (userId === session.user.id) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You cannot remove yourself from the project' } }, { status: 403 });
    }

    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You must be a project admin to remove members' } }, { status: 403 });
    }

    await memberRepository.remove(projectId, userId, session.user.id);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
