'use client';

import { agentStatusLabels, formatRelativeTime, formatDuration, type AgentStatus } from '@/lib/ios-styles';

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

const statusBadgeStyles: Record<AgentStatus, { color: string; dot: string }> = {
  running: { color: 'text-text-primary', dot: 'bg-status-success' },
  paused: { color: 'text-text-secondary', dot: 'bg-status-warning' },
  stopped: { color: 'text-text-secondary', dot: 'bg-status-idle' },
  idle: { color: 'text-text-secondary', dot: 'bg-status-idle' },
  error: { color: 'text-status-error', dot: 'bg-status-error' },
  stale: { color: 'text-status-warning', dot: 'bg-status-warning' },
};

export function AgentStatusPanel({ agentStatus, className = '' }: AgentStatusPanelProps) {
  const {
    status,
    currentTask,
    uptimeSeconds,
    lastHeartbeat,
    errorCount = 0,
  } = agentStatus;

  const badge = statusBadgeStyles[status] || statusBadgeStyles.idle;
  const isStale = status === 'stale';

  let uptimeText = '';
  if (uptimeSeconds) {
    uptimeText = `· ${formatDuration(uptimeSeconds * 1000)}`;
  } else if (lastHeartbeat) {
    uptimeText = `· Last heartbeat ${formatRelativeTime(lastHeartbeat)}`;
  }

  return (
    <div className={`flex items-center gap-[8px] text-[12px] ${badge.color} ${className}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`} />

      <span className="font-medium">
        {agentStatusLabels[status]}
      </span>

      {(uptimeSeconds || lastHeartbeat) && (
        <span className="text-text-tertiary">
          {uptimeText}
        </span>
      )}

      {currentTask && (
        <span className="text-text-tertiary" title={currentTask.description}>
          · Task #{currentTask.id}
        </span>
      )}

      {status === 'error' && errorCount > 0 && (
        <span className="text-status-error font-medium">
          · {errorCount} error{errorCount > 1 ? 's' : ''}
        </span>
      )}

      {isStale && lastHeartbeat && (
        <span className="flex items-center gap-[4px] text-status-warning">
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

export function CompactAgentStatus({ status }: { status: AgentStatus }) {
  const badge = statusBadgeStyles[status] || statusBadgeStyles.idle;

  return (
    <div
      className={`flex items-center gap-[6px] text-[12px] ${badge.color}`}
      title={agentStatusLabels[status]}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`} />
      <span className="capitalize font-medium">{status === 'running' ? 'Running' : status}</span>
    </div>
  );
}
