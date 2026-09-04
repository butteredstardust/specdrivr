'use client';

import { useState, useEffect } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { cn } from '@/lib/utils';
import { StatusIcon } from '@/components/ui/status-icon';
import type { SpecStatus } from '@/components/specs/spec-editor';

interface ActivityEvent {
  id: number | string;
  type: string;
  message: string;
  timestamp: string;
}

interface ActivityTabProps {
  specId: number;
  specStatus: SpecStatus;
}

function eventTypeBadgeClass(eventType: string): string {
  if (eventType.startsWith('PLAN_')) return 'text-warning';
  if (eventType.startsWith('TASK_')) return 'text-accent';
  if (eventType.startsWith('SESSION_')) return 'text-fg-secondary';
  return 'text-fg-muted';
}

function timeAgo(ts: string): string {
  const date = new Date(ts);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivityTab({ specId, specStatus }: ActivityTabProps): React.ReactElement {
  const isExecuting = specStatus === 'executing';
  const pollUrl = isExecuting ? `/api/v1/specs/${specId}/activity` : null;

  // Polled data when executing
  const { data: polledEvents } = usePolling<ActivityEvent[]>({
    url: pollUrl,
    interval: 10000,
  });

  // Static initial fetch for non-executing specs
  const [staticEvents, setStaticEvents] = useState<ActivityEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(!isExecuting);

  useEffect(() => {
    if (isExecuting) return; // polling handles it
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/specs/${specId}/activity`, { credentials: 'include' });
        if (!res.ok) {
          // Treat 404 or any error as empty
          if (!cancelled) setStaticEvents([]);
          return;
        }
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json.data ?? []);
        if (!cancelled) setStaticEvents(list);
      } catch (err) {
        clientLogger.error('ActivityTab: failed to fetch activity', err);
        if (!cancelled) setStaticEvents([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [specId, isExecuting]);

  const events = isExecuting ? (polledEvents ?? []) : (staticEvents ?? []);
  const loading = isExecuting ? false : isLoading;

  if (loading) {
    return (
      <div className="text-fg-muted py-8 text-center font-mono text-xs">Loading activity…</div>
    );
  }

  // Sort newest first
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <StatusIcon size={24} status="idle" />
        <p className="text-fg-secondary text-sm">No activity yet.</p>
        <p className="text-fg-muted font-mono text-xs italic">
          &quot;Events will be logged as the agent executes your plan.&quot;
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-fg-muted text-2xs mb-3">Activity Log</p>
      <div className="space-y-1">
        {sorted.map((event, idx) => (
          <div
            key={event.id}
            className={cn(
              'flex items-start gap-3 rounded-sm px-3 py-2',
              idx === 0 ? 'bg-warning-bg border-warning-border border' : 'hover:bg-surface-inset'
            )}
          >
            <span className="text-fg-muted shrink-0 font-mono text-xs tabular-nums">
              {timeAgo(event.timestamp)}
            </span>
            <span
              className={`bg-surface-inset shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-xs ${eventTypeBadgeClass(event.type)}`}
            >
              [{event.type}]
            </span>
            <span className="text-fg-secondary text-sm">{event.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
