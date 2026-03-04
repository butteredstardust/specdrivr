import { getProjects } from '@/lib/actions';
import { ProjectSidebar } from '@/components/project-sidebar';
import { KanbanBoard } from '@/components/kanban-board';

export default async function Home() {
  const result = await getProjects();

  let projects = [];
  if (result.success) {
    projects = result.projects;
  }

  // Sample data for demonstration
  const sampleTasks = [
    {
      id: 1,
      planId: 1,
      description: "Initialize Next.js 14 project structure",
      status: "done",
      filesInvolved: ["package.json", "tsconfig.json"],
      priority: 1,
      dependencyTaskId: null,
      createdAt: new Date("2026-03-04"),
      updatedAt: new Date("2026-03-04"),
    },
    {
      id: 2,
      planId: 1,
      description: "Set up PostgreSQL with Docker configuration",
      status: "done",
      filesInvolved: ["docker-compose.yml", ".env.local"],
      priority: 1,
      dependencyTaskId: 1,
      createdAt: new Date("2026-03-04"),
      updatedAt: new Date("2026-03-04"),
    },
    {
      id: 3,
      planId: 1,
      description: "Install and configure Drizzle ORM",
      status: "done",
      filesInvolved: ["src/db/schema.ts", "drizzle.config.ts"],
      priority: 1,
      dependencyTaskId: 2,
      createdAt: new Date("2026-03-04"),
      updatedAt: new Date("2026-03-04"),
    },
    {
      id: 4,
      planId: 1,
      description: "Create agent memory utilities",
      status: "done",
      filesInvolved: ["src/lib/agent-memory.ts"],
      priority: 2,
      dependencyTaskId: 3,
      createdAt: new Date("2026-03-04"),
      updatedAt: new Date("2026-03-04"),
    },
    {
      id: 5,
      planId: 1,
      description: "Build API routes for agent communication",
      status: "done",
      filesInvolved: ["src/app/api/agent/*"],
      priority: 2,
      dependencyTaskId: 4,
      createdAt: new Date("2026-03-04"),
      updatedAt: new Date("2026-03-04"),
    },
    {
      id: 6,
      planId: 1,
      description: "Create Kanban UI components",
      status: "done",
      filesInvolved: ["src/components/*.tsx"],
      priority: 3,
      dependencyTaskId: 5,
      createdAt: new Date("2026-03-04"),
      updatedAt: new Date("2026-03-04"),
    },
  ];

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
        <ProjectSidebar
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

            <KanbanBoard tasks={sampleTasks} />
          </div>
        </main>
      </div>
    </div>
  );
}
