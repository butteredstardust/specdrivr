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
      return 'text-accent-violet animate-[blink_1s_ease-in-out_infinite]';
    case 'paused':
      return 'text-phosphor-amber';
    case 'completed':
      return 'text-emerald-400';
    case 'failed':
      return 'text-red-400';
    case 'cancelled':
      return 'text-text-muted';
    default:
      return 'text-text-muted';
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <DaemonMascot size={48} expression="idle" />
      <p className="text-text-muted font-mono text-xs">Loading session…</p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <DaemonMascot size={48} expression="error" />
      <p className="text-text-muted font-mono text-xs">Session not found.</p>
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
    <div className="bg-phosphor-amber/10 border-phosphor-amber/30 flex items-center gap-3 rounded-md border p-3">
      <AlertTriangle className="text-phosphor-amber h-4 w-4 shrink-0" />
      <span className="text-phosphor-amber flex-1 text-sm">
        Agent connection lost. Last heartbeat{' '}
        {session.lastHeartbeatAt ? timeAgo(session.lastHeartbeatAt) : 'unknown'}.
      </span>
      <Button size="sm" variant="outline" onClick={onCheck}>
        Check Status
      </Button>
      <Button size="sm" variant="ghost" className="text-phosphor-amber" onClick={onAbandon}>
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
          <AlertDialogAction onClick={onConfirm} className="bg-status-red">
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

  const id = typeof params['id'] === 'string' ? parseInt(params['id'], 10) : NaN;

  // Redirect immediately if id is not a valid number
  useEffect(() => {
    if (isNaN(id)) {
      router.replace('/sessions');
    }
  }, [id, router]);

  const {
    data: session,
    isLoading,
    restart,
  } = usePolling<Session>({
    url: !isNaN(id) ? `/api/v1/sessions/${id}` : null,
    interval: 10_000,
    stopWhen: (s) => ['completed', 'cancelled', 'failed'].includes(s.status),
  });

  const [isActioning, setIsActioning] = useState(false);

  const lostConnection =
    session?.status === 'running' &&
    (session.lastHeartbeatAt
      ? Date.now() - new Date(session.lastHeartbeatAt).getTime() > 60_000
      : Date.now() - new Date(session.startedAt).getTime() > 60_000);

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
      clientLogger.error(
        'Pause request failed',
        err instanceof Error ? err : new Error(String(err))
      );
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
      clientLogger.error(
        'Resume request failed',
        err instanceof Error ? err : new Error(String(err))
      );
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
      clientLogger.error(
        'Cancel request failed',
        err instanceof Error ? err : new Error(String(err))
      );
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
      <nav className="text-text-muted flex items-center gap-1.5 font-mono text-xs">
        <Link href="/sessions" className="hover:text-text-secondary transition-colors">
          Sessions
        </Link>
        <span>/</span>
        <span className="text-text-secondary">SES-{paddedId}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-phosphor-amber/10 text-phosphor-amber rounded-sm px-1.5 py-0.5 font-mono text-sm">
              SES-{paddedId}
            </span>
            <span className={`font-mono text-xs ${statusBadgeClass(session.status)}`}>
              {session.status.toUpperCase()}
            </span>
            {session.specId && (
              <Link
                href={`/specs/${session.specId}`}
                className="text-text-muted hover:text-text-secondary flex items-center gap-1 font-mono text-xs transition-colors"
              >
                {session.specTitle ?? `Spec #${session.specId}`}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="text-text-muted flex flex-wrap items-center gap-4 font-mono text-xs">
            <span>Started: {new Date(session.startedAt).toLocaleString()}</span>
            <span>Duration: {formatDuration(session)}</span>
            <span>
              Tasks: {session.tasksSucceeded}/{session.tasksExecuted}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {session.status === 'running' && (
            <>
              <Button size="sm" variant="outline" onClick={handlePause} disabled={isActioning}>
                <Pause className="mr-1.5 h-3.5 w-3.5" />
                Pause
              </Button>
              <CancelDialog
                onConfirm={handleCancel}
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-status-red"
                    disabled={isActioning}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                }
              />
            </>
          )}

          {session.status === 'paused' && (
            <>
              <Button size="sm" onClick={handleResume} disabled={isActioning}>
                <Play className="mr-1.5 h-3.5 w-3.5" />
                Resume
              </Button>
              <CancelDialog
                onConfirm={handleCancel}
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-status-red"
                    disabled={isActioning}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                }
              />
            </>
          )}

          {session.status === 'failed' && session.specId && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/specs/${session.specId}`}>
                View Spec <ExternalLink className="ml-1.5 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Lost connection banner */}
      {lostConnection && (
        <LostConnectionBanner session={session} onCheck={restart} onAbandon={handleCancel} />
      )}

      {/* Event log */}
      <EventLog sessionId={id} />
    </div>
  );
}
