'use client';

import React from 'react';

import Link from 'next/link';
import { type ProjectSelect } from '@/db/schema';
import { GlassCard } from './ui/glass-card';
import { cn } from '@/lib/utils';
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
      className="group flex items-center min-h-[44px] px-[20px] border-b border-white/[0.05] hover:bg-white/[0.05] hover:backdrop-blur-md transition-all duration-300 last:border-b-0"
    >
      {/* Name */}
      <div className="flex-1 min-w-0 pr-4 flex items-center h-full">
        <span className="text-[14px] font-semibold text-white/90 group-hover:text-white transition-colors">
          {project.name}
        </span>
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="w-[120px] flex items-center justify-end text-[12px] text-white/50 pr-6 shrink-0 font-medium">
          <span>{doneTasks}/{totalTasks} tasks</span>
        </div>
      )}

      {/* Status Dot */}
      <div className={cn("w-[140px] flex items-center gap-[10px] text-[13px] shrink-0 font-medium", badge.color)}>
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]", badge.dot)} />
        <span>{agentStatusLabels[agentStatus]}</span>
      </div>

      {/* Last Activity */}
      <div className="w-[120px] flex items-center justify-end text-[12px] text-white/30 shrink-0 font-medium">
        {lastActivity}
      </div>
    </Link>
  );
}

// Empty state
export function DashboardEmptyState() {
  return (
    <GlassCard className="p-[48px] text-center" intensity="low">
      <div className="mb-[20px] flex justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-white/20"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
      <h3 className="text-[16px] font-bold text-white mb-[8px]">No projects yet</h3>
      <p className="text-[14px] text-white/50">Create your first project to get started</p>
    </GlassCard>
  );
}

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
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[8px] shadow-[var(--shadow-card)] p-4 px-5 relative h-[88px] flex flex-col justify-end overflow-hidden">
      <div className="absolute top-4 right-4 text-[var(--color-text-tertiary)] opacity-50">
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
      <p className="text-[24px] font-bold text-[var(--color-text-primary)] leading-none">{value}</p>
      <p className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-[0.06em] mt-1">{label}</p>
    </div>
  );
}
