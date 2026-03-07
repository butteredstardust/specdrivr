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
import { useAgentStatus } from '@/hooks/use-agent-status';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
        <p className="text-[var(--font-size-sm)] text-[var(--text-tertiary)]">No specification yet</p>
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
        <p className="text-[var(--font-size-sm)] text-[var(--text-tertiary)]">No plans yet</p>
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
  const searchParams = useSearchParams();
  const activeTabId = searchParams.get('tab') || 'kanban';
  const { data: agentStatus } = useAgentStatus({ projectId });

  // Extract tech stack as array
  const techStack = Array.isArray(project.techStack)
    ? (project.techStack as string[])
    : typeof project.techStack === 'string'
      ? [project.techStack]
      : [];

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
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-1 px-[24px] py-[24px] overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  );
}
