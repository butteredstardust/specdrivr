'use client';

import { agentStatusLabels, agentStatusColors, formatRelativeTime, formatDuration, type AgentStatus } from '@/lib/ios-styles';

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

export function AgentStatusPanel({ agentStatus, className = '' }: AgentStatusPanelProps) {
  const {
    status,
    currentTask,
    uptimeSeconds,
    lastHeartbeat,
    errorCount = 0,
  } = agentStatus;

  const statusInfo = agentStatusColors[status];
  const isRunning = status === 'running';
  const isStale = status === 'stale';

  // Format uptime if available
  let uptimeText = '';
  if (uptimeSeconds) {
    uptimeText = `· ${formatDuration(uptimeSeconds * 1000)}`;
  } else if (lastHeartbeat) {
    // If we have last heartbeat but not uptime, show relative time
    uptimeText = `· Last heartbeat ${formatRelativeTime(lastHeartbeat)}`;
  }

  return (
    <div className={`flex items-center gap-3 ios-badge ${statusInfo.bg} ${statusInfo.text} ${className}`}>
      {/* Status Dot */}
      <div className={`ios-status-dot ${statusInfo.dot}`} />

      {/* Status Label */}
      <span className="ios-subheadline font-medium">
        {agentStatusLabels[status]}
      </span>

      {/* Uptime or Last Heartbeat */}
      {(uptimeSeconds || lastHeartbeat) && (
        <span className="ios-caption-1 opacity-75">
          {uptimeText}
        </span>
      )}

      {/* Current Task */}
      {currentTask && (
        <span className="ios-caption-1 opacity-75" title={currentTask.description}>
          · Task #{currentTask.id}
        </span>
      )}

      {/* Error Count */}
      {status === 'error' && errorCount > 0 && (
        <span className="bg-red-500/20 text-red-800 dark:bg-red-900/40 dark:text-red-200 px-1.5 py-0.5 rounded text-[11px] font-medium">
          {errorCount} error{errorCount > 1 ? 's' : ''}
        </span>
      )}

      {/* Stale Warning */}
      {isStale && lastHeartbeat && (
        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 ios-caption-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Last seen {formatRelativeTime(lastHeartbeat)}
        </span>
      )}
    </div>
  );
}

// Compact version for sidebar cards
export function CompactAgentStatus({ status }: { status: AgentStatus }) {
  const statusInfo = agentStatusColors[status];

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${statusInfo.bg} ${statusInfo.text}`}
      title={agentStatusLabels[status]}
    >
      <div className={`ios-status-dot ${statusInfo.dot}`} />
      <span className="capitalize">{status === 'running' ? 'Running' : status}</span>
    </div>
  );
}
