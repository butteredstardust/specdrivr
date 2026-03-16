'use client';

import { usePolling } from '@/hooks/use-polling';

interface AgentEvent {
  id: number;
  sessionId: number;
  eventType: string;
  message: string;
  createdAt: string;
}

interface EventLogProps {
  sessionId: number | null;
  className?: string;
}

const EVENT_BADGE: Record<string, { label: string; className: string }> = {
  TASK_DONE: { label: 'TASK_DONE', className: 'text-status-emerald bg-status-emerald/10' },
  TASK_FAILED: { label: 'TASK_FAILED', className: 'text-status-red bg-status-red/10' },
  TASK_BLOCKED: { label: 'BLOCKED', className: 'text-phosphor-amber bg-phosphor-amber/10' },
  TASK_START: { label: 'TASK_START', className: 'text-text-secondary bg-bg-elevated' },
  SESSION_COMPLETED: {
    label: 'SESSION_DONE',
    className: 'text-status-emerald bg-status-emerald/10',
  },
  SESSION_FAILED: { label: 'SESSION_FAIL', className: 'text-status-red bg-status-red/10' },
  SESSION_PAUSED: { label: 'PAUSED', className: 'text-phosphor-amber bg-phosphor-amber/10' },
};

const DEFAULT_BADGE = { label: '', className: 'text-text-muted bg-bg-elevated' };

export function EventLog({ sessionId, className }: EventLogProps) {
  const url = sessionId !== null ? `/api/v1/sessions/${sessionId}/events?limit=30` : null;

  const { data, isLoading, error } = usePolling<AgentEvent[]>({
    url,
    interval: 5000,
  });

  const events = Array.from(new Map((data ?? []).map((e) => [e.id, e])).values());

  return (
    <div className={className}>
      <p className="text-muted-foreground mb-2 font-mono text-[10px] tracking-[0.15em] uppercase">Event Log</p>

      <div className="bg-bg-elevated border-border-default rounded border">
        {error ? (
          <p className="text-status-red px-3 py-2 font-mono text-xs">
            Could not load events. Retrying...
          </p>
        ) : isLoading && events.length === 0 ? (
          <p className="text-muted-foreground px-3 py-2 font-mono text-xs">Connecting…</p>
        ) : sessionId === null || events.length === 0 ? (
          <p className="text-muted-foreground px-3 py-2 font-mono text-xs">No active session.</p>
        ) : (
          <ul className="divide-border-default divide-y">
            {events.map((e) => {
              const badge = EVENT_BADGE[e.eventType] ?? { ...DEFAULT_BADGE, label: e.eventType };
              const time = new Date(e.createdAt).toLocaleTimeString('en-US', { hour12: false });
              return (
                <li key={e.id} className="flex items-center gap-2 px-3 py-1.5">
                  <span className="text-muted-foreground w-16 shrink-0 font-mono text-[10px]">
                    {time}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase ${badge.className}`}
                  >
                    {badge.label || e.eventType}
                  </span>
                  <span className="text-foreground truncate font-mono text-[10px]">
                    {e.message}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
