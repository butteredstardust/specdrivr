'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { overrideTaskStatusAction, retryTaskAction, unblockTaskAction } from '@/actions/tasks';
import type { Task } from './task-drawer';

/**
 * The mutations the drawer can perform on the task it is showing.
 *
 * Each one reports the updated row back through `onUpdated` so the drawer can
 * show it immediately rather than waiting for the next poll.
 */
export function useTaskActions(task: Task | null, onUpdated: (task: Task) => void) {
  const [isActioning, setIsActioning] = useState(false);

  const changeStatus = useCallback(
    async (newStatus: string) => {
      if (!task) return;
      try {
        const res = await fetch(`/api/v1/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          clientLogger.error('Failed to update task status', errBody);
          toast.error('Failed to update status');
          return;
        }
        const json = await res.json();
        onUpdated(json.data !== undefined ? json.data : json);
        toast.success(`Task marked as ${newStatus}`);
      } catch (err) {
        clientLogger.error('Status change error', err);
        toast.error('Failed to update status');
      }
    },
    [task, onUpdated]
  );

  /**
   * Manual completion bypasses the agent workflow, so it is the one mutation
   * that demands a written reason for the audit trail.
   */
  const forceMarkDone = useCallback(
    async (reason: string) => {
      if (!task || task.status === 'done') return false;
      if (!reason.trim()) {
        toast.error('Add a reason for the manual completion.');
        return false;
      }
      setIsActioning(true);
      try {
        const formData = new FormData();
        formData.set('id', String(task.id));
        formData.set('status', 'done');
        formData.set('notes', reason.trim());
        const result = await overrideTaskStatusAction(formData);
        if (!result.success || !result.data) {
          throw new Error(result.error?.message ?? 'Manual completion failed');
        }
        toast.success('Task marked as done.');
        onUpdated(result.data as Task);
        return true;
      } catch (err) {
        clientLogger.error('Mark done error', err);
        toast.error('Failed to mark as done');
        return false;
      } finally {
        setIsActioning(false);
      }
    },
    [task, onUpdated]
  );

  /** Blocked tasks unblock with context; everything else is a plain retry. */
  const retry = useCallback(
    async (humanContext?: string) => {
      if (!task) return;
      setIsActioning(true);
      try {
        const formData = new FormData();
        formData.set('id', String(task.id));
        let result;
        if (task.status === 'blocked') {
          formData.set('humanContext', humanContext ?? '');
          result = await unblockTaskAction(formData);
        } else {
          result = await retryTaskAction(formData);
        }
        if (!result.success || !result.data) {
          throw new Error(result.error?.message ?? 'Retry failed');
        }
        onUpdated(result.data as Task);
        toast.success('Task queued for retry.');
      } catch (err) {
        clientLogger.error('Retry failed', err);
        toast.error('Failed to retry task');
      } finally {
        setIsActioning(false);
      }
    },
    [task, onUpdated]
  );

  return { isActioning, changeStatus, forceMarkDone, retry };
}
