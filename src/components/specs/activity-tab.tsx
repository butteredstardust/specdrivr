'use client';

import { useState, useEffect } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
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
  if (eventType.startsWith('PLAN_')) return 'text-[--phosphor-amber]';
  if (eventType.startsWith('TASK_')) return 'text-[--accent-violet]';
  if (eventType.startsWith('SESSION_')) return 'text-[--text-secondary]';
  return 'text-[--text-muted]';
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
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
      <div className="py-8 text-center font-mono text-xs text-[--text-muted]">
        Loading activity…
      </div>
    );
  }

  // Sort newest first
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center font-mono text-xs text-[--text-muted]">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-1">
      {sorted.map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-3 rounded-sm px-3 py-2 hover:bg-[--bg-elevated]"
        >
          <span className="shrink-0 font-mono text-xs text-[--text-muted] tabular-nums">
            {formatTimestamp(event.timestamp)}
          </span>
          <span
            className={`shrink-0 rounded-sm bg-[--bg-elevated] px-1.5 py-0.5 font-mono text-xs ${eventTypeBadgeClass(event.type)}`}
          >
            {event.type}
          </span>
          <span className="text-sm text-[--text-secondary]">{event.message}</span>
        </div>
      ))}
    </div>
  );
}
