'use client';

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { RefreshCw, MessageSquareQuote } from 'lucide-react';
import { clientLogger } from '@/lib/logger-client';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PixelBadge } from '@/components/ui/pixel-badge';
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
    <div className="space-y-8 p-6">
      {/* Description */}
      <div className="prose prose-sm prose-invert max-w-none">
        <ReactMarkdown>{task.description ?? ''}</ReactMarkdown>
      </div>

      {/* Dependencies */}
      {task.dependsOn.length > 0 && (
        <div className="space-y-3">
          <span className="text-text-muted font-mono text-xs tracking-widest uppercase">
            Dependencies
          </span>
          <div className="flex flex-wrap gap-2">
            {task.dependsOn.map((extId) => (
              <PixelBadge key={extId} variant="default">
                {extId}
              </PixelBadge>
            ))}
          </div>
        </div>
      )}

      {/* Blocked state panel */}
      {task.status === 'blocked' && (
        <div className="bg-phosphor-amber/5 border-phosphor-amber/30 space-y-4 rounded-lg border p-5">
          <div className="flex items-center gap-2.5">
            <DaemonMascot size={24} expression="blocked" />
            <span className="text-phosphor-amber font-mono text-xs font-semibold tracking-widest uppercase">
              BLOCKED
            </span>
          </div>
          {task.blockedReason && (
            <p className="text-text-secondary text-sm leading-relaxed">{task.blockedReason}</p>
          )}
          <div className="space-y-3 pt-2">
            <Textarea
              placeholder="Add context to unblock DAEMON (min 10 chars)..."
              value={humanContext}
              onChange={(e) => setHumanContext(e.target.value)}
              className="bg-bg-base border-border-default focus:ring-phosphor-amber/30 min-h-[100px] text-sm focus:ring-1"
              rows={3}
            />
            <Button
              variant="phosphor"
              size="sm"
              disabled={humanContext.length < 10 || isSubmitting}
              onClick={handleRetryWithContext}
              className="h-8 w-full gap-1.5"
            >
              <MessageSquareQuote className="h-3.5 w-3.5" />
              RETRY WITH CONTEXT
            </Button>
          </div>
        </div>
      )}

      {/* Failed state panel */}
      {task.status === 'failed' && (
        <div className="bg-status-red/5 border-status-red/30 space-y-4 rounded-lg border p-5">
          <div className="flex items-center gap-2.5">
            <DaemonMascot size={24} expression="error" />
            <span className="text-status-red font-mono text-xs font-semibold tracking-widest uppercase">
              FAILED
            </span>
          </div>
          {task.blockedReason && (
            <p className="text-text-secondary text-sm leading-relaxed">{task.blockedReason}</p>
          )}
          <div className="pt-2">
            <Button variant="violet" size="sm" onClick={onRetry} className="h-8 w-full gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              RETRY TASK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
