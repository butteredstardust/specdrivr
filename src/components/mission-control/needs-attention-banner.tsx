'use client';

import { TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
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
    <div className="border-phosphor-amber/20 bg-phosphor-amber/10 rounded-md border">
      {/* Row 1: daemon icon + label + quoted message */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        <DaemonMascot size={20} expression="blocked" />
        <span className="text-phosphor-amber font-mono text-xs tracking-widest uppercase">
          NEEDS ATTENTION
        </span>
        <span className="text-text-secondary font-mono text-xs italic">{quoteMessage}</span>
      </div>

      {/* Row 2: task pills + dismiss */}
      <div className="flex items-center gap-2 px-3 pb-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5">
          {blockedTasks.map((task) => (
            <Button
              key={task.id}
              variant="ghost"
              size="sm"
              onClick={() => openDrawer(task.id)}
              className="border-phosphor-amber/30 bg-phosphor-amber/10 text-phosphor-amber hover:bg-phosphor-amber/20 h-auto shrink-0 rounded border px-2 py-0.5 font-mono text-xs transition-colors"
            >
              <TriangleAlert className="mr-1 h-3 w-3" aria-hidden="true" />
              <span className="font-semibold">{task.externalId}</span>
              <span className="text-phosphor-amber/70 ml-1.5 max-w-[120px] truncate">
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
          className="text-phosphor-amber/70 hover:text-phosphor-amber h-6 w-6 shrink-0"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
