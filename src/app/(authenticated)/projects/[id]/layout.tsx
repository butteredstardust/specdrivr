import { ReactNode } from 'react';
import { getProjectById, getProjectTestResults, getProjectAgentLogs } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { ProjectLayoutClient } from './project-layout-client';

export default async function ProjectLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: { id: string };
}) {
    const projectId = parseInt(params.id, 10);
    if (isNaN(projectId)) return notFound();

    const result = await getProjectById(projectId);
    if (!result.success || !result.context) return notFound();

    const { project } = result.context;

    const [testResultsRes, agentLogsRes] = await Promise.all([
        getProjectTestResults(projectId),
        getProjectAgentLogs(projectId)
    ]);

    return (
        <ProjectLayoutClient
            projectId={projectId}
            project={project}
            testResultsCount={testResultsRes.success && testResultsRes.testResults ? testResultsRes.testResults.length : 0}
            agentLogsCount={agentLogsRes.success && agentLogsRes.logs ? agentLogsRes.logs.length : 0}
        >
            {children}
        </ProjectLayoutClient>
    );
}
