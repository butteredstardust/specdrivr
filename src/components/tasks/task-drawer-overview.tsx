'use client';

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Task } from './task-drawer';

interface TaskDrawerOverviewProps {
  task: Task;
  onRetry: () => Promise<void>;
  onTaskUpdated: (task: Task) => void;
}

export function TaskDrawerOverview({ task, onRetry, onTaskUpdated }: TaskDrawerOverviewProps) {
  const [humanContext, setHumanContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRetryWithContext = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // First patch humanContext
      const patchRes = await fetch(`/api/v1/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ humanContext }),
      });

      if (!patchRes.ok) {
        toast.error('Failed to save context');
        setIsSubmitting(false);
        return;
      }

      const patchJson = await patchRes.json();
      const patched = patchJson.data !== undefined ? patchJson.data : patchJson;
      if (patched?.id) onTaskUpdated(patched);

      // Then delegate to parent retry logic
      await onRetry();
      setHumanContext('');
    } catch (err) {
      clientLogger.error('Retry with context error', err);
      toast.error('Retry not yet available');
    } finally {
      setIsSubmitting(false);
    }
  }, [task.id, humanContext, onTaskUpdated, onRetry]);

  return (
    <div className="space-y-6 p-5">
      {/* Description */}
      <div className="prose prose-sm prose-invert max-w-none">
        <ReactMarkdown>{task.description ?? ''}</ReactMarkdown>
      </div>

      {/* Dependencies */}
      {task.dependsOn.length > 0 && (
        <div className="space-y-2">
          <span className="text-text-muted font-mono text-xs tracking-widest uppercase">
            Dependencies
          </span>
          <div className="flex flex-wrap gap-1.5">
            {task.dependsOn.map((extId) => (
              <span
                key={extId}
                className="bg-phosphor-amber/10 text-phosphor-amber rounded-sm px-1.5 py-0.5 font-mono text-xs"
              >
                {extId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Blocked state panel */}
      {task.status === 'blocked' && (
        <div className="bg-status-red/10 border-status-red/30 space-y-3 rounded-md border p-4">
          <div className="flex items-center gap-2">
            <DaemonMascot size={24} expression="blocked" />
            <span className="text-status-red font-mono text-xs tracking-widest uppercase">
              BLOCKED
            </span>
          </div>
          {task.blockedReason && (
            <p className="text-text-secondary text-sm">{task.blockedReason}</p>
          )}
          <Textarea
            placeholder="Add context for retry (min 10 chars)..."
            value={humanContext}
            onChange={(e) => setHumanContext(e.target.value)}
            className="text-sm"
            rows={3}
          />
          <Button
            size="sm"
            disabled={humanContext.length < 10 || isSubmitting}
            onClick={handleRetryWithContext}
          >
            RETRY WITH CONTEXT
          </Button>
        </div>
      )}

      {/* Failed state panel */}
      {task.status === 'failed' && (
        <div className="bg-phosphor-amber/10 border-phosphor-amber/30 space-y-3 rounded-md border p-4">
          <div className="flex items-center gap-2">
            <DaemonMascot size={24} expression="error" />
            <span className="text-phosphor-amber font-mono text-xs tracking-widest uppercase">
              FAILED
            </span>
          </div>
          {task.blockedReason && (
            <p className="text-text-secondary font-mono text-xs">{task.blockedReason}</p>
          )}
          <Button size="sm" onClick={onRetry}>
            RETRY
          </Button>
        </div>
      )}
    </div>
  );
}
