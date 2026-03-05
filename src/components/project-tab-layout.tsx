'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { AgentStatusPanel, type AgentStatusData } from './agent-status-panel';
import { AgentButtons } from './agent-buttons';
import { Tabs, type TabData } from './ui/tabs';
import { useAgentActions } from '@/hooks/use-agent-status';
import type { AgentStatus as AgentStatusType } from '@/lib/ios-styles';
import { ChevronLeft, RefreshCw } from 'lucide-react';

export interface ProjectTabLayoutProps {
  projectId: number;
  projectName: string;
  techStack?: string[];
  basePath?: string;
  lastSynced?: string;
  agentStatus: AgentStatusData;
  hasActivePlan: boolean;
  tabs: TabData[];
  children: ReactNode;
  onRefresh?: () => void;
  onAgentStatusChange?: (status: AgentStatusType) => void;
}

export function ProjectTabLayout({
  projectId,
  projectName,
  techStack = [],
  basePath,
  lastSynced,
  agentStatus,
  hasActivePlan,
  tabs,
  children,
  onRefresh,
  onAgentStatusChange,
}: ProjectTabLayoutProps) {
  const [refreshTime, setRefreshTime] = useState(lastSynced ? new Date(lastSynced) : new Date());
  const { start, pause, stop, retry, isLoading: actionsLoading } = useAgentActions(projectId);

  const handleAgentAction = async (action: 'start' | 'pause' | 'stop' | 'retry') => {
    let result;
    switch (action) {
      case 'start': result = await start(); break;
      case 'pause': result = await pause(); break;
      case 'stop': result = await stop(); break;
      case 'retry': result = await retry(); break;
    }
    if (result.success && onAgentStatusChange) {
      onAgentStatusChange(agentStatus.status);
    }
    onRefresh?.();
  };

  const handleRefresh = () => {
    setRefreshTime(new Date());
    onRefresh?.();
  };

  const formatLastSynced = () => {
    const now = new Date();
    const diffMs = now.getTime() - refreshTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-[var(--sp-2)] mb-[var(--sp-4)] text-[12px]">
        <Link href="/" className="text-[var(--color-text-link)] hover:underline flex items-center gap-1">
          <ChevronLeft size={14} />
          Dashboard
        </Link>
        <span className="text-[var(--color-text-tertiary)]">/</span>
        <span className="text-[var(--color-text-primary)] font-medium">{projectName}</span>
      </div>

      {/* Header Container */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-[var(--sp-4)] mb-[var(--sp-6)]">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)] mb-[var(--sp-2)]">
            {projectName}
          </h1>

          <div className="flex flex-wrap items-center gap-[var(--sp-3)] text-[11px]">
            {techStack.length > 0 && (
              <div className="flex gap-[var(--sp-1)]">
                {techStack.slice(0, 3).map(tech => (
                  <span key={tech} className="px-2 py-0.5 bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)] rounded-[var(--radius-sm)] border border-[var(--color-border-default)]">
                    {tech}
                  </span>
                ))}
              </div>
            )}
            {basePath && (
              <div className="text-[var(--color-text-tertiary)] flex items-center gap-1">
                <span className="opacity-70">Path:</span>
                <code className="bg-[var(--color-bg-sunken)] px-1 rounded">{basePath}</code>
              </div>
            )}
          </div>

          <div className="mt-[var(--sp-4)]">
            <AgentStatusPanel agentStatus={agentStatus} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-[var(--sp-3)]">
          <AgentButtons
            projectId={projectId}
            status={agentStatus.status}
            hasActivePlan={hasActivePlan}
            onStart={() => handleAgentAction('start')}
            onPause={() => handleAgentAction('pause')}
            onStop={() => handleAgentAction('stop')}
            onRetry={() => handleAgentAction('retry')}
            disabled={actionsLoading !== null}
          />
          <Button
            variant="ghost"
            size="small"
            onClick={handleRefresh}
            className="text-[11px] text-[var(--color-text-tertiary)]"
            icon={<RefreshCw size={12} />}
          >
            {formatLastSynced()}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-[var(--sp-6)]">
        <Tabs tabs={tabs} />
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 bg-[var(--color-bg-surface)] p-[var(--sp-6)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)]">
        {children}
      </div>
    </div>
  );
}

export function ProjectHeader({ projectName, techStack, basePath }: { projectName: string, techStack?: string[], basePath?: string }) {
  return (
    <div className="mb-[var(--sp-4)]">
      <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">{projectName}</h1>
      {basePath && <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1">{basePath}</p>}
    </div>
  );
}
