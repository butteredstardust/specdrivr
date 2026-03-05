import { getProjects, getTasksDoneToday } from '@/lib/actions';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { DashboardSummaryCard } from '@/components/project-card';
import { DashboardProjectList } from '@/components/dashboard-project-list';
import { BottomTabs } from '@/components/bottom-tabs';

export default async function Home() {
  const result = await getProjects();

  let projects: any[] = [];
  if (result.success && result.projects) {
    projects = result.projects;
  }

  const totalProjects = projects.length;
  const agentsRunning = projects.filter((p: any) => p.agentStatus === 'running').length;
  const tasksDoneToday = await getTasksDoneToday();

  return (
    <div className="flex h-screen w-full bg-bg-primary overflow-hidden text-text-primary">
      <aside className="hidden md:flex flex-col h-full shrink-0">
        <ProjectSidebarWrapper projects={projects} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full bg-bg-primary">
        <header className="h-[48px] border-b border-border-subtle flex items-center justify-between px-[24px] shrink-0 bg-bg-primary">
          <div className="text-[13px] font-semibold text-text-primary">
            Dashboard
          </div>
          <div className="flex items-center gap-[8px]"></div>
        </header>

        <div className="flex-1 overflow-y-auto p-[24px]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-text-secondary mt-0.5">Overview of all your projects</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-[16px] mb-8">
              <DashboardSummaryCard
                value={totalProjects}
                label="Projects"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                  </svg>
                }
              />
              <DashboardSummaryCard
                value={agentsRunning}
                label="Agents Running"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                }
              />
              <DashboardSummaryCard
                value={tasksDoneToday}
                label="Tasks Done Today"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                }
              />
            </div>

            <DashboardProjectList projects={projects} />
          </div>
        </div>
      </main>

      <BottomTabs />
    </div>
  );
}
