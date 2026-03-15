'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Pause, Play, X, ExternalLink } from 'lucide-react';
import { EventLog } from '@/components/mission-control/event-log';
import { DaemonMascot } from '@/components/ui/daemon-mascot';

interface Session {
  id: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  endedAt?: string | null;
  lastHeartbeatAt?: string | null;
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  specId?: number | null;
  specTitle?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function statusBadgeClass(status: Session['status']): string {
  switch (status) {
    case 'running':
      return 'text-[--accent-violet] animate-[blink_1s_ease-in-out_infinite]';
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <DaemonMascot size={48} expression="idle" />
      <p className="font-mono text-xs text-[--text-muted]">Loading session…</p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <DaemonMascot size={48} expression="error" />
      <p className="font-mono text-xs text-[--text-muted]">Session not found.</p>
      <Button size="sm" variant="outline" asChild>
        <Link href="/sessions">Back to Sessions</Link>
      </Button>
    </div>
  );
}

interface LostConnectionBannerProps {
  session: Session;
  onCheck: () => void;
  onAbandon: () => void;
}

function LostConnectionBanner({ session, onCheck, onAbandon }: LostConnectionBannerProps) {
  return (
    <div className="rounded-md bg-[--phosphor-amber]/10 border border-[--phosphor-amber]/30 p-3 flex items-center gap-3">
      <AlertTriangle className="h-4 w-4 text-[--phosphor-amber] shrink-0" />
      <span className="flex-1 text-sm text-[--phosphor-amber]">
        Agent connection lost. Last heartbeat{' '}
        {session.lastHeartbeatAt ? timeAgo(session.lastHeartbeatAt) : 'unknown'}.
      </span>
      <Button size="sm" variant="outline" onClick={onCheck}>
        Check Status
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-[--phosphor-amber]"
        onClick={onAbandon}
      >
        Abandon
      </Button>
    </div>
  );
}

interface CancelDialogProps {
  onConfirm: () => void;
  trigger: React.ReactNode;
}

function CancelDialog({ onConfirm, trigger }: CancelDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel session?</AlertDialogTitle>
          <AlertDialogDescription>
            This will stop execution and mark in-progress tasks as failed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep running</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-[--status-red]">
            Cancel session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params['id'] === 'string' ? parseInt(params['id'], 10) : NaN;

  // Redirect immediately if id is not a valid number
  useEffect(() => {
    if (isNaN(id)) {
      router.replace('/sessions');
    }
  }, [id, router]);

  const { data: session, isLoading, restart } = usePolling<Session>({
    url: !isNaN(id) ? `/api/v1/sessions/${id}` : null,
    interval: 10_000,
    stopWhen: (s) => ['completed', 'cancelled', 'failed'].includes(s.status),
  });

  const [isActioning, setIsActioning] = useState(false);

  const lostConnection = session?.status === 'running' && (
    session.lastHeartbeatAt
      ? (Date.now() - new Date(session.lastHeartbeatAt).getTime()) > 60_000
      : (Date.now() - new Date(session.startedAt).getTime()) > 60_000
  );

  // -------------------------------------------------------------------------
  // Action handlers
  // -------------------------------------------------------------------------

  async function handlePause() {
    setIsActioning(true);
    try {
      const res = await fetch(`/api/v1/sessions/${id}/pause`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.status === 404 || res.status === 405 || !res.ok) {
        toast.error('Pause not yet available');
        clientLogger.warn('Pause endpoint not available', { status: res.status, sessionId: id });
        return;
      }
      restart();
    } catch (err) {
      toast.error('Pause not yet available');
      clientLogger.error('Pause request failed', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsActioning(false);
    }
  }

  async function handleResume() {
    setIsActioning(true);
    try {
      const res = await fetch(`/api/v1/sessions/${id}/resume`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error('Failed to resume session');
        clientLogger.warn('Resume failed', { status: res.status, sessionId: id });
        return;
      }
      restart();
    } catch (err) {
      toast.error('Failed to resume session');
      clientLogger.error('Resume request failed', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsActioning(false);
    }
  }

  async function handleCancel() {
    setIsActioning(true);
    try {
      const res = await fetch(`/api/v1/sessions/${id}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error('Failed to cancel session');
        clientLogger.warn('Cancel failed', { status: res.status, sessionId: id });
        return;
      }
      restart();
    } catch (err) {
      toast.error('Failed to cancel session');
      clientLogger.error('Cancel request failed', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsActioning(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render guards
  // -------------------------------------------------------------------------

  if (isNaN(id)) return null;

  if (isLoading && !session) return <LoadingState />;

  if (!session) return <ErrorState />;

  const paddedId = String(id).padStart(4, '0');

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-mono text-xs text-[--text-muted]">
        <Link href="/sessions" className="hover:text-[--text-secondary] transition-colors">
          Sessions
        </Link>
        <span>/</span>
        <span className="text-[--text-secondary]">SES-{paddedId}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="rounded-sm bg-[--phosphor-amber]/10 px-1.5 py-0.5 font-mono text-sm text-[--phosphor-amber]">
              SES-{paddedId}
            </span>
            <span className={`font-mono text-xs ${statusBadgeClass(session.status)}`}>
              {session.status.toUpperCase()}
            </span>
            {session.specId && (
              <Link
                href={`/specs/${session.specId}`}
                className="flex items-center gap-1 font-mono text-xs text-[--text-muted] hover:text-[--text-secondary] transition-colors"
              >
                {session.specTitle ?? `Spec #${session.specId}`}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-[--text-muted] font-mono flex-wrap">
            <span>Started: {new Date(session.startedAt).toLocaleString()}</span>
            <span>Duration: {formatDuration(session)}</span>
            <span>
              Tasks: {session.tasksSucceeded}/{session.tasksExecuted}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {session.status === 'running' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePause}
                disabled={isActioning}
              >
                <Pause className="h-3.5 w-3.5 mr-1.5" />
                Pause
              </Button>
              <CancelDialog
                onConfirm={handleCancel}
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[--status-red]"
                    disabled={isActioning}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Cancel
                  </Button>
                }
              />
            </>
          )}

          {session.status === 'paused' && (
            <>
              <Button
                size="sm"
                onClick={handleResume}
                disabled={isActioning}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Resume
              </Button>
              <CancelDialog
                onConfirm={handleCancel}
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[--status-red]"
                    disabled={isActioning}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Cancel
                  </Button>
                }
              />
            </>
          )}

          {session.status === 'failed' && session.specId && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/specs/${session.specId}`}>
                View Spec <ExternalLink className="h-3 w-3 ml-1.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Lost connection banner */}
      {lostConnection && (
        <LostConnectionBanner
          session={session}
          onCheck={restart}
          onAbandon={handleCancel}
        />
      )}

      {/* Event log */}
      <EventLog sessionId={id} />
    </div>
  );
}
