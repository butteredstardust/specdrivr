'use client';

import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]/50 focus:ring-offset-2"
      style={{
        backgroundColor: isDark ? 'var(--ios-green-active)' : 'var(--ios-separator)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        className="inline-block h-6 w-6 transform rounded-ios-md ios-bg-card shadow-ios-elevated transition-transform duration-200"
        style={{
          transform: isDark ? 'translateX(6px)' : 'translateX(-6px)',
        }}
      >
        <span className="flex h-full w-full items-center justify-center ios-headline">
          {isDark ? '🌙' : '☀️'}
        </span>
      </span>
    </button>
  );
}
