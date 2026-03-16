'use client';

import { useState, useEffect } from 'react';
import { usePolling } from '@/hooks/use-polling';
import { CheckCircle2, AlertCircle, Clock, SkipForward } from 'lucide-react';

interface TaskItem {
  id: number;
  externalId: string;
  title: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  actualDurationMs: number | null;
  dependsOn: string[];
  orderIndex: number;
}

const TERMINAL_TASK_STATUSES = ['done', 'blocked', 'failed', 'skipped'];

function statusColor(status: string): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'in_progress':
      return {
        bg: 'bg-phosphor-amber/10',
        text: 'text-phosphor-amber',
        dot: 'bg-phosphor-amber',
      };
    case 'done':
      return {
        bg: 'bg-status-emerald/10',
        text: 'text-status-emerald',
        dot: 'bg-status-emerald',
      };
    case 'blocked':
      return {
        bg: 'bg-status-red/10',
        text: 'text-status-red',
        dot: 'bg-status-red',
      };
    case 'failed':
      return {
        bg: 'bg-status-red/10',
        text: 'text-status-red',
        dot: 'bg-status-red',
      };
    case 'skipped':
      return {
        bg: 'bg-secondary',
        text: 'text-muted-foreground',
        dot: 'bg-muted-foreground',
      };
    default:
      return {
        bg: 'bg-secondary',
        text: 'text-muted-foreground',
        dot: 'bg-muted-foreground',
      };
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'blocked':
    case 'failed':
      return <AlertCircle className="h-4 w-4" />;
    case 'skipped':
      return <SkipForward className="h-4 w-4" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 animate-spin" />;
    default:
      return <div className="h-4 w-4 rounded-full border border-current" />;
  }
}

function LiveDuration({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(startedAt).getTime();
      const secs = Math.floor(ms / 1000);
      const mm = String(Math.floor(secs / 60)).padStart(2, '0');
      const ss = String(secs % 60).padStart(2, '0');
      setElapsed(`${mm}:${ss}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return <span className="text-muted-foreground font-mono text-[10px]">{elapsed}</span>;
}

function taskDuration(task: TaskItem): React.ReactNode {
  if (task.status === 'in_progress' && task.startedAt) {
    return <LiveDuration startedAt={task.startedAt} />;
  }
  if (task.actualDurationMs != null) {
    const secs = Math.floor(task.actualDurationMs / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    return (
      <span className="text-muted-foreground font-mono text-[10px]">
        {mm}:{ss}
      </span>
    );
  }
  return <span className="text-muted-foreground font-mono text-[10px]">—</span>;
}

interface TaskTimelineProps {
  sessionId: number;
}

export function TaskTimeline({ sessionId }: TaskTimelineProps) {
  const { data, isLoading } = usePolling<TaskItem[]>({
    url: `/api/v1/sessions/${sessionId}/tasks`,
    interval: 5000,
    stopWhen: (tasks) =>
      Array.isArray(tasks) &&
      tasks.length > 0 &&
      tasks.every((t) => TERMINAL_TASK_STATUSES.includes(t.status)),
  });

  const tasks = data ? [...data].sort((a, b) => a.orderIndex - b.orderIndex) : [];

  return (
    <div>
      <p className="text-muted-foreground mb-6 font-mono text-[10px] tracking-[0.2em] uppercase">
        Task Execution Timeline
      </p>
      {isLoading && tasks.length === 0 ? (
        <p className="text-text-muted font-mono text-xs">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-text-muted font-mono text-xs">No tasks found.</p>
      ) : (
        <div className="relative space-y-3">
          {tasks.map((task, idx) => {
            const colors = statusColor(task.status);
            const isLast = idx === tasks.length - 1;

            return (
              <div key={task.id} className="relative flex gap-4">
                {/* Left column: dots and line */}
                <div className="relative flex flex-col items-center pt-1">
                  {/* Vertical line (extends down from dot) */}
                  {!isLast && (
                    <div className="bg-border-default/30 absolute top-6 left-1/2 h-12 w-0.5 -translate-x-1/2" />
                  )}

                  {/* Dot */}
                  <div
                    className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${colors.dot} border-bg-default ${
                      task.status === 'in_progress'
                        ? 'ring-phosphor-amber shadow-lg ring-2 ring-offset-2'
                        : ''
                    }`}
                  >
                    {task.status === 'in_progress' && (
                      <div className="bg-phosphor-amber/30 absolute inset-0 animate-pulse rounded-full" />
                    )}
                  </div>
                </div>

                {/* Right column: content card */}
                <div className="flex-1 pt-0.5">
                  <div
                    className={`rounded-lg border transition-all ${colors.bg} border-border-default/50 px-3 py-2.5`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-muted-foreground shrink-0 font-mono text-[10px] font-semibold tracking-wider uppercase">
                            {task.externalId}
                          </span>
                          <div className={`flex items-center gap-1 ${colors.text}`}>
                            <StatusIcon status={task.status} />
                          </div>
                        </div>
                        <p className="text-foreground truncate font-mono text-xs">{task.title}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {taskDuration(task)}
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase ${colors.bg} ${colors.text}`}
                        >
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
