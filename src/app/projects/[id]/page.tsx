import { getProjects, getProjectById } from '@/lib/actions';
import { KanbanBoard } from '@/components/kanban-board';
import { SpecificationViewer } from '@/components/specification-viewer';
import { TestResultsPanel } from '@/components/test-results-panel';
import { AgentLogs } from '@/components/agent-logs';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { Logo } from '@/components/logo';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const projectId = parseInt(params.id, 10);

  if (isNaN(projectId)) {
    return notFound();
  }

  // Get all projects for the sidebar
  const projectsResult = await getProjects();
  let projects: any[] = [];
  if (projectsResult.success && projectsResult.projects) {
    projects = projectsResult.projects;
  }

  // Get the specific project data
  const result = await getProjectById(projectId);

  if (!result.success || !result.context) {
    return notFound();
  }

  const { project, specification, plan, tasks: projectTasks } = result.context;

  // Extract and cast values to proper types
  const projectConstitution = project.constitution as string | null;
  const projectTechStack: Record<string, unknown> = (project.techStack as Record<string, unknown>) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Logo size="large" className="min-w-48" />
              {project.basePath && (
                <p className="text-sm text-gray-500 mt-1">{project.basePath}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Status: <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-0">
        <ProjectSidebarWrapper
          projects={projects}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
        {/* Project Constitution */}
        {projectConstitution ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Constitution</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-700 whitespace-pre-wrap">{projectConstitution}</p>
            </div>
          </div>
        ) : null}
        {/* Tech Stack */}
        {projectTechStack && Object.keys(projectTechStack).length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Tech Stack</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap gap-2">
                {Object.entries(projectTechStack).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    <span className="font-medium">{key}:</span>
                    <span className="ml-1">{String(value)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Specification */}
        {specification && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Specification</h2>
            <SpecificationViewer content={specification.content} />
          </div>
        )}

        {/* Tasks Kanban Board */}
        {projectTasks && projectTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Tasks</h2>
            <KanbanBoard tasks={projectTasks} />
          </div>
        )}

        {/* Test Results */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Test Results</h2>
          <TestResultsPanel testResults={[]} />
        </div>

        {/* Agent Logs */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Agent Logs</h2>
          <AgentLogs logs={[]} />
        </div>
      </div>
    </main>
  </div>
</div>
  );
}
