'use client';

import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 focus:ring-offset-2"
      style={{
        backgroundColor: theme === 'dark' ? '#32D74B' : '#E9E9EA',
      }}
    >
      <span
        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform"
        style={{
          transform: `translateX(${theme === 'dark' ? '6px' : '-6px'})`,
        }}
      >
        <span className="flex h-full w-full items-center justify-center text-sm">
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>
      </span>
    </button>
  );
}
