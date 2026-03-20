import { NextRequest, NextResponse } from 'next/server';
import { memberRepository } from '@/repositories/member-repository';
import { auth } from '@/lib/auth';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { requireMember, requireAdmin } from '@/lib/rbac';
import { z } from 'zod';
import { parseUrlParams } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MemberQuerySchema = z.object({
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const InviteMemberSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).default('viewer'),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    const query = parseUrlParams(request, MemberQuerySchema);

    // RBAC: require member to view member list
    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    const members = await memberRepository.getByProjectId(projectId, query.limit, query.offset);

    return NextResponse.json({
      data: members,
      meta: { limit: query.limit, offset: query.offset, count: members.length },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid query parameters', details: error.errors }),
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    // RBAC: require admin to invite members
    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You must be a project admin to invite members' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = InviteMemberSchema.parse({ projectId, ...body });

    const invite = await memberRepository.createInvite({
      projectId: parsed.projectId,
      email: parsed.email,
      role: parsed.role,
      invitedBy: session.user.id,
    });

    return NextResponse.json({ data: invite }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Validation failed', details: error.errors }),
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
