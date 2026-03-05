'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { AgentStatusPanel, type AgentStatusData } from './agent-status-panel';
import { AgentButtons } from './agent-buttons';
import { Tabs, type TabData } from './ui/tabs';
import { useAgentActions } from '@/hooks/use-agent-status';
import type { AgentStatus as AgentStatusType } from '@/lib/ios-styles';

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
      case 'start':
        result = await start();
        break;
      case 'pause':
        result = await pause();
        break;
      case 'stop':
        result = await stop();
        break;
      case 'retry':
        result = await retry();
        break;
    }

    if (result.success && onAgentStatusChange) {
      onAgentStatusChange(agentStatus.status);
    }

    // Trigger refresh of all data
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleRefresh = () => {
    setRefreshTime(new Date());
    onRefresh?.();
  };

  // Format relative time for last synced
  const formatLastSynced = () => {
    const now = new Date();
    const diffMs = now.getTime() - refreshTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Breadcrumb Bar */}
      <div className="px-6 py-3 border-b border-border-default bg-bg-elevated linear-scrollbar overflow-x-auto">
        <Link
          href="/"
          className="text-[13px] font-medium text-accent hover:text-accent-dark transition-colors inline-flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboard
        </Link>
        <span className="text-[13px] font-medium text-text-secondary"> / </span>
        <span className="text-[13px] font-medium text-text-primary font-medium">{projectName}</span>
      </div>

      {/* Project Header */}
      <div className="px-6 py-4 border-b border-border-default bg-bg-elevated">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Left side - Project info and agent status */}
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold text-text-primary ">
              {projectName}
            </h1>

            {/* Tech Stack */}
            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {techStack.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="ios-badge bg-ios-secondary text-text-secondary border border-border-default"
                  >
                    {tech}
                  </span>
                ))}
                {techStack.length > 4 && (
                  <span className="text-[11px] text-text-secondary">
                    +{techStack.length - 4} more
                  </span>
                )}
              </div>
            )}

            {/* Base Path */}
            {basePath && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-text-secondary">Path:</span>
                <code
                  className="text-[11px] bg-ios-secondary px-2 py-0.5 rounded  text-text-secondary truncate max-w-md block"
                  title={basePath}
                >
                  {basePath}
                </code>
              </div>
            )}

            {/* Agent Status */}
            <div className="mt-3">
              <AgentStatusPanel agentStatus={agentStatus} />
            </div>
          </div>

          {/* Right side - Agent controls */}
          <div className="flex flex-col items-end gap-3">
            {/* Agent Buttons */}
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

            {/* Refresh button */}
            <Button
              variant="secondary"
              size="small"
              onClick={handleRefresh}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              }
            >
              {formatLastSynced()}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-bg-elevated border-b border-border-default">
        <Tabs tabs={tabs} />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto linear-scrollbar bg-bg-primary">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Simple header-only version for use without full tab layout
export interface ProjectHeaderProps {
  projectName: string;
  techStack?: string[];
  basePath?: string;
  lastSynced?: string;
}

export function ProjectHeader({ projectName, techStack, basePath, lastSynced }: ProjectHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-border-default bg-bg-elevated">
      <div className="flex flex-col gap-3">
        <h1 className="text-[20px] font-semibold text-text-primary ">
          {projectName}
        </h1>

        {techStack && techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {techStack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="ios-badge bg-ios-secondary text-text-secondary border border-border-default"
              >
                {tech}
              </span>
            ))}
            {techStack.length > 4 && (
              <span className="text-[11px] text-text-secondary">
                +{techStack.length - 4} more
              </span>
            )}
          </div>
        )}

        {basePath && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-secondary">Path:</span>
            <code
              className="text-[11px] bg-ios-secondary px-2 py-0.5 rounded  text-text-secondary truncate max-w-md block"
            >
              {basePath}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
