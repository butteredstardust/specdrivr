import { getProjects } from '@/lib/actions';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { KanbanBoard } from '@/components/kanban-board';
import { getProjectContext } from '@/lib/agent-memory';

export default async function Home() {
  const result = await getProjects();

  let projects = [];
  let tasks = [];
  if (result.success) {
    projects = result.projects;
  }

  // Fetch real tasks from the database (Project ID 1 has the spec-drivr implementation tasks)
  try {
    const projectContext = await getProjectContext(1);
    tasks = projectContext.tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    tasks = [];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Spec-Drivr</h1>
              <p className="text-sm text-gray-500">AI Agent Development Platform</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Status: <span className="text-green-600 font-medium">Operational</span>
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
          <div className="max-w-full mx-auto">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Spec-Drivr Implementation Dashboard</h2>
              <p className="text-sm text-gray-600">
                This Kanban board shows the actual tasks implemented during the build process
              </p>
            </div>

            <KanbanBoard tasks={tasks} />
          </div>
        </main>
      </div>
    </div>
  );
}
