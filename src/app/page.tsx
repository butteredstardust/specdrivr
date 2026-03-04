import { getProjects } from '@/lib/actions';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { KanbanBoard } from '@/components/kanban-board';
import { getProjectContext } from '@/lib/agent-memory';
import { Logo } from '@/components/logo';
import { DatabaseStatus } from '@/components/database-status';
import { UserMenu } from '@/components/user-menu';

export default async function Home() {
  const result = await getProjects();

  let projects: any[] = [];
  let tasks: any[] = [];
  if (result.success && result.projects) {
    projects = result.projects;
  }

  try {
    const projectContext = await getProjectContext(1);
    tasks = projectContext.tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    tasks = [];
  }

  return (
    <div className="min-h-screen bg-ios-system">
      <header className="sticky top-0 z-50 ios-header border-b ios">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Logo size="large" className="min-w-40" />
            </div>
            <div className="flex items-center gap-3">
              <DatabaseStatus />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-0">
        <ProjectSidebarWrapper projects={projects} />

        <main className="flex-1 overflow-y-auto bg-ios-system ios-font">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="ios-title-large text-ios-primary mb-2 ios-font-display">
                Dashboard
              </h1>
              <p className="ios-body text-ios-secondary ios-font-text">
                Spec-Drivr Implementation Dashboard
              </p>
            </div>

            <div className="ios-card shadow-sm ios mb-6">
              <div className="px-4 py-[13px]">
                <p className="ios-body text-ios-secondary ios-font-text">
                  This Kanban board shows the actual tasks implemented during the build process.
                </p>
              </div>
            </div>

            <KanbanBoard tasks={tasks} />
          </div>
        </main>
      </div>
    </div>
  );
}
