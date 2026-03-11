import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, users, invites, projectMembers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const projectId = Number(id);

    const project = await db.select().from(projects).where(eq(projects.id, projectId));
    if (project.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    const activeMembers = await db.select({
      id: projectMembers.id,
      userId: users.id,
      email: users.email,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));

    const members = activeMembers.map(m => ({
       id: 'mem_' + m.id,
       userId: m.userId.toString(),
       email: m.email,
       role: m.role,
       status: 'active'
    }));

    const pendingInvites = await db.select().from(invites).where(eq(invites.projectId, projectId)).orderBy(desc(invites.createdAt));

    const invited = pendingInvites.map(i => ({
        id: 'inv_' + i.id,
        userId: null,
        email: i.email,
        role: i.role,
        status: 'invited'
    }));

    return NextResponse.json({ data: [...members, ...invited] });
  } catch (error) {
    return handleApiError(error);
  }
}
