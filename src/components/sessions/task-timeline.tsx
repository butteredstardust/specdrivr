'use client';

import { useState, useEffect } from 'react';
import { usePolling } from '@/hooks/use-polling';

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

function statusBorderColor(status: string): string {
  switch (status) {
    case 'in_progress':
      return 'var(--color-phosphor-amber, #f59e0b)';
    case 'done':
      return 'var(--color-status-emerald, #10b981)';
    case 'blocked':
    case 'failed':
      return 'var(--color-status-red, #ef4444)';
    case 'skipped':
      return 'var(--color-text-muted, #6b7280)';
    default:
      return 'var(--color-border-default, #374151)';
  }
}

function StatusBadge({ status }: { status: string }) {
  const base = 'font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0';
  switch (status) {
    case 'in_progress':
      return <span className={`${base} bg-phosphor-amber/10 text-phosphor-amber`}>running</span>;
    case 'done':
      return <span className={`${base} bg-status-emerald/10 text-status-emerald`}>done</span>;
    case 'blocked':
      return <span className={`${base} bg-status-red/10 text-status-red`}>blocked</span>;
    case 'failed':
      return <span className={`${base} bg-status-red/10 text-status-red`}>failed</span>;
    case 'skipped':
      return <span className={`${base} bg-secondary text-muted-foreground`}>skipped</span>;
    default:
      return <span className={`${base} bg-secondary text-muted-foreground`}>{status}</span>;
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

  return <span className="text-text-muted w-12 text-right font-mono text-[10px]">{elapsed}</span>;
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
      <span className="text-text-muted w-12 text-right font-mono text-[10px]">
        {mm}:{ss}
      </span>
    );
  }
  return <span className="text-text-muted w-12 text-right font-mono text-[10px]">—</span>;
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
      <p className="text-text-muted mb-3 font-mono text-[9px] tracking-widest uppercase">
        Task Execution Timeline
      </p>
      {isLoading && tasks.length === 0 ? (
        <p className="text-text-muted font-mono text-xs">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-text-muted font-mono text-xs">No tasks found.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 border-l-2 py-2 pl-3"
              style={{ borderColor: statusBorderColor(task.status) }}
            >
              <span className="text-text-muted w-12 shrink-0 font-mono text-[10px]">
                {task.externalId}
              </span>
              <span className="text-text-primary flex-1 truncate font-mono text-xs">
                {task.title}
              </span>
              {taskDuration(task)}
              <StatusBadge status={task.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
