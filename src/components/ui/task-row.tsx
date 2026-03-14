'use client';

import React from 'react';
import { PixelBadge, PixelCollapsible, PixelDropdown } from '@pxlkit/ui-kit';
import { twMerge } from 'tailwind-merge';

export type TaskRowProps = {
  task: {
    id: string;
    externalId: string; // "T-042"
    title: string;
    status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'failed';
    estimatedMinutes?: number;
    actualDurationMs?: number;
    blockedReason?: string;
    dependencyTaskId?: string;
    executionOrder: number;
  };
  isExpanded?: boolean;
  onToggle?: () => void;
  onOpenDrawer?: (taskId: string) => void;
  isRunning?: boolean;
  className?: string;
};

const statusConfig = {
  todo: { char: '○', color: 'text-[--text-muted]', tone: 'neutral' as const },
  in_progress: {
    char: '▶',
    color: 'text-[--accent-violet] animate-[blink_1s_infinite]',
    tone: 'purple' as const,
  },
  blocked: { char: '⚠', color: 'text-[--phosphor-amber]', tone: 'gold' as const },
  done: { char: '✓', color: 'text-[--status-emerald]', tone: 'green' as const },
  failed: { char: '✕', color: 'text-[--status-red]', tone: 'red' as const },
};

function formatDuration(ms?: number) {
  if (!ms) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function TaskRow({
  task,
  isExpanded = false,
  onToggle,
  onOpenDrawer,
  isRunning = false,
  className,
}: TaskRowProps) {
  const config = statusConfig[task.status];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle?.();
    } else if (e.key === 'o' || e.key === 'O') {
      e.preventDefault();
      onOpenDrawer?.(task.id);
    }
  };

  const getMenuItems = () => {
    const items = [
      { value: 'open', label: 'Open Detail →' },
      { value: 'div1', label: '──────────────' },
    ];

    if (task.status !== 'done') {
      items.push({ value: 'mark_done', label: 'Mark Done' });
    }
    items.push({ value: 'mark_blocked', label: 'Mark Blocked' });
    items.push({ value: 'rerun', label: 'Re-run' });

    return items;
  };

  return (
    <div
      className={twMerge(
        'group flex flex-col border-b border-[--border-muted] transition-colors focus-within:ring-1 focus-within:ring-[--accent-violet] focus-within:outline-none',
        isRunning && 'border-l-2 border-[--accent-violet] bg-[--accent-violet]/5',
        task.status === 'blocked' && !isRunning && 'border-l-2 border-[--status-red]',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Collapsed Row */}
      <div
        className="flex h-[36px] cursor-pointer items-center gap-3 px-3 hover:bg-[--bg-elevated]"
        onClick={onToggle}
      >
        <span className={twMerge('w-4 shrink-0 text-center font-mono text-[13px]', config.color)}>
          {config.char}
        </span>

        <span className="shrink-0 rounded-sm bg-amber-950/30 px-1 font-mono text-xs text-[--phosphor-amber]">
          {task.externalId}
        </span>

        <span className="flex-1 truncate text-sm font-medium text-[--text-primary]">
          {task.title}
        </span>

        <PixelBadge tone={config.tone}>{task.status.replace('_', ' ').toUpperCase()}</PixelBadge>

        {task.actualDurationMs && (
          <span className="w-16 shrink-0 text-right font-mono text-xs text-[--text-muted]">
            {formatDuration(task.actualDurationMs)}
          </span>
        )}

        <div
          className="ml-2 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <PixelDropdown
            label="⋯"
            items={getMenuItems()}
            onSelect={(value) => {
              if (value === 'open') onOpenDrawer?.(task.id);
              // Handle other actions here...
            }}
          />
        </div>
      </div>

      {/* Expanded Content */}
      <PixelCollapsible defaultOpen={isExpanded} label="Details">
        <div className="mt-1 flex flex-col gap-2 border-t border-[--border-muted] pt-1 pr-4 pb-4 pl-10 text-sm text-[--text-secondary]">
          <div className="flex gap-4 font-mono text-xs text-[--text-muted]">
            {task.estimatedMinutes && <span>Estimated: {task.estimatedMinutes}m</span>}
            {task.actualDurationMs && <span>Actual: {formatDuration(task.actualDurationMs)}</span>}
            {task.dependencyTaskId && <span>Depends on: {task.dependencyTaskId}</span>}
          </div>

          {/* eslint-disable-next-line no-restricted-syntax */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDrawer?.(task.id);
            }}
            className="mt-1 self-start text-xs font-medium tracking-wider text-[--accent-violet] uppercase hover:text-[--accent-violet-dim] hover:underline"
          >
            Open Detail →
          </button>

          {task.status === 'blocked' && task.blockedReason && (
            <div className="mt-2 rounded border border-[--phosphor-amber]/20 bg-amber-950/20 p-2 text-xs text-[--phosphor-amber]">
              <span className="mr-2 font-bold">Blocked reason:</span>
              {task.blockedReason}
            </div>
          )}
        </div>
      </PixelCollapsible>
    </div>
  );
}
