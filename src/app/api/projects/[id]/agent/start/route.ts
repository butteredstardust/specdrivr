import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
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

        // Mark project as running
        await db
            .update(projects)
            .set({
                agentStatus: 'running',
                agentStartedAt: new Date(),
            })
            .where(eq(projects.id, projectId));

        // Get all plan IDs for this project
        const projectPlans = await db.query.plans.findMany({
            where: inArray(
                db.select({ id: schema.specifications.id }).from(schema.specifications).where(eq(schema.specifications.projectId, projectId)),
                db.select({ specId: schema.plans.specId }).from(schema.plans)
            ),
        });

        // Let's use a simpler query to find the next task scoped to the project
        // First get all specs for this project
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

        // Get next todo task scoped to this project
        let nextTask = null;
        if (projectPlanIds.length > 0) {
            nextTask = await db.query.tasks.findFirst({
                where: and(
                    eq(tasks.status, 'todo'),
                    inArray(tasks.planId, projectPlanIds)
                ),
            });
        }

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
