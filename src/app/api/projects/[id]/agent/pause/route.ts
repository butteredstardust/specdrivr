import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
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
