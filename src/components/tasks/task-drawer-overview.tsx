'use client';

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { RefreshCw, MessageSquareQuote, ExternalLink, Github } from 'lucide-react';
import { clientLogger } from '@/lib/logger-client';
import { StatusIcon } from '@/components/ui/status-icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EntityId } from '@/components/ui/entity-id';
import type { Task } from './task-drawer';

interface TaskDrawerOverviewProps {
  task: Task;
  onRetry: (humanContext?: string) => Promise<void>;
}

export function TaskDrawerOverview({ task, onRetry }: TaskDrawerOverviewProps) {
  const [humanContext, setHumanContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRetryWithContext = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onRetry(humanContext);
      setHumanContext('');
    } catch (err) {
      clientLogger.error('Retry with context error', err);
      toast.error('Retry not yet available');
    } finally {
      setIsSubmitting(false);
    }
  }, [humanContext, onRetry]);

  return (
    <div className="space-y-8 p-6">
      {/* Description */}
      <div className="prose prose-sm prose-invert max-w-none">
        <ReactMarkdown>{task.description ?? ''}</ReactMarkdown>
      </div>

      {/* Dependencies */}
      {task.dependsOn.length > 0 && (
        <div className="space-y-3">
          <span className="text-fg-muted font-mono text-[11px] tracking-[0.08em] uppercase">
            Dependencies
          </span>
          <div className="flex flex-wrap gap-2">
            {task.dependsOn.map((extId) => (
              <EntityId key={extId} chip>
                {extId}
              </EntityId>
            ))}
          </div>
        </div>
      )}

      {/* GitHub PR Link */}
      {task.pullRequestUrl && (
        <div className="bg-surface-inset/50 border-line-subtle flex items-center justify-between rounded-md border p-4">
          <div className="flex items-center gap-3">
            <Github className="h-5 w-5 opacity-70" />
            <div className="flex flex-col gap-0.5">
              <span className="text-fg-muted font-mono text-[10px] tracking-[0.08em] uppercase">
                PULL REQUEST
              </span>
              <span className="text-fg text-sm font-medium">Automated Contribution</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => window.open(task.pullRequestUrl!, '_blank')}
          >
            VIEW ON GITHUB
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Blocked state panel */}
      {task.status === 'blocked' && (
        <div className="bg-warning-bg border-warning-border space-y-4 rounded-md border p-5">
          <div className="flex items-center gap-2.5">
            <StatusIcon size={18} status="blocked" />
            <span className="text-warning font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
              BLOCKED
            </span>
          </div>
          {task.blockedReason && (
            <p className="text-fg-secondary text-sm leading-relaxed">{task.blockedReason}</p>
          )}
          <div className="space-y-3 pt-2">
            <Textarea
              placeholder="Add context to unblock DAEMON (min 10 chars)..."
              value={humanContext}
              onChange={(e) => setHumanContext(e.target.value)}
              className="bg-surface-base border-line min-h-[100px] text-sm"
              rows={3}
            />
            <Button
              variant="warning"
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
        <div className="bg-danger-bg border-danger-border space-y-4 rounded-md border p-5">
          <div className="flex items-center gap-2.5">
            <StatusIcon size={18} status="error" />
            <span className="text-danger font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
              FAILED
            </span>
          </div>
          {task.blockedReason && (
            <p className="text-fg-secondary text-sm leading-relaxed">{task.blockedReason}</p>
          )}
          <div className="pt-2">
            <Button
              variant="info"
              size="sm"
              onClick={() => void onRetry()}
              className="h-8 w-full gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              RETRY TASK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
