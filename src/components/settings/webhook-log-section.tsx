'use client';

import { useState, useCallback } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusIcon } from '@/components/ui/status-icon';
import { Loader2, ChevronDown, ChevronRight, RotateCcw, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WebhookDeliverySelect } from '@/db/schema';

interface DeliveryMeta {
  page: number;
  total: number;
  pageSize: number;
}

type DeliveryRow = WebhookDeliverySelect & { endpointUrl: string | null };

interface WebhookDeliveriesPayload {
  items: DeliveryRow[];
  meta: DeliveryMeta;
}

interface WebhookLogSectionProps {
  projectId: number;
}

type DeliveryStatus = 'delivered' | 'failed' | 'pending' | 'exhausted';

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const classes: Record<string, string> = {
    delivered: 'bg-success-bg text-success',
    failed: 'bg-danger-bg text-danger',
    pending: 'bg-warning-bg text-warning',
    exhausted: 'bg-danger-bg text-danger',
  };

  const cls = classes[status] ?? 'bg-surface-raised text-fg-muted';

  return <span className={cn('rounded px-1.5 py-0.5 font-mono text-xs', cls)}>{status}</span>;
}

function formatTs(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function DeliveryRow({ entry }: { entry: DeliveryRow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-line hover:bg-surface-inset/50 cursor-pointer border-b last:border-0"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="text-fg px-4 py-2.5 font-mono text-xs">
          <span className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="text-fg-muted size-3 shrink-0" />
            ) : (
              <ChevronRight className="text-fg-muted size-3 shrink-0" />
            )}
            {entry.eventType}
          </span>
        </td>
        <td className="text-fg-muted max-w-[160px] truncate px-4 py-2.5 font-mono text-xs">
          {entry.endpointUrl ?? '—'}
        </td>
        <td className="px-4 py-2.5">
          <StatusBadge status={entry.status as DeliveryStatus} />
        </td>
        <td className="text-fg px-4 py-2.5 font-mono text-xs">{entry.responseStatus ?? '—'}</td>
        <td className="text-fg-muted px-4 py-2.5 font-mono text-xs">{formatTs(entry.createdAt)}</td>
        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="text-fg-muted h-auto gap-1 px-2 font-mono text-xs"
                >
                  <RotateCcw className="size-3" />
                  Retry
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono text-xs">
              Retry not yet available
            </TooltipContent>
          </Tooltip>
        </td>
      </tr>

      {expanded && (
        <tr className="border-line border-b">
          <td colSpan={6} className="px-4 pt-0 pb-3">
            <pre className="bg-surface-base text-fg max-h-48 overflow-auto rounded-md p-3 font-mono text-xs">
              {entry.responseBody || '(no response body)'}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

export function WebhookLogSection({ projectId }: WebhookLogSectionProps) {
  const [page, setPage] = useState(1);
  const [reqKey, setReqKey] = useState(0);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [meta, setMeta] = useState<DeliveryMeta | null>(null);

  const url = `/api/v1/projects/${projectId}/webhook-deliveries?page=${page}&_t=${reqKey}`;

  const stopWhen = useCallback((data: WebhookDeliveriesPayload) => {
    setDeliveries(data.items);
    setMeta(data.meta);
    return true;
  }, []);

  const onError = useCallback((err: Error) => {
    clientLogger.error('Failed to load webhook deliveries', err);
  }, []);

  const { isLoading, error, restart } = usePolling<WebhookDeliveriesPayload>({
    url,
    stopWhen,
    onError,
  });

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1;

  const goToPage = (next: number) => {
    setPage(next);
    setReqKey((k) => k + 1);
    restart();
  };

  if (isLoading) {
    return (
      <div className="text-fg-muted flex items-center gap-2">
        <Loader2 className="size-3 animate-spin" />
        <span className="font-mono text-xs">Loading webhook deliveries…</span>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-danger font-mono text-xs">Failed to load webhook deliveries.</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={restart}
          className="text-fg-muted hover:text-fg h-auto px-0 font-mono text-xs underline hover:bg-transparent"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!isLoading && deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <StatusIcon size={24} status="idle" />
        <p className="text-fg-muted font-mono text-sm">No webhook deliveries yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TooltipProvider>
        <div className="border-line overflow-x-auto rounded-lg border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-line bg-surface-raised border-b">
                <th className="text-fg-muted px-4 py-2 font-mono text-xs">Event</th>
                <th className="text-fg-muted px-4 py-2 font-mono text-xs">Endpoint</th>
                <th className="text-fg-muted px-4 py-2 font-mono text-xs">Status</th>
                <th className="text-fg-muted px-4 py-2 font-mono text-xs">HTTP Code</th>
                <th className="text-fg-muted px-4 py-2 font-mono text-xs">Timestamp</th>
                <th className="text-fg-muted px-4 py-2 font-mono text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((entry) => (
                <DeliveryRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      </TooltipProvider>

      {/* Pagination */}
      {meta && meta.total > meta.pageSize && (
        <div className="flex items-center justify-between">
          <span className="text-fg-muted font-mono text-xs">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="gap-1 font-mono text-xs"
            >
              <ChevronLeft className="size-3" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="gap-1 font-mono text-xs"
            >
              Next
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
