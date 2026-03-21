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
    <div className="scanline-overlay border-phosphor-amber/30 bg-phosphor-amber/5 rounded-md border shadow-sm transition-all">
      {/* Row 1: daemon icon + label + quoted message */}
      <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1.5">
        <div className="bg-phosphor-amber/10 flex h-6 w-6 items-center justify-center rounded-sm">
          <DaemonMascot size={18} expression="blocked" />
        </div>
        <span className="text-phosphor-amber font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
          NEEDS ATTENTION
        </span>
        <span className="text-text-secondary ml-1 font-mono text-[10px] italic opacity-80">
          {quoteMessage}
        </span>
      </div>

      {/* Row 2: task pills + dismiss */}
      <div className="flex items-center gap-2 px-3 pb-2.5">
        <div className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5">
          {blockedTasks.map((task) => (
            <Button
              key={task.id}
              variant="ghost"
              size="sm"
              onClick={() => openDrawer(task.id)}
              className="border-phosphor-amber/20 bg-phosphor-amber/10 text-phosphor-amber hover:bg-phosphor-amber/20 h-7 shrink-0 rounded-[2px] border px-2 font-mono text-[10px] transition-colors"
            >
              <TriangleAlert className="mr-1.5 h-3 w-3" aria-hidden="true" />
              <span className="font-bold">{task.externalId}</span>
              <span className="text-phosphor-amber/60 ml-2 max-w-[150px] truncate font-medium">
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
          className="text-phosphor-amber/50 hover:text-phosphor-amber hover:bg-phosphor-amber/10 h-7 w-7 shrink-0 transition-colors"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
