'use client';

import { use } from 'react';
import Link from 'next/link';
import { usePolling } from '@/hooks/use-polling';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { EventLog } from '@/components/mission-control/event-log';
import { TaskTimeline } from '@/components/sessions/task-timeline';

interface AgentSession {
  id: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  specId?: number | null;
  planId?: number | null;
  startedAt: string;
  endedAt?: string | null;
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
}

const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'];

function sessionToExpression(status?: string) {
  switch (status) {
    case 'running':
      return 'working' as const;
    case 'paused':
      return 'blocked' as const;
    case 'completed':
      return 'success' as const;
    case 'failed':
      return 'error' as const;
    default:
      return 'idle' as const;
  }
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDuration(session?: AgentSession | null): string {
  if (!session) return '—';
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

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-elevated border-border-default rounded border px-3 py-2">
      <p className="text-text-muted font-mono text-[9px] tracking-widest uppercase">{label}</p>
      <p className="text-text-primary mt-0.5 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: AgentSession['status'] }) {
  if (!status) return null;
  const base =
    'font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded inline-flex items-center gap-1.5';
  const dot = 'h-1.5 w-1.5 rounded-full shrink-0';
  switch (status) {
    case 'running':
      return (
        <span className={`${base} bg-accent-violet/10 text-accent-violet`}>
          <span className={`${dot} bg-accent-violet animate-pulse`} />
          Running
        </span>
      );
    case 'paused':
      return (
        <span className={`${base} bg-phosphor-amber/10 text-phosphor-amber`}>
          <span className={`${dot} bg-phosphor-amber`} />
          Paused
        </span>
      );
    case 'completed':
      return (
        <span className={`${base} bg-status-emerald/10 text-status-emerald`}>
          <span className={`${dot} bg-status-emerald`} />
          Done
        </span>
      );
    case 'failed':
      return (
        <span className={`${base} bg-status-red/10 text-status-red`}>
          <span className={`${dot} bg-status-red`} />
          Failed
        </span>
      );
    case 'cancelled':
      return (
        <span className={`${base} bg-secondary text-muted-foreground`}>
          <span className={`${dot} bg-muted-foreground`} />
          Cancelled
        </span>
      );
    default:
      return <span className={`${base} bg-secondary text-muted-foreground`}>{status}</span>;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SessionDetailPage({ params }: PageProps) {
  const { id: rawId } = use(params);
  const id = parseInt(rawId, 10);
  const sessionLabel = `SES-${String(id).padStart(3, '0')}`;

  const { data: session, isLoading } = usePolling<AgentSession>({
    url: `/api/v1/sessions/${id}`,
    interval: 5000,
    stopWhen: (s) => TERMINAL_STATUSES.includes(s.status),
  });

  return (
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      {/* Header */}
      <div className="border-border-default flex items-center gap-3 border-b px-6 py-4">
        <DaemonMascot size={24} expression={sessionToExpression(session?.status)} />
        <div className="min-w-0 flex-1">
          <h1 className="font-mono text-sm font-semibold">{sessionLabel}</h1>
        </div>
        {session && <StatusBadge status={session.status} />}
        {session?.specId && (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/specs/${session.specId}`}>View Spec →</Link>
          </Button>
        )}
      </div>

      {/* Stat boxes */}
      {(session || isLoading) && (
        <div className="border-border-default grid grid-cols-4 gap-4 border-b px-6 py-4">
          <StatBox label="Started" value={timeAgo(session?.startedAt)} />
          <StatBox label="Duration" value={formatDuration(session)} />
          <StatBox
            label="Succeeded"
            value={`${session?.tasksSucceeded ?? 0}/${session?.tasksExecuted ?? 0}`}
          />
          <StatBox label="Failed" value={String(session?.tasksFailed ?? 0)} />
        </div>
      )}

      {/* Two-column body */}
      <div className="divide-border-default flex min-h-0 flex-1 divide-x overflow-hidden">
        {/* Left: Task Execution Timeline */}
        <div className="w-1/2 overflow-y-auto p-4">
          <TaskTimeline sessionId={id} />
        </div>

        {/* Right: Session Log */}
        <div className="w-1/2 overflow-y-auto p-4">
          <p className="text-text-muted mb-3 font-mono text-[9px] tracking-widest uppercase">
            Session Log
          </p>
          <p className="text-text-muted mb-3 font-mono text-xs">
            $ specdrivr agent start --session {sessionLabel}
          </p>
          <EventLog sessionId={id} />
        </div>
      </div>
    </div>
  );
}
