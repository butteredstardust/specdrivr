import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
        const body = await request.json();
        const reason = body.reason || 'Stopped by developer';

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

        // Mark current task as blocked with reason
        if (currentTask) {
            const existingNotes = currentTask.notes || '';
            const newNotes = existingNotes
                ? `${existingNotes}\n[STOPPED] ${reason}`
                : `[STOPPED] ${reason}`;

            await db
                .update(tasks)
                .set({
                    status: 'blocked',
                    notes: newNotes,
                })
                .where(eq(tasks.id, currentTask.id));
        }

        // Mark project as stopped
        await db
            .update(projects)
            .set({
                agentStatus: 'stopped',
                agentStoppedAt: new Date(),
            })
            .where(eq(projects.id, projectId));

        return NextResponse.json({
            success: true,
            status: 'stopped',
            project_id: projectId,
            last_task_id: currentTask?.id,
            reason,
        });
    } catch (error) {
        console.error('Agent stop error:', error);
        return NextResponse.json(
            { error: 'Failed to stop agent' },
            { status: 500 }
        );
    }
}
