'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { TaskRow } from '@/components/ui/task-row';
import { StatusIcon } from '@/components/ui/status-icon';
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
  externalId: string;
  dependsOn?: string[] | null;
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

  const handleUnblock = useCallback(
    (taskId: number) => {
      openDrawer(taskId);
      toast.info('Add resolution context in the task details to unblock it.');
    },
    [openDrawer]
  );

  const handleOverride = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      if (newStatus === 'done') {
        openDrawer(taskId);
        toast.info('Record a completion reason in the task details.');
        return;
      }

      try {
        const res = await fetch(`/api/v1/tasks/${taskId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, notes: 'Manual override from task list' }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success(`Task status set to ${newStatus}.`);
      } catch (err) {
        clientLogger.error('TasksTab: override failed', err);
        toast.error('Failed to override task status.');
      }
    },
    [openDrawer]
  );

  if (isLoading) {
    return <div className="text-fg-muted py-8 text-center font-mono text-xs">Loading tasks…</div>;
  }

  const list = tasks ?? [];

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <StatusIcon size={24} status="idle" />
        <p className="text-fg-secondary text-sm">No tasks yet.</p>
        <p className="text-fg-muted font-mono text-xs italic">
          &quot;Approve the plan to begin task execution.&quot;
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
      <div className="border-line bg-surface-inset flex items-center gap-4 rounded-md border px-4 py-2">
        <span className="text-fg-muted font-mono text-xs">
          Total: <span className="text-fg">{total}</span>
        </span>
        <span className="text-success font-mono text-xs">Done: {done}</span>
        {failed > 0 && <span className="text-danger font-mono text-xs">Failed: {failed}</span>}
        {inProgress > 0 && (
          <span className="text-accent font-mono text-xs">In progress: {inProgress}</span>
        )}
      </div>

      {list.every((t) => t.status === 'todo') && (
        <div className="border-line bg-surface-inset rounded border px-3 py-2">
          <p className="text-fg-muted text-2xs">Tasks will begin executing after plan approval.</p>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-1">
        {list.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            externalId={task.externalId}
            dependsOn={task.dependsOn ?? undefined}
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
