import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateAgentToken } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateAgentToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const routeParams = await params;
        const taskId = parseInt(routeParams.id, 10);

        // Get the task
        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId),
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Mark task as skipped
        await db
            .update(tasks)
            .set({
                // @ts-ignore - The underlying schema supports 'skipped' but TS might complain if it uses outdated types
                status: 'skipped',
                completedAt: new Date(),
                notes: task.notes ? `${task.notes}\n[SKIPPED by developer]` : '[SKIPPED by developer]',
            })
            .where(eq(tasks.id, taskId));

        return NextResponse.json({
            success: true,
            status: 'skipped',
            task_id: taskId,
            reason: 'skipped',
        });
    } catch (error) {
        console.error('Task skip error:', error);
        return NextResponse.json(
            { error: 'Failed to skip task' },
            { status: 500 }
        );
    }
}
