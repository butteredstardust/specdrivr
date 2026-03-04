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

        // Find current in_progress task
        const currentTask = await db.query.tasks.findFirst({
            where: (t) => eq(t.status, 'in_progress'),
        });

        // Mark project as paused
        await db
            .update(projects)
            .set({ agentStatus: 'paused' })
            .where(eq(projects.id, projectId));

        // Keep task in progress (paused, not blocked)
        // This allows resuming from where we left off

        return NextResponse.json({
            success: true,
            status: 'paused',
            project_id: projectId,
            current_task_id: currentTask?.id,
            message: 'Agent paused',
        });
    } catch (error) {
        console.error('Agent pause error:', error);
        return NextResponse.json(
            { error: 'Failed to pause agent' },
            { status: 500 }
        );
    }
}
