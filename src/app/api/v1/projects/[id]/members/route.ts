import { NextRequest, NextResponse } from 'next/server';
import { memberRepository } from '@/repositories/member-repository';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { requireMember, requireAdmin } from '@/lib/rbac';
import { inviteMemberSchema } from '@/lib/schemas';

import type { UserRole } from '@/db/schema';

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
    const projectId = parseInt(id, 10);

    // RBAC: require member to view member list
    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } }, { status: 403 });
    }

    const members = await memberRepository.getByProjectId(projectId);

    return NextResponse.json({ data: members });
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
    const projectId = parseInt(id, 10);

    // RBAC: require admin to invite members
    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You must be a project admin to invite members' } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = inviteMemberSchema.parse({ projectId, ...body });

    const invite = await memberRepository.createInvite({
      projectId: parsed.projectId,
      email: parsed.email,
      role: parsed.role as UserRole,
      invitedBy: session.user.id,
    });

    return NextResponse.json({ data: invite }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
