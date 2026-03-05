import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq, or, inArray, and } from 'drizzle-orm';
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

        // Find last failed or blocked task scoped to this project
        let lastFailedTask = null;
        if (projectPlanIds.length > 0) {
            lastFailedTask = await db.query.tasks.findFirst({
                where: and(
                    or(
                        eq(tasks.status, 'blocked'),
                        eq(tasks.status, 'todo') // Or any todo task to retry
                    ),
                    inArray(tasks.planId, projectPlanIds)
                ),
            });
        }

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
