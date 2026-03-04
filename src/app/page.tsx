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

  // Fetch real tasks from the database (Project ID 1 has the spec-drivr implementation tasks)
  try {
    const projectContext = await getProjectContext(1);
    tasks = projectContext.tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    tasks = [];
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
      <header className="sticky top-0 z-50 bg-[rgba(255,255,255,0.8)] dark:bg-[rgba(28,28,30,0.8)] backdrop-blur-md border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]">
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
        <ProjectSidebarWrapper
          projects={projects}
        />

        <main className="flex-1 overflow-y-auto bg-[#F2F2F7] dark:bg-black">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* iOS-style Large Title */}
            <div className="mb-8">
              <h1 className="text-[34px] font-bold text-black dark:text-white mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif' }}>
                Dashboard
              </h1>
              <p className="text-[17px] text-[#3C3C43] dark:text-[#AEAEB2]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                Spec-Drivr Implementation Dashboard
              </p>
            </div>

            {/* Info Card */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[12px] overflow-hidden shadow-sm border border-[#C6C6C829] dark:border-[#38383A52] mb-6">
              <div className="px-4 py-[13px]">
                <p className="text-[17px] text-[#3C3C43] dark:text-[#EBEBF5]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
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
