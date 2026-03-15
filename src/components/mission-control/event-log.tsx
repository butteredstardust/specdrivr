'use client';

import { usePolling } from '@/hooks/use-polling';
import { TerminalLog } from '@/components/ui/terminal-log';

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

export function EventLog({ sessionId, className }: EventLogProps) {
  const url = sessionId !== null ? `/api/v1/sessions/${sessionId}/events?limit=30` : null;

  const { data, isLoading, error } = usePolling<AgentEvent[]>({
    url,
    interval: 5000,
  });

  const lines = error
    ? ['[ERROR] Could not load events. Retrying...']
    : isLoading && !data
      ? ['Connecting…']
      : (data ?? []).length === 0
        ? ['No events yet.']
        : (data ?? []).map((e: AgentEvent) => {
            const time = new Date(e.createdAt).toLocaleTimeString('en-US', { hour12: false });
            return `[${time}] [${e.eventType}] ${e.message}`;
          });

  return (
    <div className={className}>
      <p className="mb-2 font-mono text-xs tracking-widest text-[--text-muted] uppercase">
        EVENT LOG
      </p>
      <TerminalLog lines={lines} />
    </div>
  );
}
