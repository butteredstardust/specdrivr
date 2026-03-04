import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
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

        // Find last failed or blocked task
        const lastFailedTask = await db.query.tasks.findFirst({
            where: (t) =>
                or(
                    eq(t.status, 'blocked'),
                    eq(t.status, 'todo') // Or any todo task to retry
                ),
        });

        if (!lastFailedTask) {
            return NextResponse.json(
                { error: 'No failed task to retry' },
                { status: 400 }
            );
        }

        const newRetryCount = (lastFailedTask.retryCount || 0) + 1;

        // Reset task to todo
        await db
            .update(tasks)
            .set({
                status: 'todo',
                retryCount: newRetryCount,
            })
            .where(eq(tasks.id, lastFailedTask.id));

        // Mark project as running
        await db
            .update(projects)
            .set({ agentStatus: 'running' })
            .where(eq(projects.id, projectId));

        return NextResponse.json({
            success: true,
            status: 'retrying',
            project_id: projectId,
            task_id: lastFailedTask.id,
            retry_count: newRetryCount,
        });
    } catch (error) {
        console.error('Agent retry error:', error);
        return NextResponse.json(
            { error: 'Failed to retry' },
            { status: 500 }
        );
    }
}
