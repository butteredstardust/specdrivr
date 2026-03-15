'use client';

import { useState, Fragment } from 'react';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { EventLog } from '@/components/mission-control/event-log';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

interface Session {
  id: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  endedAt?: string | null;
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  specId?: number | null;
  specTitle?: string;
}

const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'] as const;

function statusColor(status: Session['status']): string {
  switch (status) {
    case 'running':
      return 'text-green-400';
    case 'paused':
      return 'text-[--phosphor-amber]';
    case 'completed':
      return 'text-emerald-400';
    case 'failed':
      return 'text-red-400';
    case 'cancelled':
      return 'text-[--text-muted]';
    default:
      return 'text-[--text-muted]';
  }
}

function formatDuration(session: Session): string {
  const end = session.endedAt
    ? new Date(session.endedAt)
    : session.status === 'running'
      ? new Date()
      : null;
  if (!end) return '—';
  const ms = end.getTime() - new Date(session.startedAt).getTime();
  const secs = Math.floor(ms / 1000);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function formatStartedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export default function SessionsPage() {
  const { activeProjectId } = useShell();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const url = activeProjectId !== null ? `/api/v1/sessions?projectId=${activeProjectId}` : null;

  const { data: sessions, isLoading } = usePolling<Session[]>({
    url,
    interval: 5000,
    stopWhen: (data) =>
      Array.isArray(data) &&
      data.length > 0 &&
      data.every((s) => (TERMINAL_STATUSES as readonly string[]).includes(s.status)),
  });

  const handleRowClick = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const isEmpty = !isLoading && (!sessions || sessions.length === 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">SESSIONS</h1>

      {isLoading && !sessions && <p className="font-mono text-xs text-[--text-muted]">Loading…</p>}

      {isEmpty && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <DaemonMascot size={48} expression="idle" />
          <p className="font-mono text-xs text-[--text-muted]">No sessions yet.</p>
        </div>
      )}

      {!activeProjectId && !isLoading && (
        <p className="font-mono text-xs text-[--text-muted]">
          Select a project to view its sessions.
        </p>
      )}

      {sessions && sessions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[--border] text-left">
                <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  ID
                </th>
                <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  Status
                </th>
                <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  Spec
                </th>
                <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  Started
                </th>
                <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  Duration
                </th>
                <th className="pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  Tasks
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <Fragment key={session.id}>
                  <tr
                    className="cursor-pointer border-b border-[--border] transition-colors hover:bg-[--surface-hover]"
                    onClick={() => handleRowClick(session.id)}
                  >
                    <td className="py-3 pr-4 font-mono text-[--text-primary]">#{session.id}</td>
                    <td
                      className={`py-3 pr-4 font-mono font-semibold ${statusColor(session.status)}`}
                    >
                      {session.status.toUpperCase()}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[--text-secondary]">
                      {session.specTitle ?? (session.specId ? `Spec #${session.specId}` : '—')}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[--text-secondary]">
                      {formatStartedAt(session.startedAt)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[--text-muted]">
                      {formatDuration(session)}
                    </td>
                    <td className="py-3 font-mono text-[--text-secondary]">
                      {session.tasksSucceeded}/{session.tasksExecuted}
                    </td>
                  </tr>
                  <tr key={`${session.id}-log`}>
                    <td colSpan={6} className="p-0">
                      <Collapsible open={expandedId === session.id}>
                        <CollapsibleContent>
                          <div className="border-b border-[--border] px-4 py-4">
                            <EventLog sessionId={session.id} />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
