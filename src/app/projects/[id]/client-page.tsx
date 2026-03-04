'use client';

import { useState } from 'react';
import { ProjectSelect, SpecificationSelect, PlanSelect, TaskSelect } from '@/db/schema';
import { InlineConstitutionEditor } from '@/components/inline-constitution-editor';
import { InlineTechStackEditor } from '@/components/inline-tech-stack-editor';
import { InlinePlanEditor } from '@/components/inline-plan-editor';
import { InlineSpecEditor } from '@/components/inline-spec-editor';
import { KanbanBoard } from '@/components/kanban-board';
import { ActionBar } from '@/components/action-bar';
import { TestResultsPanel } from '@/components/test-results-panel';
import { AgentLogs } from '@/components/agent-logs';
import { AgentStatusPanel, type AgentStatusData } from '@/components/agent-status-panel';
import { type TabData } from '@/components/ui/tabs';
import { useAgentStatus } from '@/hooks/use-agent-status';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';

interface ProjectDetailClientProps {
  projectId: number;
  project: ProjectSelect;
  specification: SpecificationSelect | null;
  plans: PlanSelect[];
  allSpecs: SpecificationSelect[];
  tasks: TaskSelect[];
  projects: ProjectSelect[];
  hasActivePlan: boolean;
}

// Tab content components
function KanbanTabContent({ projectId, plans, tasks }: { projectId: number; plans: PlanSelect[]; tasks: TaskSelect[] }) {
  return (
    <div>
      <ActionBar
        projectId={projectId}
        plans={plans}
        existingTasks={tasks}
      />
      <KanbanBoard
        projectId={projectId}
        plans={plans}
        tasks={tasks}
      />
    </div>
  );
}

function SpecTabContent({ specification, allSpecs }: { specification: SpecificationSelect | null; allSpecs: SpecificationSelect[] }) {
  if (!specification) {
    return (
      <div className="text-center py-12">
        <p className="ios-body text-ios-placeholder ios-font-text">No specification yet</p>
      </div>
    );
  }
  return (
    <InlineSpecEditor
      specification={specification}
      allSpecs={allSpecs}
    />
  );
}

function PlanTabContent({ specification, plans }: { specification: SpecificationSelect | null; plans: PlanSelect[] }) {
  if (!specification || plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="ios-body text-ios-placeholder ios-font-text">No plans yet</p>
      </div>
    );
  }
  return (
    <InlinePlanEditor
      specId={specification.id}
      plans={plans}
    />
  );
}

function LogsTabContent({ logs, tasks, projectId }: { logs: any[]; tasks: TaskSelect[]; projectId: number }) {
  return (
    <AgentLogs
      logs={logs}
      tasks={tasks}
      projectId={projectId}
      onLogAdded={() => {}}
    />
  );
}

export function ProjectDetailClient({
  projectId,
  project,
  specification,
  plans,
  allSpecs,
  tasks,
  projects,
  hasActivePlan,
}: ProjectDetailClientProps) {
  const [activeTabId, setActiveTabId] = useState('kanban');
  const { data: agentStatus } = useAgentStatus({ projectId });

  // Extract tech stack as array
  const techStack = Array.isArray(project.techStack)
    ? (project.techStack as string[])
    : typeof project.techStack === 'string'
    ? [project.techStack]
    : [];

  // Fetch test results and logs - in a real app these would be server-side
  // For now, we'll pass empty arrays
  const testResults: any[] = [];
  const agentLogs: any[] = [];

  // Create tabs configuration
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
      id: 'commits',
      label: 'Commits',
      href: `/projects/${projectId}/commits`,
    },
    {
      id: 'logs',
      label: 'Logs',
      href: `/projects/${projectId}?tab=logs`,
      badge: agentLogs.length > 0 ? agentLogs.length : undefined,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: `/projects/${projectId}/settings`,
    },
  ];

  const statusData: AgentStatusData = agentStatus || {
    status: 'idle',
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTabId) {
      case 'kanban':
        return <KanbanTabContent projectId={projectId} plans={plans} tasks={tasks} />;
      case 'spec':
        return <SpecTabContent specification={specification} allSpecs={allSpecs} />;
      case 'plan':
        return <PlanTabContent specification={specification} plans={plans} />;
      case 'logs':
        return <LogsTabContent logs={agentLogs} tasks={tasks} projectId={projectId} />;
      default:
        return <KanbanTabContent projectId={projectId} plans={plans} tasks={tasks} />;
    }
  };

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
            <div className="flex items-center gap-3">
              {/* Agent Status Panel */}
              <AgentStatusPanel agentStatus={statusData} />
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
            <div className="max-w-6xl">
              <h1 className="ios-title-1 text-ios-text-primary ios-font-display">
                {project.name}
              </h1>
              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {techStack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="ios-badge bg-ios-secondary ios-text-secondary border border-ios-border"
                    >
                      {tech}
                    </span>
                  ))}
                  {techStack.length > 4 && (
                    <span className="ios-caption-1 text-ios-text-secondary">
                      +{techStack.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Edit Section (Constitution, Tech Stack) */}
          <div className="max-w-6xl mx-auto px-6 py-4 space-y-4">
            <div>
              <h3 className="ios-footnote ios-placeholder mb-2 uppercase tracking-wide">
                Constitution
              </h3>
              <InlineConstitutionEditor
                projectId={projectId}
                constitution={project.constitution as string | null}
              />
            </div>

            <div>
              <h3 className="ios-footnote ios-placeholder mb-2 uppercase tracking-wide">
                Tech Stack
              </h3>
              <InlineTechStackEditor
                projectId={projectId}
                techStack={project.techStack as Record<string, unknown> || {}}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-ios-border bg-ios-bg-card sticky top-0 z-10">
            <nav className="flex space-x-0 ios-scrollbar overflow-x-auto max-w-6xl mx-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 ios-body font-medium transition-colors whitespace-nowrap
                    ${activeTabId === tab.id
                      ? 'text-ios-blue border-b-2 border-ios-blue'
                      : 'text-ios-text-secondary hover:text-ios-text-primary border-b-2 border-transparent'
                    }
                  `}
                >
                  {tab.label}
                  {tab.badge && (
                    <span
                      className={`
                        ios-badge px-2 py-0.5 rounded-full text-[11px]
                        ${activeTabId === tab.id
                          ? 'bg-ios-blue text-white'
                          : 'bg-ios-gray-5 text-ios-text-secondary'
                        }
                      `}
                    >
                      {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-4">
            <div className="max-w-6xl">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
