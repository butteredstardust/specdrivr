import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { webhooks } from '@/db/schema';
import { handleApiError } from '@/lib/error-handler';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createWebhookSchema = z.object({
  url: z.string().url(),
  secret: z.string().optional(),
  events: z.array(z.string()).default(['*']),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { id } = await params;
  const projectId = parseInt(id);

  try {
    const list = await db.select()
      .from(webhooks)
      .where(eq(webhooks.projectId, projectId));

    return NextResponse.json({ data: list });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { id } = await params;
  const projectId = parseInt(id);

  try {
    const body = await request.json();
    const data = createWebhookSchema.parse(body);

    const [inserted] = await db.insert(webhooks).values({
      projectId,
      ...data,
    }).returning();

    return NextResponse.json({ data: inserted });
  } catch (error) {
    return handleApiError(error);
  }
}
