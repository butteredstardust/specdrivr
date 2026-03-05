import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { inArray, and } from 'drizzle-orm';
import * as schema from '@/db/schema';
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
        const projectId = parseInt(routeParams.id, 10);
        const body = await request.json();
        const reason = body.reason || 'Stopped by developer';

        // Get the project
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Get all specs for this project
        const projectSpecs = await db.query.specifications.findMany({
            where: eq(schema.specifications.projectId, projectId)
        });

        const specIds = projectSpecs.map(s => s.id);

        let projectPlanIds: number[] = [];
        if (specIds.length > 0) {
            const projectPlansList = await db.query.plans.findMany({
                where: inArray(schema.plans.specId, specIds)
            });
            projectPlanIds = projectPlansList.map(p => p.id);
        }

        // Find current in_progress task scoped to this project
        let currentTask = null;
        if (projectPlanIds.length > 0) {
            currentTask = await db.query.tasks.findFirst({
                where: and(
                    eq(tasks.status, 'in_progress'),
                    inArray(tasks.planId, projectPlanIds)
                ),
            });
        }

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
