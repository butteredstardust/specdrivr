import { getProjects } from '@/lib/actions';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { Logo } from '@/components/logo';
import { DatabaseStatus } from '@/components/database-status';
import { UserMenu } from '@/components/user-menu';
import { CreateProjectDialog } from '@/components/create-project-dialog';
import { ProjectCard, DashboardEmptyState, DashboardSummaryCard } from '@/components/project-card';
import { BottomTabs } from '@/components/bottom-tabs';

export default async function Home() {
  const result = await getProjects();

  let projects: any[] = [];
  if (result.success && result.projects) {
    projects = result.projects;
  }

  // Calculate summary stats
  const totalProjects = projects.length;
  const agentsRunning = projects.filter((p: any) => p.agentStatus === 'running').length;
  // For tasks done today, we would need to query the database
  // For now, using a placeholder
  const tasksDoneToday = 0;

  return (
    <div className="min-h-screen bg-ios-bg-primary ios-font-text">
      {/* Header */}
      <header className="sticky top-0 z-30 ios-header border-b border-ios-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
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

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-57px)] pb-20 md:pb-0">
        {/* Sidebar (hidden on mobile) */}
        <aside className="hidden md:flex w-60 flex-shrink-0 border-r border-ios-border bg-ios-bg-card ios-scrollbar overflow-y-auto">
          <ProjectSidebarWrapper projects={projects} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto ios-scrollbar bg-ios-bg-primary">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="ios-title-1 text-ios-text-primary ios-font-display">
                  Dashboard
                </h1>
                <p className="ios-body text-ios-text-secondary mt-1">
                  Overview of all your projects
                </p>
              </div>
              <CreateProjectDialog />
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <DashboardSummaryCard
                value={totalProjects}
                label="Projects"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                }
              />
              <DashboardSummaryCard
                value={agentsRunning}
                label="Agents Running"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                }
              />
              <DashboardSummaryCard
                value={tasksDoneToday}
                label="Tasks Done Today"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 11.08 15 15.01 9 12.01" />
                    <polyline points="22 4 12 14.01 9 12.01" />
                    <path d="M2 11.08V12a10 10 0 1 1 5.93-9.14" />
                  </svg>
                }
              />
            </div>

            {/* Projects Section */}
            {projects.length > 0 ? (
              <>
                {/* Search Bar */}
                <div className="mb-4">
                  <input
                    type="search"
                    placeholder="Search projects..."
                    className="ios-input ios-subheadline"
                  />
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </>
            ) : (
              <DashboardEmptyState />
            )}
          </div>
        </main>
      </div>

      {/* Bottom Tabs (mobile only) */}
      <BottomTabs />
    </div>
  );
}
