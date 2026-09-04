'use client';

import { use, useState } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { formatElapsed } from '@/lib/utils';
import Link from 'next/link';
import { useSSE } from '@/hooks/use-sse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventLog } from '@/components/mission-control/event-log';
import { TaskTimeline } from '@/components/sessions/task-timeline';
import { Play, Pause, XCircle, ExternalLink, AlertCircle, Github } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  pullRequestUrl?: string | null;
  errorMessage?: string | null;
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
  return formatElapsed(ms / 1000);
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-inset border-line flex flex-col justify-center rounded border px-3 py-2">
      <p className="text-fg-secondary text-2xs">{label}</p>
      <p className="text-fg mt-0.5 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: AgentSession['status'] }) {
  if (!status) return null;
  switch (status) {
    case 'running':
      return (
        <Badge variant="info" dot>
          Running
        </Badge>
      );
    case 'paused':
      return <Badge variant="warning">Paused</Badge>;
    case 'completed':
      return <Badge variant="success">Done</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'cancelled':
      return <Badge variant="muted">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
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
    <div className="full-bleed fill-shell flex flex-col">
      <div className="border-line flex items-center justify-between border-b px-6 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="text-fg-secondary text-xs">Executor</div>
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="text-fg truncate text-2xl leading-tight font-semibold tracking-[-0.015em]">
              Session
            </h1>
            <code className="bg-warning-bg text-warning shrink-0 rounded px-1.5 py-0.5 font-mono text-xs">
              {sessionLabel}
            </code>
            {session && <StatusBadge status={session.status} />}
            {session?.pullRequestUrl && (
              <Button
                variant="outline"
                size="sm"
                className="border-line bg-surface-inset h-7 gap-1.5 px-2 py-0"
                onClick={() => window.open(session.pullRequestUrl!, '_blank')}
              >
                <Github className="h-3.5 w-3.5" />
                <span className="text-2xs font-medium tracking-tight">View PR</span>
                <ExternalLink className="h-3 w-3 opacity-50" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {session?.status === 'running' && (
            <Button
              size="sm"
              variant="outline"
              className="border-warning-border text-warning hover:bg-warning-bg"
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
              className="border-success-border text-success hover:bg-success-bg"
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
              className="border-danger-border text-danger hover:bg-danger-bg text-2xs h-8"
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
        <div className="border-line grid grid-cols-2 gap-3 border-b px-4 py-4 md:grid-cols-5 md:gap-4 md:px-6">
          <StatBox label="Started" value={timeAgo(session?.startedAt)} />
          <StatBox label="Duration" value={formatDuration(session)} />
          <div className="bg-surface-inset border-line col-span-2 flex flex-col justify-center rounded border px-3 py-2">
            <div className="mb-1.5 flex items-end justify-between">
              <p className="text-fg-secondary text-2xs">Progress</p>
              <p className="text-fg text-2xs font-mono font-semibold">
                {session?.tasksSucceeded ?? 0} / {session?.tasksExecuted ?? 0}
              </p>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          <StatBox label="Failed" value={String(session?.tasksFailed ?? 0)} />
        </div>
      )}

      {session?.status === 'failed' && session.errorMessage && (
        <div className="border-line border-b px-6 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Execution failed</AlertTitle>
            <AlertDescription className="font-mono text-xs">
              {session.errorMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="divide-line flex min-h-0 flex-1 flex-col divide-y overflow-y-auto md:flex-row md:divide-x md:divide-y-0 md:overflow-hidden">
        <div className="w-full overflow-y-auto p-4 md:w-1/2">
          <TaskTimeline sessionId={id} />
        </div>

        <div className="flex min-h-[20rem] w-full flex-col overflow-y-auto p-4 md:min-h-0 md:w-1/2">
          {/* No "Session log" heading here: EventLog renders its own, next to
              the log filter, and having both stacked the same label twice. */}
          <p className="text-fg-secondary mb-3 font-mono text-xs">
            $ specdrivr agent start --session {sessionLabel}
          </p>
          <EventLog sessionId={id} onUpdate={mutate} className="flex min-h-0 flex-1 flex-col" />
        </div>
      </div>
    </div>
  );
}
