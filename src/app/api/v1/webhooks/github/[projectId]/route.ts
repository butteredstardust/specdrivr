import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, webhookDeliveries } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/error-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.projectId, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid project ID' } }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } }, { status: 404 });
    }

    const payload = await request.json();
    const event = request.headers.get('x-github-event') || 'unknown';

    await db.insert(webhookDeliveries).values({
      projectId: project.id,
      eventType: event,
      payload: payload,
      status: 'delivered',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
