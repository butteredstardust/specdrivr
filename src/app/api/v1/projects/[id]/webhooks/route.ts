import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { webhooks, projects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import crypto from 'crypto';
import { handleApiError } from '@/lib/error-handler';

const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).default(['*'])
});

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Check if project exists
    const project = await db.select().from(projects).where(eq(projects.id, Number(id)));
    if (project.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    const projectWebhooks = await db.select().from(webhooks).where(eq(webhooks.projectId, Number(id))).orderBy(desc(webhooks.createdAt));

    const mapped = projectWebhooks.map(w => ({
      ...w,
      id: w.id.toString(),
      projectId: w.projectId.toString()
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (((session.user as { role?: string }).role) !== 'admin' && ((session.user as { role?: string }).role) !== 'owner') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const parsed = CreateWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const project = await db.select().from(projects).where(eq(projects.id, Number(id)));
    if (project.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const [newWebhook] = await db.insert(webhooks).values({
      projectId: Number(id),
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
      isActive: true
    }).returning();

    return NextResponse.json({ success: true, data: { ...newWebhook, id: newWebhook.id.toString() } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
