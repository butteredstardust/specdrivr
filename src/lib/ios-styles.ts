/**
 * Shared style constants across the application — Jira token-based
 */

// ============================================================================
// Task Status Colors (using CSS variable token classes)
// ============================================================================

export const taskStatusColors = {
  todo: { bg: 'bg-[var(--status-todo-bg)]', text: 'text-[var(--status-todo-text)]' },
  in_progress: { bg: 'bg-[var(--status-inprogress-bg)]', text: 'text-[var(--status-inprogress-text)]' },
  paused: { bg: 'bg-[var(--status-paused-bg)]', text: 'text-[var(--status-paused-text)]' },
  blocked: { bg: 'bg-[var(--status-blocked-bg)]', text: 'text-[var(--status-blocked-text)]' },
  done: { bg: 'bg-[var(--status-done-bg)]', text: 'text-[var(--status-done-text)]' },
  skipped: { bg: 'bg-[var(--status-skipped-bg)]', text: 'text-[var(--status-skipped-text)]' },
} as const;

export type TaskStatus = keyof typeof taskStatusColors;

// ============================================================================
// Agent Status Colors
// ============================================================================

export type AgentStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error' | 'stale';

export const agentStatusColors: Record<AgentStatus, { dot: string; bg: string; text: string }> = {
  idle: { dot: 'bg-[var(--color-border-default)]', bg: 'bg-[var(--status-todo-bg)]', text: 'text-[var(--status-todo-text)]' },
  running: { dot: 'bg-[#4ADE80]', bg: 'bg-[var(--status-done-bg)]', text: 'text-[var(--status-done-text)]' },
  paused: { dot: 'bg-[#F87171]', bg: 'bg-[var(--status-paused-bg)]', text: 'text-[var(--status-paused-text)]' },
  stopped: { dot: 'bg-[var(--color-border-bold)]', bg: 'bg-[var(--status-todo-bg)]', text: 'text-[var(--status-todo-text)]' },
  error: { dot: 'bg-[var(--status-blocked-text)]', bg: 'bg-[var(--status-blocked-bg)]', text: 'text-[var(--status-blocked-text)]' },
  stale: { dot: 'bg-[var(--status-paused-text)]', bg: 'bg-[var(--status-paused-bg)]', text: 'text-[var(--status-paused-text)]' },
};

export const agentStatusLabels: Record<AgentStatus, string> = {
  idle: 'Agent Idle',
  running: 'Agent Running',
  paused: 'Agent Paused',
  stopped: 'Agent Stopped',
  error: 'Agent Error',
  stale: 'Agent Unresponsive',
};

// ============================================================================
// Log Level Colors
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const logLevelColors: Record<LogLevel, { bg: string; text: string }> = {
  debug: { bg: 'bg-[var(--log-debug-bg)]', text: 'text-[var(--log-debug-text)]' },
  info: { bg: 'bg-[var(--log-info-bg)]', text: 'text-[var(--log-info-text)]' },
  warn: { bg: 'bg-[var(--log-warn-bg)]', text: 'text-[var(--log-warn-text)]' },
  error: { bg: 'bg-[var(--log-error-bg)]', text: 'text-[var(--log-error-text)]' },
};

export const logLevelLabels: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

// ============================================================================
// User Role Colors
// ============================================================================

export type UserRole = 'admin' | 'developer' | 'viewer';

export const userRoleColors: Record<UserRole, { bg: string; text: string }> = {
  admin: { bg: 'bg-[var(--role-admin-bg)]', text: 'text-[var(--role-admin-text)]' },
  developer: { bg: 'bg-[var(--role-dev-bg)]', text: 'text-[var(--role-dev-text)]' },
  viewer: { bg: 'bg-[var(--role-viewer-bg)]', text: 'text-[var(--role-viewer-text)]' },
};

export const userRoleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  developer: 'Developer',
  viewer: 'Viewer',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a duration in milliseconds to a human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
  return `${Math.floor(ms / 3600000)}h`;
}

/**
 * Format a timestamp relative to now
 */
export function formatRelativeTime(timestamp: Date | string): string {
  const now = new Date();
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

/**
 * Format a timestamp as absolute date/time
 */
export function formatDateTime(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
