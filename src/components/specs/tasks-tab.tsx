'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { TaskRow } from '@/components/ui/task-row';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { useTaskDrawer } from '@/components/shell/task-drawer-context';
import type { UserRole } from '@/db/schema';

type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'failed' | 'skipped';

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  description?: string | null;
  errorMessage?: string | null;
  orderIndex: number;
}

interface TasksTabProps {
  specId: number;
  userRole: UserRole;
}

const TERMINAL_STATUSES: TaskStatus[] = ['done', 'failed', 'skipped'];

export function TasksTab({ specId, userRole }: TasksTabProps): React.ReactElement {
  const { openDrawer } = useTaskDrawer();

  const { data: tasks, isLoading } = usePolling<Task[]>({
    url: `/api/v1/tasks?specId=${specId}`,
    interval: 5000,
    stopWhen: (list) =>
      Array.isArray(list) &&
      list.length > 0 &&
      list.every((t) => TERMINAL_STATUSES.includes(t.status)),
  });

  const handleUnblock = useCallback(async (taskId: number) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'todo' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Task unblocked.');
    } catch (err) {
      clientLogger.error('TasksTab: unblock failed', err);
      toast.error('Failed to unblock task.');
    }
  }, []);

  const handleOverride = useCallback(async (taskId: number, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Task status set to ${newStatus}.`);
    } catch (err) {
      clientLogger.error('TasksTab: override failed', err);
      toast.error('Failed to override task status.');
    }
  }, []);

  if (isLoading) {
    return <div className="text-text-muted py-8 text-center font-mono text-xs">Loading tasks…</div>;
  }

  const list = tasks ?? [];

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <DaemonMascot size={48} expression="idle" />
        <p className="text-text-secondary font-mono text-sm">
          No tasks yet. Approve the plan to begin execution.
        </p>
      </div>
    );
  }

  const total = list.length;
  const done = list.filter((t) => t.status === 'done').length;
  const failed = list.filter((t) => t.status === 'failed').length;
  const inProgress = list.filter((t) => t.status === 'in_progress').length;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="border-border-default bg-bg-elevated flex items-center gap-4 rounded-md border px-4 py-2">
        <span className="text-text-muted font-mono text-xs">
          Total: <span className="text-text-primary">{total}</span>
        </span>
        <span className="font-mono text-xs text-emerald-400">Done: {done}</span>
        {failed > 0 && <span className="text-status-red font-mono text-xs">Failed: {failed}</span>}
        {inProgress > 0 && (
          <span className="text-accent-violet font-mono text-xs">In Progress: {inProgress}</span>
        )}
      </div>

      {/* Task list */}
      <div className="space-y-1">
        {list.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            userRole={userRole}
            onUnblock={handleUnblock}
            onOverride={handleOverride}
            onOpenDrawer={openDrawer}
          />
        ))}
      </div>
    </div>
  );
}
