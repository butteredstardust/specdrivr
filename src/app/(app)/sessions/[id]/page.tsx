'use client';

import { use, useState } from 'react';
import { clientLogger } from '@/lib/logger-client';
import Link from 'next/link';
import { useSSE } from '@/hooks/use-sse';
import { Button } from '@/components/ui/button';
import { PixelBadge } from '@/components/ui/pixel-badge';
import { EventLog } from '@/components/mission-control/event-log';
import { TaskTimeline } from '@/components/sessions/task-timeline';
import { Play, Pause, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
    <div className="bg-bg-elevated border-border-default flex flex-col justify-center rounded border px-3 py-2">
      <p className="text-text-secondary font-mono text-[10px] tracking-widest uppercase">{label}</p>
      <p className="text-text-primary mt-0.5 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: AgentSession['status'] }) {
  if (!status) return null;
  switch (status) {
    case 'running':
      return (
        <PixelBadge variant="violet" dot>
          Running
        </PixelBadge>
      );
    case 'paused':
      return <PixelBadge variant="amber">Paused</PixelBadge>;
    case 'completed':
      return <PixelBadge variant="emerald">Done</PixelBadge>;
    case 'failed':
      return <PixelBadge variant="red">Failed</PixelBadge>;
    case 'cancelled':
      return <PixelBadge variant="muted">Cancelled</PixelBadge>;
    default:
      return <PixelBadge>{status}</PixelBadge>;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SessionDetailPage({ params }: PageProps) {
  const { id: rawId } = use(params);
  const id = parseInt(rawId, 10);
  const sessionLabel = `SES-${String(id).padStart(3, '0')}`;
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    data: session,
    isLoading,
    mutate,
  } = useSSE<AgentSession>({
    url: `/api/v1/sessions/${id}`,
    sseUrl: `/api/v1/sessions/${id}/stream`,
  });

  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/v1/sessions/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        clientLogger.error('Session action failed', {
          action,
          sessionId: id,
          status: response.status,
          body,
        });
        return;
      }
      mutate();
    } finally {
      setIsUpdating(false);
    }
  };

  const totalTasks = session?.tasksExecuted || 0;
  const progressPercent = totalTasks > 0 ? ((session?.tasksSucceeded || 0) / totalTasks) * 100 : 0;

  return (
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      <div className="border-border-default flex items-center justify-between border-b px-6 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="text-text-secondary font-mono text-xs tracking-[0.2em] uppercase">
            Executor
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="text-foreground truncate text-xl font-semibold">Session</h1>
            <code className="bg-phosphor-amber/10 text-phosphor-amber shrink-0 rounded px-1.5 py-0.5 font-mono text-xs">
              {sessionLabel}
            </code>
            {session && <StatusBadge status={session.status} />}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {session?.status === 'running' && (
            <Button
              size="sm"
              variant="outline"
              className="border-phosphor-amber/50 text-phosphor-amber hover:bg-phosphor-amber/10"
              onClick={() => handleAction('pause')}
              disabled={isUpdating}
            >
              <Pause className="mr-1.5 h-3.5 w-3.5" />
              Pause
            </Button>
          )}
          {session?.status === 'paused' && (
            <Button
              size="sm"
              variant="outline"
              className="border-status-emerald/50 text-status-emerald hover:bg-status-emerald/10"
              onClick={() => handleAction('resume')}
              disabled={isUpdating}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Resume
            </Button>
          )}
          {session && !TERMINAL_STATUSES.includes(session.status) && (
            <Button
              size="sm"
              variant="outline"
              className="border-status-red/50 text-status-red hover:bg-status-red/10 h-8 font-mono text-[10px] tracking-widest uppercase"
              onClick={() => handleAction('cancel')}
              disabled={isUpdating}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
          {session?.specId && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/specs/${session.specId}`}>View Spec →</Link>
            </Button>
          )}
        </div>
      </div>

      {(session || isLoading) && (
        <div className="border-border-default grid grid-cols-5 gap-4 border-b px-6 py-4">
          <StatBox label="Started" value={timeAgo(session?.startedAt)} />
          <StatBox label="Duration" value={formatDuration(session)} />
          <div className="bg-bg-elevated border-border-default col-span-2 flex flex-col justify-center rounded border px-3 py-2">
            <div className="mb-1.5 flex items-end justify-between">
              <p className="text-text-secondary font-mono text-[10px] tracking-widest uppercase">
                Progress
              </p>
              <p className="text-text-primary font-mono text-[10px] font-semibold">
                {session?.tasksSucceeded ?? 0} / {session?.tasksExecuted ?? 0}
              </p>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          <StatBox label="Failed" value={String(session?.tasksFailed ?? 0)} />
        </div>
      )}

      <div className="divide-border-default flex min-h-0 flex-1 divide-x overflow-hidden">
        <div className="w-1/2 overflow-y-auto p-4">
          <TaskTimeline sessionId={id} />
        </div>

        <div className="flex w-1/2 flex-col overflow-y-auto p-4">
          <p className="text-text-secondary mb-3 font-mono text-[10px] tracking-widest uppercase">
            Session Log
          </p>
          <p className="text-text-secondary mb-3 font-mono text-xs">
            $ specdrivr agent start --session {sessionLabel}
          </p>
          <EventLog sessionId={id} className="flex min-h-0 flex-1 flex-col" />
        </div>
      </div>
    </div>
  );
}
