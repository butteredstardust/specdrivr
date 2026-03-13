'use client';

import React from 'react';
import { usePolling } from '@/hooks/use-polling';
import { PixelBadge, PixelEmptyState, PixelPulse } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import Link from 'next/link';

interface AgentEvent {
  id: string;
  eventType: string; // TASK_DONE, BLOCKED, ERROR, PLAN_GEN, etc.
  message: string;
  metadata?: unknown;
  createdAt: string;
  entityId?: string; // T-019, SPEC-003
}

export function EventLog({ activeSessionId }: { activeSessionId?: string | null }) {
  const { data: eventsData } = usePolling<{ data: AgentEvent[] }>({
    url: activeSessionId ? `/api/v1/sessions/${activeSessionId}/events?limit=30` : '',
    interval: 5000,
    enabled: !!activeSessionId,
  });

  const getEventTone = (eventType: string) => {
    if (eventType.startsWith('TASK_DONE')) return 'green';
    if (eventType.startsWith('BLOCKED')) return 'gold';
    if (eventType.startsWith('ERROR')) return 'red';
    if (eventType.startsWith('PLAN_')) return 'purple';
    return 'neutral';
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return '00:00:00';
    }
  };

  const events = eventsData?.data || [];

  if (!activeSessionId || events.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <PixelEmptyState
          icon={<DaemonMascot size="sm" state="idle" />}
          title="No events yet."
          description="Events will appear here once execution begins."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4">
        <span className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
          Event Log
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex flex-col gap-3">
          {events.map((event, idx) => (
            <div key={event.id} className="flex items-start gap-3">
              <div className="flex w-16 shrink-0 items-center justify-end gap-1 font-mono text-xs text-[--text-muted]">
                {idx === 0 && activeSessionId && <PixelPulse>Live</PixelPulse>}
                {formatTime(event.createdAt)}
              </div>
              <PixelBadge tone={getEventTone(event.eventType)}>{event.eventType}</PixelBadge>
              {event.entityId && (
                <span className="font-mono text-xs text-[--phosphor-amber]">{event.entityId}</span>
              )}
              <span className="truncate text-xs text-[--text-secondary]">{event.message}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-[--border-muted] pt-4 text-right">
        <Link href="/sessions" className="text-xs text-[--accent-violet] hover:underline">
          View all →
        </Link>
      </div>
    </div>
  );
}
