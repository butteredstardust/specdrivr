import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { projects, projectMembers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

const CreateProjectSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1)
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // Fetch projects where the user is a member
    let allProjects;
    if (((session.user as { role?: string }).role) === 'admin') {
      allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
    } else {
      const userProjects = await db.select({
        project: projects
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, userId))
      .orderBy(desc(projects.createdAt));

      allProjects = userProjects.map(up => up.project);
    }

    // For simplicity, we are returning memberCount: 1,
    // but in a real app we would query COUNT(*) grouped by projectId

    const formattedProjects = allProjects.map(p => ({
      id: p.id.toString(),
      name: p.name,
      slug: p.slug,
      memberCount: 1,
      lastSessionSummary: p.description
    }));

    return NextResponse.json({ data: formattedProjects });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 422 });
    }

    const { name, slug } = parsed.data;
    const userId = Number(session.user.id);

    const existing = await db.select().from(projects).where(eq(projects.slug, slug));
    if (existing.length > 0) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'Project slug already exists' } }, { status: 409 });
    }

    const result = await db.transaction(async (tx) => {
      const [newProject] = await tx.insert(projects).values({
        name,
        slug,
      }).returning();

      await tx.insert(projectMembers).values({
        projectId: newProject.id,
        userId: userId,
        role: 'admin' // Creator is an admin/owner
      });

      return newProject;
    });

    return NextResponse.json({ data: { ...result, id: result.id.toString() } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
