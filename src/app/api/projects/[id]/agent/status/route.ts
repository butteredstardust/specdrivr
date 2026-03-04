import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, tasks, agentLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        // Get recent logs
        const recentLogs = await db.query.agentLogs.findMany({
            where: (l) => eq(l.projectId, projectId),
            limit: 10,
        });

        // Calculate uptime
        const uptimeSeconds = project.agentStartedAt
            ? Math.floor(
                (Date.now() - project.agentStartedAt.getTime()) / 1000
            )
            : 0;

        // Count errors in recent logs
        const errorCount = recentLogs.filter((log) => log.level === 'error').length;

        return NextResponse.json({
            success: true,
            status: project.agentStatus,
            project_id: projectId,
            current_task_id: currentTask?.id,
            current_task_description: currentTask?.description,
            started_at: project.agentStartedAt,
            stopped_at: project.agentStoppedAt,
            uptime_seconds: uptimeSeconds,
            last_update: recentLogs[0]?.timestamp,
            error_count: errorCount,
            recent_logs: recentLogs.map((log) => ({
                id: log.id,
                timestamp: log.timestamp,
                level: log.level,
                message: log.message,
                task_id: log.taskId,
            })),
        });
    } catch (error) {
        console.error('Agent status error:', error);
        return NextResponse.json(
            { error: 'Failed to get agent status' },
            { status: 500 }
        );
    }
}
