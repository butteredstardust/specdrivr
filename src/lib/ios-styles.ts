/**
 * Shared iOS style constants across the application
 */

export const iosInputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--ios-bg-primary)',
  color: 'var(--ios-text-primary)',
  borderColor: 'var(--ios-separator)',
  borderRadius: '8px',
  fontSize: '17px',
  outline: 'none',
  transition: 'box-shadow 0.2s',
} as const;

export const iosInputFocusStyle = {
  boxShadow: '0 0 0 2px var(--ios-blue)',
} as const;

export const iosButtonBase = {
  base: 'px-4 py-2 ios-body ios-radius ios-font-text transition-colors disabled:opacity-50',
  variants: {
    primary: 'text-white',
    secondary: 'text-ios-blue bg-ios-secondary border border-ios',
    tertiary: 'text-ios-blue bg-ios-secondary border border-ios',
  },
} as const;

/**
 * Status colors for task status
 */
export const taskStatusColors = {
  todo: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  done: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  blocked: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
} as const;

/**
 * Priority colors for task priority
 */
export const taskPriorityBorderColors: Record<number, string> = {
  1: 'border-gray-300',
  2: 'border-yellow-400',
  3: 'border-orange-400',
  4: 'border-red-400',
  5: 'border-red-600',
};

/**
 * Log level colors for agent logs
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const logLevelColors: Record<LogLevel, { bg: string; text: string; border: string }> = {
  debug: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  warn: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  error: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
};
