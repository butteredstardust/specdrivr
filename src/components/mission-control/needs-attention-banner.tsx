'use client';

import { TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusIcon } from '@/components/ui/status-icon';
import { useTaskDrawer } from '@/components/shell/task-drawer-context';

interface BlockedTask {
  id: number;
  externalId: string;
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

  const n = blockedTasks.length;
  const quoteMessage = `"I need your help with ${n} task${n === 1 ? '' : 's'}"`;

  return (
    <div className="border-warning-border bg-warning-bg rounded-md border transition-all">
      {/* Row 1: status icon + label + summary */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        <StatusIcon size={16} status="blocked" label={null} />
        <span className="text-warning text-sm font-medium">Needs attention</span>
        <span className="text-fg-secondary text-sm">{quoteMessage}</span>
      </div>

      {/* Row 2: task pills + dismiss */}
      <div className="flex items-center gap-2 px-3 pb-2.5">
        <div className="flex min-w-0 flex-1 scrollbar-none gap-2 overflow-x-auto py-0.5">
          {blockedTasks.map((task) => (
            <Button
              key={task.id}
              variant="ghost"
              size="sm"
              onClick={() => openDrawer(task.id)}
              className="border-warning-border bg-warning-bg text-warning text-2xs h-7 shrink-0 rounded-[2px] border px-2 font-mono transition-colors"
            >
              <TriangleAlert className="mr-1.5 h-3 w-3" aria-hidden="true" />
              <span className="font-bold">{task.externalId}</span>
              <span className="text-warning/60 ml-2 max-w-[150px] truncate font-medium">
                {task.title}
              </span>
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-warning/50 hover:text-warning hover:bg-warning-bg h-7 w-7 shrink-0 transition-colors"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
