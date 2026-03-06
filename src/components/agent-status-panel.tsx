'use client';

import { agentStatusLabels, formatRelativeTime, formatDuration, type AgentStatus } from '@/lib/ios-styles';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface AgentStatusData {
  status: AgentStatus;
  currentTask?: { id: number; description: string };
  uptimeSeconds?: number;
  lastHeartbeat?: string;
  errorCount?: number;
}

export interface AgentStatusPanelProps {
  agentStatus: AgentStatusData;
  className?: string;
}

const statusBadgeClasses: Record<AgentStatus, string> = {
  running: 'bg-[var(--status-inprogress-bg)] text-[var(--status-inprogress-text)]',
  paused: 'bg-[var(--status-paused-bg)] text-[var(--status-paused-text)]',
  stopped: 'bg-[var(--status-todo-bg)] text-[var(--status-todo-text)]',
  idle: 'bg-[var(--status-todo-bg)] text-[var(--status-todo-text)]',
  error: 'bg-[var(--status-blocked-bg)] text-[var(--status-blocked-text)]',
  stale: 'bg-[var(--status-todo-bg)] text-[var(--status-todo-text)] border border-[var(--border-default)]',
};

export function AgentStatusPanel({ agentStatus, className = '' }: AgentStatusPanelProps) {
  const {
    status,
    currentTask,
    uptimeSeconds,
    lastHeartbeat,
    errorCount = 0,
  } = agentStatus;

  const badgeClass = statusBadgeClasses[status] || statusBadgeClasses.idle;
  const isStale = status === 'stale';

  let uptimeText = '';
  if (uptimeSeconds) {
    uptimeText = formatDuration(uptimeSeconds * 1000);
  } else if (lastHeartbeat) {
    uptimeText = formatRelativeTime(lastHeartbeat);
  }

  return (
    <div className={cn("flex items-center flex-wrap gap-[var(--sp-2)] text-[12px]", className)}>
      <span className={cn(
        "px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-bold uppercase tracking-wide shrink-0",
        badgeClass
      )}>
        {agentStatusLabels[status]}
      </span>

      {(uptimeSeconds || lastHeartbeat) && (
        <span className="text-[var(--text-tertiary)] ml-1">
          {uptimeText}
        </span>
      )}

      {currentTask && (
        <span className="text-[var(--text-tertiary)] px-2 py-0.5 bg-[var(--bg-sunken)] rounded-[var(--radius-sm)] border border-[var(--border-default)] text-[11px]" title={currentTask.description}>
          Task #{currentTask.id}
        </span>
      )}

      {status === 'error' && errorCount > 0 && (
        <span className="text-[var(--status-blocked-text)] font-medium flex items-center gap-1">
          <AlertCircle size={12} />
          {errorCount} error{errorCount > 1 ? 's' : ''}
        </span>
      )}

      {isStale && lastHeartbeat && (
        <span className="flex items-center gap-[4px] text-[var(--status-paused-text)] text-[11px]">
          Last seen {formatRelativeTime(lastHeartbeat)}
        </span>
      )}
    </div>
  );
}

export function CompactAgentStatus({ status }: { status: AgentStatus }) {
  const badgeClass = statusBadgeClasses[status] || statusBadgeClasses.idle;
  return (
    <span className={cn(
      "px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold uppercase tracking-wide",
      badgeClass
    )}>
      {status === 'running' ? 'Running' : agentStatusLabels[status]}
    </span>
  );
}
