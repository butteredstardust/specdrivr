import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { projects, projectMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

const UpdateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer'])
});

export async function PATCH(req: Request, context: { params: Promise<{ id: string, userId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (((session.user as { role?: string }).role) !== 'admin' && ((session.user as { role?: string }).role) !== 'owner') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { id, userId } = await context.params;
    const body = await req.json();
    const parsed = UpdateMemberRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const targetUserId = Number(userId);
    const projectId = Number(id);

    const existing = await db.select().from(projects).where(eq(projects.id, projectId));
    if (existing.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    if (existing[0].createdBy === targetUserId) {
       return NextResponse.json(
         { error: { code: 'FORBIDDEN', message: 'Cannot demote the owner' } },
         { status: 403 }
       );
    }

    const existingMember = await db.select().from(projectMembers).where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId))
    );

    if (existingMember.length === 0) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Member not found' } },
          { status: 404 }
        );
    }

    await db.update(projectMembers).set({ role: parsed.data.role }).where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId))
    );

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string, userId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (((session.user as { role?: string }).role) !== 'admin' && ((session.user as { role?: string }).role) !== 'owner') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { id, userId } = await context.params;
    const targetUserId = Number(userId);
    const projectId = Number(id);

    if (Number(session.user.id) === targetUserId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Cannot remove self' } },
        { status: 400 }
      );
    }

    const existing = await db.select().from(projects).where(eq(projects.id, projectId));
    if (existing.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    if (existing[0].createdBy === targetUserId) {
       return NextResponse.json(
         { error: { code: 'FORBIDDEN', message: 'Cannot remove the owner' } },
         { status: 403 }
       );
    }

    const existingMember = await db.select().from(projectMembers).where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId))
    );

    if (existingMember.length === 0) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Member not found' } },
          { status: 404 }
        );
    }

    await db.delete(projectMembers).where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId))
    );

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
