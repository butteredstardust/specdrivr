'use client';

import { useState } from 'react';
import { ProjectSelect, SpecificationSelect, PlanSelect, TaskSelect, TestResultSelect, AgentLogSelect } from '@/db/schema';
import { InlineConstitutionEditor } from '@/components/inline-constitution-editor';
import { InlineTechStackEditor } from '@/components/inline-tech-stack-editor';
import { InlinePlanEditor } from '@/components/inline-plan-editor';
import { InlineSpecEditor } from '@/components/inline-spec-editor';
import { KanbanBoard } from '@/components/kanban-board';
import { ActionBar } from '@/components/action-bar';
import { TestResultsPanel } from '@/components/test-results-panel';
import { AgentLogs } from '@/components/agent-logs';
import { AgentStatusPanel, type AgentStatusData } from '@/components/agent-status-panel';
import { WaveManager } from '@/components/wave-manager';
import { type TabData } from '@/components/ui/tabs';
import { useAgentStatus } from '@/hooks/use-agent-status';
import Link from 'next/link';

interface ProjectDetailClientProps {
  projectId: number;
  project: ProjectSelect;
  specification: SpecificationSelect | null;
  plans: PlanSelect[];
  allSpecs: SpecificationSelect[];
  tasks: TaskSelect[];
  projects: ProjectSelect[];
  hasActivePlan: boolean;
  testResults?: TestResultSelect[];
  agentLogs?: AgentLogSelect[];
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
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-tertiary)]">No specification yet</p>
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
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-tertiary)]">No plans yet</p>
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

function LogsTabContent({ logs, tasks, projectId }: { logs: AgentLogSelect[]; tasks: TaskSelect[]; projectId: number }) {
  return (
    <AgentLogs
      logs={logs}
      tasks={tasks}
      projectId={projectId}
      onLogAdded={() => { }}
    />
  );
}

function TestResultsTabContent({ testResults }: { testResults: TestResultSelect[] }) {
  return (
    <TestResultsPanel testResults={testResults} />
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
  testResults = [],
  agentLogs = [],
}: ProjectDetailClientProps) {
  const [activeTabId, setActiveTabId] = useState('kanban');
  const { data: agentStatus } = useAgentStatus({ projectId });

  // Extract tech stack as array
  const techStack = Array.isArray(project.techStack)
    ? (project.techStack as string[])
    : typeof project.techStack === 'string'
      ? [project.techStack]
      : [];

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
      id: 'wave',
      label: 'Wave Execution',
      href: `/projects/${projectId}?tab=wave`,
    },
    {
      id: 'commits',
      label: 'Commits',
      href: `/projects/${projectId}/commits`,
    },
    {
      id: 'test-results',
      label: 'Test Results',
      href: `/projects/${projectId}?tab=test-results`,
      badge: testResults.length > 0 ? testResults.length : undefined,
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

  const renderTabContent = () => {
    switch (activeTabId) {
      case 'kanban':
        return <KanbanTabContent projectId={projectId} plans={plans} tasks={tasks} />;
      case 'spec':
        return <SpecTabContent specification={specification} allSpecs={allSpecs} />;
      case 'plan':
        return <PlanTabContent specification={specification} plans={plans} />;
      case 'wave':
        return <WaveManager projectId={projectId} />;
      case 'logs':
        return <LogsTabContent logs={agentLogs} tasks={tasks} projectId={projectId} />;
      case 'test-results':
        return <TestResultsTabContent testResults={testResults} />;
      default:
        return <KanbanTabContent projectId={projectId} plans={plans} tasks={tasks} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="mb-6">
        <div className="text-[12px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Project</div>
        <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">{project.name}</h1>
      </div>

      <div className="flex-1 bg-[var(--color-bg-page)]">
        {/* Tabs */}
        <div className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] sticky top-[-24px] z-10 mx-[-24px] px-[var(--sp-6)]">
          <nav className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => {
              // Route-based tabs (separate pages) must use <a>, not button
              const isRouteBased = tab.href && !tab.href.includes('?tab=') && tab.href !== `/projects/${projectId}`;
              const isActive = activeTabId === tab.id;
              const sharedClass = `relative flex items-center gap-[var(--sp-2)] h-[40px] px-[var(--sp-3)] text-[var(--font-size-sm)] font-medium transition-colors whitespace-nowrap mb-[-1px] ${isActive
                ? 'text-[var(--color-brand-bold)] border-b-2 border-[var(--color-brand-bold)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-b-2 border-transparent'
                }`;
              const badge = tab.badge && (
                <span
                  className={`min-w-[16px] h-[16px] px-[var(--sp-1)] rounded-full text-[10px] flex items-center justify-center font-bold ${isActive ? 'bg-[var(--color-brand-bold)] text-white' : 'bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)]'
                    }`}
                >
                  {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
                </span>
              );
              if (isRouteBased) {
                return (
                  <a key={tab.id} href={tab.href} className={sharedClass}>
                    {tab.label}
                    {badge}
                  </a>
                );
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={sharedClass}
                >
                  {tab.label}
                  {badge}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-[var(--sp-6)]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
