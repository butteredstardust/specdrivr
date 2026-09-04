'use client';

import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GatedButton } from '@/components/ui/gated-button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Task } from './task-drawer';

const MANAGE_ROLE = 'Requires Admin or Owner role';

interface TaskDrawerFooterProps {
  task: Task;
  canManage: boolean;
  devMode: boolean;
  onRetry: (humanContext?: string) => Promise<void>;
  onMarkBlocked: () => Promise<void>;
  onMarkDone: () => void;
}

export function TaskDrawerFooter({
  task,
  canManage,
  devMode,
  onRetry,
  onMarkBlocked,
  onMarkDone,
}: TaskDrawerFooterProps) {
  const showRerun = ['failed', 'done'].includes(task.status);
  const [jsonOpen, setJsonOpen] = useState(false);

  const hasUsage = task.totalCostUsd != null && task.totalCostUsd > 0;

  return (
    <div className="bg-surface-inset border-line shrink-0 space-y-4 border-t px-6 py-5">
      <TooltipProvider>
        <div className="flex items-center gap-3">
          {showRerun && (
            <Button variant="info" size="sm" onClick={() => void onRetry()} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Re-run
            </Button>
          )}

          <GatedButton
            allowed={canManage}
            reason={MANAGE_ROLE}
            variant="warning"
            size="sm"
            className="gap-1.5"
            onClick={onMarkBlocked}
            disabled={task.status === 'blocked'}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Mark blocked
          </GatedButton>

          <GatedButton
            allowed={canManage}
            reason={MANAGE_ROLE}
            variant="outline"
            size="sm"
            className="border-success-border text-success hover:bg-success-bg gap-1.5"
            onClick={onMarkDone}
            disabled={task.status === 'done'}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark done
          </GatedButton>
        </div>
      </TooltipProvider>

      {(devMode || hasUsage) && (
        <div className="space-y-3">
          <div className="text-fg-muted text-2xs flex items-center gap-4">
            {devMode && (
              <>
                <span>Prompt: {task.promptTokensUsed?.toLocaleString() ?? '—'}</span>
                <span>Completion: {task.completionTokensUsed?.toLocaleString() ?? '—'}</span>
              </>
            )}
            {hasUsage && <span>Cost: ${task.totalCostUsd!.toFixed(4)}</span>}
          </div>
          {devMode && (
            <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
              <CollapsibleTrigger className="text-fg-muted hover:text-fg-secondary text-2xs flex cursor-pointer items-center gap-1.5 select-none">
                {jsonOpen ? 'Hide JSON' : 'Inspect JSON'}
                <ChevronRight
                  className={cn('h-3 w-3 transition-transform', jsonOpen && 'rotate-90')}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="bg-log-bg text-fg-secondary border-line-subtle text-2xs mt-2 overflow-auto rounded border p-3 font-mono">
                  {JSON.stringify(task, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
}
