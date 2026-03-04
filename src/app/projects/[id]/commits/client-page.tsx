'use client';

import { ProjectSelect } from '@/db/schema';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import type { TabData } from '@/components/ui/tabs';

interface ProjectCommitsClientProps {
  projectId: number;
  project: ProjectSelect;
  projects: ProjectSelect[];
}

export function ProjectCommitsClient({
  projectId,
  project,
  projects,
}: ProjectCommitsClientProps) {
  const tabs: TabData[] = [
    {
      id: 'kanban',
      label: 'Kanban',
      href: `/projects/${projectId}`,
    },
    {
      id: 'spec',
      label: 'Spec',
      href: `/projects/${projectId}?tab=spec`,
    },
    {
      id: 'plan',
      label: 'Plan',
      href: `/projects/${projectId}?tab=plan`,
    },
    {
      id: 'logs',
      label: 'Logs',
      href: `/projects/${projectId}?tab=logs`,
    },
    {
      id: 'commits',
      label: 'Commits',
      href: `/projects/${projectId}/commits`,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: `/projects/${projectId}/settings`,
    },
  ];

  return (
    <div className="min-h-screen bg-ios-bg-primary ios-font-text">
      {/* Header */}
      <header className="sticky top-0 z-30 ios-header border-b border-ios-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <a
                  href="/"
                  className="ios-callout text-ios-blue hover:text-ios-blue-dark transition-colors"
                >
                  ← Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 border-r border-ios-border bg-ios-bg-card ios-scrollbar overflow-y-auto">
          <ProjectSidebarWrapper
            projects={projects}
            currentProjectId={projectId}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto ios-scrollbar bg-ios-bg-primary">
          {/* Project Title Section */}
          <div className="px-6 py-4 bg-ios-bg-card border-b border-ios-border">
            <h1 className="ios-title-1 text-ios-text-primary ios-font-display">
              Commits
            </h1>
            <p className="ios-body text-ios-text-secondary mt-1">
              {project.name}
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-ios-border bg-ios-bg-card sticky top-0 z-10">
            <nav className="flex space-x-0 ios-scrollbar overflow-x-auto max-w-6xl mx-auto">
              {tabs.map((tab) => (
                <a
                  key={tab.id}
                  href={tab.href}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 ios-body font-medium transition-colors whitespace-nowrap
                    ${tab.id === 'commits'
                      ? 'text-ios-blue border-b-2 border-ios-blue'
                      : 'text-ios-text-secondary hover:text-ios-text-primary border-b-2 border-transparent'
                    }
                  `}
                >
                  {tab.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Commits Content */}
          <div className="px-6 py-6">
            <div className="max-w-4xl">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <select className="ios-select ios-caption-1">
                    <option value="all">All Branches</option>
                    <option value="main">main</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <select className="ios-select ios-caption-1">
                    <option value="all">All Plans</option>
                  </select>
                </div>
              </div>

              {/* Empty State - Git not configured */}
              <div className="ios-card p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-ios-placeholder"
                  >
                    <line x1="6" y1="3" x2="6" y2="15" />
                    <circle cx="18" cy="6" r="3" />
                    <path d="M6 9a9 9 0 0 1 9 9" />
                  </svg>
                </div>
                <h3 className="ios-title-3 text-ios-text-primary mb-2 ios-font-display">
                  Git integration not configured
                </h3>
                <p className="ios-body text-ios-text-secondary mb-4">
                  Connect a repository to track commits generated by the agent.
                </p>
                <a
                  href={`/projects/${projectId}/settings`}
                  className="inline-flex items-center gap-2 text-ios-blue hover:text-ios-blue-dark ios-body font-medium"
                >
                  Configure Git →
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
