import { getProjectById } from '@/lib/actions';
import { KanbanBoard } from '@/components/kanban-board';
import { SpecificationViewer } from '@/components/specification-viewer';
import { TestResultsPanel } from '@/components/test-results-panel';
import { AgentLogs } from '@/components/agent-logs';
import { notFound } from 'next/navigation';

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

  const result = await getProjectById(projectId);

  if (!result.success || !result.context) {
    return notFound();
  }

  const { project, specification, plan, tasks } = result.context;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Project Constitution */}
        {project.constitution && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Constitution</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-700 whitespace-pre-wrap">{project.constitution}</p>
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {project.techStack && Object.keys(project.techStack).length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Tech Stack</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap gap-2">
                {Object.entries(project.techStack).map(([key, value]) => (
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
            <SpecificationViewer specification={specification} />
          </div>
        )}

        {/* Tasks Kanban Board */}
        {tasks && tasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Tasks</h2>
            <KanbanBoard tasks={tasks} />
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
    </div>
  );
}
