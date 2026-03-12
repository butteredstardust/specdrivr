'use client';

import React from 'react';
import { PixelBadge, PixelCollapsible, PixelDropdown } from '@pxlkit/ui-kit';
import { twMerge } from 'tailwind-merge';

export type TaskRowProps = {
  task: {
    id: string;
    externalId: string;        // "T-042"
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
  in_progress: { char: '▶', color: 'text-[--accent-violet] animate-[blink_1s_infinite]', tone: 'purple' as const },
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
        className="flex items-center h-[36px] px-3 gap-3 cursor-pointer hover:bg-[--bg-elevated]"
        onClick={onToggle}
      >
        <span className={twMerge('text-[13px] font-mono shrink-0 w-4 text-center', config.color)}>
          {config.char}
        </span>

        <span className="font-mono text-xs text-[--phosphor-amber] bg-amber-950/30 rounded-sm px-1 shrink-0">
          {task.externalId}
        </span>

        <span className="text-sm text-[--text-primary] truncate flex-1 font-medium">
          {task.title}
        </span>

        <PixelBadge tone={config.tone} >
          {task.status.replace('_', ' ').toUpperCase()}
        </PixelBadge>

        {task.actualDurationMs && (
          <span className="text-xs text-[--text-muted] font-mono shrink-0 w-16 text-right">
            {formatDuration(task.actualDurationMs)}
          </span>
        )}

        <div className="shrink-0 ml-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
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
        <div className="pl-10 pr-4 pb-4 pt-1 flex flex-col gap-2 text-sm text-[--text-secondary] border-t border-[--border-muted] mt-1">
          <div className="flex font-mono text-xs text-[--text-muted] gap-4">
            {task.estimatedMinutes && <span>Estimated: {task.estimatedMinutes}m</span>}
            {task.actualDurationMs && <span>Actual: {formatDuration(task.actualDurationMs)}</span>}
            {task.dependencyTaskId && <span>Depends on: {task.dependencyTaskId}</span>}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDrawer?.(task.id);
            }}
            className="text-[--accent-violet] hover:text-[--accent-violet-dim] hover:underline self-start font-medium text-xs uppercase tracking-wider mt-1"
          >
            Open Detail →
          </button>

          {task.status === 'blocked' && task.blockedReason && (
            <div className="mt-2 p-2 bg-amber-950/20 border border-[--phosphor-amber]/20 rounded text-[--phosphor-amber] text-xs">
              <span className="font-bold mr-2">Blocked reason:</span>
              {task.blockedReason}
            </div>
          )}
        </div>
      </PixelCollapsible>
    </div>
  );
}
