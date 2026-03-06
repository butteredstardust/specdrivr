'use client';

import { useTheme } from '@/components/theme-provider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center h-[22px] w-[40px] rounded-[var(--radius-full)] transition-colors duration-[var(--transition-base)]"
      style={{
        backgroundColor: isDark ? 'var(--brand-primary)' : 'var(--border-default)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-full bg-white shadow-[var(--shadow-card)]"
        style={{
          transform: isDark ? 'translateX(20px)' : 'translateX(2px)',
          transition: 'transform 150ms ease',
        }}
      >
        {isDark ? (
          <Moon size={11} className="text-[var(--brand-primary)]" />
        ) : (
          <Sun size={11} className="text-[var(--text-tertiary)]" />
        )}
      </span>
    </button>
  );
}
