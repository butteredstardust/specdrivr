'use client';

import { TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskDrawer } from '@/components/shell/task-drawer-context';

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
  const { openDrawer } = useTaskDrawer();

  if (blockedTasks.length === 0) {
    return null;
  }

  return (
    <div className="border-phosphor-amber/20 bg-phosphor-amber/10 flex items-center gap-3 rounded-md border px-3 py-2">
      {/* Left: icon + label */}
      <div className="flex shrink-0 items-center gap-1.5">
        <TriangleAlert className="text-phosphor-amber h-4 w-4" aria-hidden="true" />
        <span className="text-phosphor-amber font-mono text-xs tracking-widest uppercase">
          NEEDS ATTENTION
        </span>
      </div>

      {/* Center: scrollable task pills */}
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5">
        {blockedTasks.map((task) => (
          <Button
            key={task.id}
            variant="ghost"
            size="sm"
            onClick={() => openDrawer(task.id)}
            className="border-phosphor-amber/30 bg-phosphor-amber/10 text-phosphor-amber hover:bg-phosphor-amber/20 h-auto shrink-0 rounded border px-2 py-0.5 font-mono text-xs transition-colors"
          >
            {task.title}
          </Button>
        ))}
      </div>

      {/* Right: dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-phosphor-amber/70 hover:text-phosphor-amber h-6 w-6 shrink-0"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
