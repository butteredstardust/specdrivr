'use client';

import Link from 'next/link';
import { type ProjectSelect } from '@/db/schema';
import {
  agentStatusColors,
  agentStatusLabels,
  formatRelativeTime,
  getAgentStatusClass,
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

const statusBadgeStyles: Record<AgentStatus, { bg: string; text: string; dot: string }> = {
  running: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  paused: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  stopped: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  idle: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  error: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  stale: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-400' },
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
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const lastActivity = project.updatedAt
    ? formatRelativeTime(project.updatedAt)
    : 'Never';

  const techStack = Array.isArray(project.techStack)
    ? (project.techStack as string[])
    : typeof project.techStack === 'string'
      ? [project.techStack]
      : [];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all duration-150"
    >
      {/* Top row: name + status badge */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate mr-2 group-hover:text-blue-600 transition-colors">
          {project.name}
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${badge.bg} ${badge.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dot}`} />
          {agentStatusLabels[agentStatus]}
        </span>
      </div>

      {/* Tech stack pills */}
      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {techStack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
            >
              {tech}
            </span>
          ))}
          {techStack.length > 3 && (
            <span className="text-[11px] text-gray-400">
              +{techStack.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span>{doneTasks}/{totalTasks} tasks</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer: plan label or timestamp */}
      <div className="flex items-center justify-between">
        {hasActivePlan && activePlanLabel ? (
          <span className="text-[11px] text-blue-600 font-medium">{activePlanLabel}</span>
        ) : (
          <span className="text-[11px] text-gray-400" />
        )}
        <span className="text-[11px] text-gray-400">{lastActivity}</span>
      </div>
    </Link>
  );
}

// Empty state
export function DashboardEmptyState() {
  return (
    <div className="bg-white border border-dashed border-gray-200 rounded-lg p-16 text-center">
      <div className="mb-4 flex justify-center">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-gray-300"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">No projects yet</h3>
      <p className="text-sm text-gray-400">Create your first project to get started</p>
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
      {/* Icon container — fixed size so it never overlaps the number */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
        {icon}
      </div>
      {/* Text */}
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">{label}</p>
      </div>
    </div>
  );
}

// Icon helpers (unchanged)
export function getProjectIcon(status?: string) {
  switch (status) {
    case 'running':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16" fill="currentColor" />
        </svg>
      );
    case 'paused':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
      );
  }
}
