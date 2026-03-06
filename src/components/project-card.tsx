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

const statusDotColors: Record<AgentStatus, string> = {
  running: 'bg-[#57D9A3]',
  paused: 'bg-[#FFAB00]',
  stopped: 'bg-[var(--border-default)]',
  idle: 'bg-[var(--border-default)]',
  error: 'bg-[var(--status-blocked-text)]',
  stale: 'bg-[var(--status-paused-text)]',
};

export function ProjectCard({
  project,
  hasActivePlan = false,
  activePlanLabel,
}: ProjectCardProps) {
  const agentStatus = (project.agentStatus || 'idle') as AgentStatus;
  const dotColor = statusDotColors[agentStatus] || statusDotColors.idle;

  const totalTasks = project.taskStats?.total || 0;
  const doneTasks = project.taskStats?.done || 0;

  const lastActivity = project.updatedAt
    ? formatRelativeTime(project.updatedAt)
    : 'Never';

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex items-center h-[44px] px-[16px] border-b border-[var(--border-default)] hover:bg-[var(--bg-hovered)] hover:border-l-[2px] hover:border-l-[var(--brand-primary)] hover:pl-[14px] transition-all last:border-b-0"
    >
      {/* Name */}
      <div className="flex-1 min-w-0 pr-[var(--sp-4)] flex items-center h-full">
        <span className="text-[var(--font-size-base)] font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
          {project.name}
        </span>
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="w-[120px] flex items-center justify-end text-[var(--font-size-sm)] text-[var(--text-tertiary)] pr-[var(--sp-6)] shrink-0 font-medium">
          <span>{doneTasks}/{totalTasks} tasks</span>
        </div>
      )}

      {/* Status */}
      <div className="w-[140px] flex items-center shrink-0">
        {agentStatus === 'idle' ? (
          <div className="flex items-center text-[var(--text-tertiary)] text-[12px] font-[400]">
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#94A3B8',
              display: 'inline-block',
              marginRight: '6px'
            }} />
            {agentStatusLabels[agentStatus]}
          </div>
        ) : (
          <div className="flex items-center gap-[var(--sp-2)] text-[var(--font-size-sm)] font-medium text-[var(--text-secondary)]">
            <span className={cn("w-[6px] h-[6px] rounded-full flex-shrink-0", dotColor)} />
            <span>{agentStatusLabels[agentStatus]}</span>
          </div>
        )}
      </div>

      {/* Last Activity */}
      <div className="w-[120px] flex items-center justify-end text-[var(--font-size-sm)] text-[var(--text-tertiary)] shrink-0 font-medium">
        {lastActivity}
      </div>
    </Link>
  );
}

// Empty state
export function DashboardEmptyState() {
  return (
    <GlassCard className="p-[var(--sp-12)] text-center" intensity="low">
      <div className="mb-[var(--sp-5)] flex justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-[var(--text-tertiary)]"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
      <h3 className="text-[var(--font-size-md)] font-semibold text-[var(--text-primary)] mb-[var(--sp-2)]">No projects yet</h3>
      <p className="text-[var(--font-size-base)] text-[var(--text-secondary)]">Create your first project to get started</p>
    </GlassCard>
  );
}

export function DashboardSummaryCard({
  value,
  label,
  icon,
  accentColor,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div
      className="relative flex flex-col justify-center overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-card)',
        padding: '20px 24px',
        height: '96px'
      }}
    >
      {accentColor && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[8px]"
          style={{ background: accentColor }}
        />
      )}
      <div
        className="absolute"
        style={{
          top: '16px',
          right: '16px',
          width: '20px',
          height: '20px',
          opacity: 0.15,
          color: '#172B4D'
        }}
      >
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>
        {label}
      </p>
    </div>
  );
}
