import { getProjects, getTasksDoneToday } from '@/lib/actions';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { Logo } from '@/components/logo';
import { DatabaseStatus } from '@/components/database-status';
import { UserMenu } from '@/components/user-menu';
import { CreateProjectDialog } from '@/components/create-project-dialog';
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
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: app name/logo */}
          <div className="flex items-center gap-3">
            <Logo size="large" className="min-w-36" />
          </div>
          {/* Right: status + avatar — mutually exclusive, rendered by their own components */}
          <div className="flex items-center gap-3">
            <DatabaseStatus />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main body layout */}
      <div className="flex h-[calc(100vh-57px)] pb-16 md:pb-0">
        {/* Sidebar (hidden on mobile) */}
        <aside className="hidden md:block w-56 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <ProjectSidebarWrapper projects={projects} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">

            {/* Page Header row: title left, New Project button right */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">Overview of all your projects</p>
              </div>
              {/* CreateProjectDialog already renders as a proper button */}
              <CreateProjectDialog />
            </div>

            {/* Stat row — 3 cards side by side, always horizontal */}
            <div className="grid grid-cols-3 gap-4 mb-8">
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
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <BottomTabs />
    </div>
  );
}
