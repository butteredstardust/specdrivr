'use client';

import { useState } from 'react';
import { usePolling } from '@/hooks/use-polling';
import { TerminalLog } from '@/components/ui/terminal-log';
import dynamic from 'next/dynamic';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StatusIcon } from '@/components/ui/status-icon';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const LiveTerminal = dynamic(
  () => import('@/components/ui/live-terminal').then((m) => ({ default: m.LiveTerminal })),
  { ssr: false }
);

interface Attempt {
  id: number;
  seq: number;
  status: 'running' | 'completed' | 'failed';
  logLines: string[];
  sessionId?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
}

interface TaskDrawerAttemptsProps {
  taskId: number;
  taskStatus: string;
}

const statusBadgeClass: Record<Attempt['status'], string> = {
  running: 'bg-surface-inset/10 text-accent',
  completed: 'bg-emerald-500/10 text-emerald-400',
  failed: 'bg-danger/10 text-danger',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return `${mins}m ${remSecs}s`;
}

export function TaskDrawerAttempts({ taskId, taskStatus }: TaskDrawerAttemptsProps) {
  const shouldPoll = taskStatus === 'in_progress';

  const { data: attempts, isLoading } = usePolling<Attempt[]>({
    url: `/api/v1/tasks/${taskId}/attempts`,
    interval: 3000,
    stopWhen: () => !shouldPoll,
  });

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-fg-muted font-mono text-xs">Loading attempts...</span>
      </div>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <StatusIcon size={24} status="idle" />
        <span className="text-fg-secondary font-mono text-sm">No attempts yet.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {attempts.map((attempt, index) => {
        const isLatestRunning = index === 0 && attempt.status === 'running';
        const isOpen = isLatestRunning || expandedIds.has(attempt.id);

        return (
          <Collapsible
            key={attempt.id}
            open={isOpen}
            onOpenChange={() => toggleExpanded(attempt.id)}
          >
            <CollapsibleTrigger className="border-line hover:bg-surface-inset data-[state=open]:bg-surface-inset/50 flex w-full items-center gap-4 rounded-md border px-4 py-3 transition-colors">
              <ChevronRight
                className={cn('text-fg-muted h-4 w-4 transition-transform', isOpen && 'rotate-90')}
              />
              <span className="text-fg font-mono text-sm font-medium">Attempt #{attempt.seq}</span>
              <span
                className={cn(
                  'rounded-sm px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase',
                  statusBadgeClass[attempt.status]
                )}
              >
                {attempt.status}
              </span>
              {attempt.durationMs != null && (
                <span className="text-fg-muted ml-auto font-mono text-xs">
                  {formatDuration(attempt.durationMs)}
                </span>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {attempt.status === 'running' && attempt.sessionId ? (
                <LiveTerminal sessionId={attempt.sessionId} height={320} active={isOpen} />
              ) : (
                <TerminalLog
                  lines={attempt.logLines ?? []}
                  maxHeight="320px"
                  autoScroll={attempt.status === 'running'}
                />
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
