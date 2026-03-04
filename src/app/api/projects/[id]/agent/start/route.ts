import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateAgentToken } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!validateAgentToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const projectId = parseInt(params.id, 10);

        // Get the project
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Mark project as running
        await db
            .update(projects)
            .set({
                agentStatus: 'running',
                agentStartedAt: new Date(),
            })
            .where(eq(projects.id, projectId));

        // Get next todo task
        const nextTask = await db.query.tasks.findFirst({
            where: (t) => eq(t.status, 'todo'),
        });

        return NextResponse.json({
            success: true,
            status: 'started',
            project_id: projectId,
            current_task_id: nextTask?.id,
            message: 'Agent started working on project',
        });
    } catch (error) {
        console.error('Agent start error:', error);
        return NextResponse.json(
            { error: 'Failed to start agent' },
            { status: 500 }
        );
    }
}
