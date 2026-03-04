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

export function ProjectCard({
  project,
  hasActivePlan = false,
  activePlanLabel,
}: ProjectCardProps) {
  const agentStatus = project.agentStatus || 'idle';
  const statusInfo = agentStatusColors[agentStatus];
  const statusClass = getAgentStatusClass(agentStatus);

  // Extract tech stack
  const techStack = Array.isArray(project.techStack)
    ? (project.techStack as string[])
    : typeof project.techStack === 'string'
    ? [project.techStack]
    : [];

  // Calculate task progress
  const totalTasks = project.taskStats?.total || 0;
  const doneTasks = project.taskStats?.done || 0;
  const progressPercent = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

  // Get relative activity time
  const lastActivity = project.updatedAt
    ? formatRelativeTime(project.updatedAt)
    : 'Never';

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block cursor-pointer ios-card p-5 hover:shadow-ios-elevated transition-shadow ios"
    >
      {/* Header with status dot and name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Agent Status Dot */}
          <div
            className={`ios-status-dot ${statusClass}`}
            title={`Agent status: ${agentStatusLabels[agentStatus]}`}
          />
          <h3 className="ios-headline font-semibold text-ios-text-primary truncate">
            {project.name}
          </h3>
        </div>
        {agentStatus === 'running' && (
          <svg
            className="w-4 h-4 text-ios-green flex-shrink-0 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" opacity="0.2" />
            <circle cx="12" cy="12" r="6" />
          </svg>
        )}
      </div>

      {/* Tech Stack */}
      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {techStack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="ios-caption-1 bg-ios-secondary ios-text-secondary border border-ios-border px-2 py-0.5 rounded-full"
            >
              {tech}
            </span>
          ))}
          {techStack.length > 4 && (
            <span className="ios-caption-1 text-ios-text-secondary">
              +{techStack.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Task Progress Bar */}
      {totalTasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="ios-caption-1 text-ios-text-secondary">
              {doneTasks}/{totalTasks} tasks done
            </span>
            <span className="ios-caption-1 text-ios-text-secondary">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-1.5 bg-ios-gray-5 rounded-full overflow-hidden">
            <div
              className="h-full bg-ios-green rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs">
        {/* Agent Status Text */}
        <span className={`ios-caption-1 ${statusInfo.text}`}>
          {agentStatus === 'running' ? 'Agent running' : agentStatus === 'idle' ? 'Agent idle' : agentStatusLabels[agentStatus]}
        </span>

        {/* Active Plan or Last Activity */}
        {hasActivePlan && activePlanLabel ? (
          <span className="ios-caption-1 text-ios-blue font-medium">
            {activePlanLabel}
          </span>
        ) : (
          <span className="ios-caption-1 text-ios-placeholder">
            {lastActivity}
          </span>
        )}
      </div>
    </Link>
  );
}

// Empty state for dashboard
export function DashboardEmptyState() {
  return (
    <div className="ios-card p-12 text-center">
      <div className="mb-4 flex justify-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-ios-placeholder"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
      <h3 className="ios-title-3 text-ios-text-primary mb-2 ios-font-display">
        No projects yet
      </h3>
      <p className="ios-body text-ios-text-secondary mb-6">
        Create your first project to get started
      </p>
      {/* CreateProjectButton would be here */}
    </div>
  );
}

// Summary card component
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
    <div className="ios-card p-4">
      <div className="flex items-center gap-3">
        <div className="text-ios-blue">{icon}</div>
        <div>
          <p className="ios-title-1 text-ios-text-primary ios-font-display">
            {value}
          </p>
          <p className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// Task count summary icon
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
