import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const pauseSchema = z.object({
    project_id: z.number().int(),
    task_id: z.number().int(),
    resume_context: z.object({
        completed_steps: z.array(z.string()).default([]),
        remaining_steps: z.array(z.string()).default([]),
        files_modified: z.array(z.string()).default([]),
        notes: z.string().default('')
    })
});

export async function POST(request: NextRequest) {
    if (!validateAgentToken(request)) return getUnauthorizedResponse();

    try {
        const body = await request.json();
        const result = pauseSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: 'Validation failed', details: result.error.issues },
                { status: 400 }
            );
        }

        const { task_id, resume_context } = result.data;

        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, task_id)
        });

        if (!task) {
            return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
        }

        if (task.status !== 'in_progress') {
            return NextResponse.json({ success: false, error: 'Task is not in_progress' }, { status: 422 });
        }

        await db.update(tasks).set({
            status: 'paused',
            resumeContext: resume_context
        }).where(eq(tasks.id, task_id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Pause endpoint error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
