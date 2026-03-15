'use client';

import Link from 'next/link';
import { TriangleAlert, X } from 'lucide-react';

interface BlockedTask {
  id: number;
  title: string;
  specId: number;
}

interface NeedsAttentionBannerProps {
  blockedTasks: BlockedTask[];
  onDismiss: () => void;
}

export function NeedsAttentionBanner({ blockedTasks, onDismiss }: NeedsAttentionBannerProps) {
  if (blockedTasks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-[--phosphor-amber]/20 bg-[--phosphor-amber]/10 px-3 py-2">
      {/* Left: icon + label */}
      <div className="flex shrink-0 items-center gap-1.5">
        <TriangleAlert className="h-4 w-4 text-[--phosphor-amber]" aria-hidden="true" />
        <span className="font-mono text-xs tracking-widest text-[--phosphor-amber] uppercase">
          Needs Attention
        </span>
      </div>

      {/* Center: scrollable task pills */}
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5">
        {blockedTasks.map((task) => (
          <Link
            key={task.id}
            href={`/specs/${task.specId}?tab=tasks`}
            className="shrink-0 rounded border border-[--phosphor-amber]/30 bg-[--phosphor-amber]/10 px-2 py-0.5 font-mono text-xs text-[--phosphor-amber] transition-colors hover:bg-[--phosphor-amber]/20"
          >
            {task.title}
          </Link>
        ))}
      </div>

      {/* Right: dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 text-[--phosphor-amber]/70 transition-colors hover:text-[--phosphor-amber]"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
