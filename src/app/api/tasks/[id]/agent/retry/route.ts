import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
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
        const taskId = parseInt(params.id, 10);

        // Get the task
        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId),
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const newRetryCount = (task.retryCount || 0) + 1;

        // Reset task to todo
        await db
            .update(tasks)
            .set({
                status: 'todo',
                retryCount: newRetryCount,
                notes: task.notes
                    ? `${task.notes}\n[RETRY ${newRetryCount}]`
                    : `[RETRY ${newRetryCount}]`,
            })
            .where(eq(tasks.id, taskId));

        return NextResponse.json({
            success: true,
            status: 'retrying',
            task_id: taskId,
            retry_count: newRetryCount,
        });
    } catch (error) {
        console.error('Task retry error:', error);
        return NextResponse.json(
            { error: 'Failed to retry task' },
            { status: 500 }
        );
    }
}
