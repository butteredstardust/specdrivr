import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { projects, webhookDeliveries } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;
  const projectId = parseInt(resolvedParams.projectId, 10);

  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
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
}
