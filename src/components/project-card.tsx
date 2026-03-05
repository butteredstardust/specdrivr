'use client';

import Link from 'next/link';
import { type ProjectSelect } from '@/db/schema';
import {
  agentStatusLabels,
  formatRelativeTime,
  type AgentStatus,
} from '@/lib/ios-styles';

export interface ProjectCardProps {
  project: ProjectSelect & {
    agentStatus?: AgentStatus;
    taskStats?: {
      total: number;
      done: number;
    };
  };
  hasActivePlan?: boolean;
  activePlanLabel?: string;
}

const statusBadgeStyles: Record<AgentStatus, { color: string; dot: string }> = {
  running: { color: 'text-text-primary', dot: 'bg-status-success' },
  paused: { color: 'text-text-secondary', dot: 'bg-status-warning' },
  stopped: { color: 'text-text-secondary', dot: 'bg-status-idle' },
  idle: { color: 'text-text-secondary', dot: 'bg-status-idle' },
  error: { color: 'text-status-error', dot: 'bg-status-error' },
  stale: { color: 'text-status-warning', dot: 'bg-status-warning' },
};

export function ProjectCard({
  project,
  hasActivePlan = false,
  activePlanLabel,
}: ProjectCardProps) {
  const agentStatus = (project.agentStatus || 'idle') as AgentStatus;
  const badge = statusBadgeStyles[agentStatus] || statusBadgeStyles.idle;

  const totalTasks = project.taskStats?.total || 0;
  const doneTasks = project.taskStats?.done || 0;

  const lastActivity = project.updatedAt
    ? formatRelativeTime(project.updatedAt)
    : 'Never';

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex items-center min-h-[36px] px-[16px] border-b border-border-subtle hover:bg-bg-hover transition-colors last:border-b-0"
    >
      {/* Name */}
      <div className="flex-1 min-w-0 pr-4 flex items-center h-full">
        <span className="text-[13px] font-medium text-text-primary truncate group-hover:text-text-primary">
          {project.name}
        </span>
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="w-[100px] flex items-center justify-end text-[12px] text-text-secondary pr-4 shrink-0">
          <span>{doneTasks}/{totalTasks} tasks</span>
        </div>
      )}

      {/* Status Dot */}
      <div className={`w-[130px] flex items-center gap-[6px] text-[12px] shrink-0 ${badge.color}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${badge.dot}`} />
        <span>{agentStatusLabels[agentStatus]}</span>
      </div>

      {/* Last Activity */}
      <div className="w-[100px] flex items-center justify-end text-[12px] text-text-tertiary shrink-0">
        {lastActivity}
      </div>
    </Link>
  );
}

// Empty state
export function DashboardEmptyState() {
  return (
    <div className="bg-bg-elevated border border-border-dashed rounded-[8px] p-[32px] text-center">
      <div className="mb-[16px] flex justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-text-tertiary"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
      <h3 className="text-[13px] font-semibold text-text-primary mb-[4px]">No projects yet</h3>
      <p className="text-[12px] text-text-secondary">Create your first project to get started</p>
    </div>
  );
}

// Summary stat card — horizontal row layout
export function DashboardSummaryCard({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative bg-bg-elevated border border-border-subtle rounded-[8px] px-[20px] py-[16px] min-w-[140px] flex flex-col justify-center">
      <div className="absolute top-[16px] right-[20px] text-text-tertiary flex items-center justify-center pointer-events-none">
        {icon}
      </div>
      <p className="text-[24px] font-semibold text-text-primary leading-none block">{value}</p>
      <p className="text-[11px] font-medium text-text-secondary uppercase tracking-[0.04em] mt-[4px]">{label}</p>
    </div>
  );
}
