/**
 * Shared iOS style constants across the application
 */

// ============================================================================
// Input Styles
// ============================================================================

export const iosInputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--ios-bg-card)',
  color: 'var(--ios-text-primary)',
  borderColor: 'var(--ios-border)',
  borderRadius: '12px',
  fontSize: '17px',
  outline: 'none',
  transition: 'box-shadow 0.2s',
} as const;

export const iosInputFocusStyle = {
  boxShadow: '0 0 0 2px var(--ios-blue)',
} as const;

export const iosButtonBase = {
  base: 'px-4 py-2 ios-body ios-rounded-lg ios-font-text transition-colors disabled:opacity-50',
  variants: {
    primary: 'text-white bg-ios-blue',
    secondary: 'text-ios-blue bg-ios-bg-card border border-ios-border',
    tertiary: 'text-ios-blue bg-ios-secondary border border-ios-border',
    danger: 'text-white bg-ios-red',
    ghost: 'text-ios-text-primary bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
  },
} as const;

// ============================================================================
// Task Status Colors
// ============================================================================

export const taskStatusColors = {
  todo: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-700' },
  in_progress: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  paused: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
  blocked: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
  done: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
  skipped: { bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
} as const;

export type TaskStatus = keyof typeof taskStatusColors;

// ============================================================================
// Task Priority Colors (border left indicator)
// ============================================================================

export const taskPriorityBorderColors: Record<number, string> = {
  1: 'border-gray-300 dark:border-gray-600',
  2: 'border-yellow-400 dark:border-yellow-600',
  3: 'border-orange-400 dark:border-orange-600',
  4: 'border-red-400 dark:border-red-600',
  5: 'border-red-600 dark:border-red-700',
};

export const taskPriorityLabelColors: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  2: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  3: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  4: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  5: { bg: 'bg-red-200 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200' },
};

// ============================================================================
// Agent Status Colors
// ============================================================================

export type AgentStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error' | 'stale';

export const agentStatusColors: Record<AgentStatus, { dot: string; bg: string; text: string }> = {
  idle: { dot: 'bg-ios-gray-2', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  running: { dot: 'bg-ios-green', bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  paused: { dot: 'bg-ios-blue', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  stopped: { dot: 'bg-ios-gray', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  error: { dot: 'bg-ios-red', bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  stale: { dot: 'bg-ios-orange', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
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

export const logLevelColors: Record<LogLevel, { bg: string; text: string; border: string }> = {
  debug: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-700' },
  info: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  warn: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
  error: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
};

export const logLevelLabels: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

export const logLevelIcons: Record<LogLevel, string> = {
  debug: '⚡',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

// ============================================================================
// User Role Colors
// ============================================================================

export type UserRole = 'admin' | 'developer' | 'viewer';

export const userRoleColors: Record<UserRole, { bg: string; text: string }> = {
  admin: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  developer: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  viewer: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
};

export const userRoleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  developer: 'Developer',
  viewer: 'Viewer',
};

// ============================================================================
// Spacing Constants
// ============================================================================

export const spacing = {
  xs: '4px',   // 0.25rem
  sm: '8px',   // 0.5rem
  md: '12px',  // 0.75rem
  lg: '16px',  // 1rem
  xl: '20px',  // 1.25rem
  '2xl': '24px', // 1.5rem
  '3xl': '32px', // 2rem
  '4xl': '40px', // 2.5rem
} as const;

// ============================================================================
// Z-Index Scale
// ============================================================================

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ============================================================================
// Transition Timing
// ============================================================================

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
} as const;

// ============================================================================
// Border Radius
// ============================================================================

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '14px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

// ============================================================================
// Shadow
// ============================================================================

export const shadow = {
  card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
  elevated: '0 4px 12px rgba(0, 0, 0, 0.08)',
  modal: '0 20px 40px rgba(0, 0, 0, 0.2)',
  popover: '0 8px 24px rgba(0, 0, 0, 0.12)',
  tooltip: '0 2px 8px rgba(0, 0, 0, 0.1)',
} as const;

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
