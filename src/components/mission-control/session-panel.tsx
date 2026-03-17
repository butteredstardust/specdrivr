'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pause, Play, X, RefreshCw, CheckCircle, ChevronRight } from 'lucide-react';
import type { UserRole } from '@/db/schema';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type SessionPanelState = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

interface AgentSession {
  id: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  errorMessage?: string | null;
  specId?: number | null;
  specName?: string | null;
  currentTaskExternalId?: string | null;
  currentTaskTitle?: string | null;
  totalTasks?: number | null;
  backend?: string;
}

interface SessionPanelProps {
  session: AgentSession | null;
  userRole: UserRole;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
}

interface ControlButtonProps {
  canControl: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  disabledTooltip?: string;
}

function ControlButton({
  canControl,
  onClick,
  icon,
  label,
  variant = 'outline',
  className,
  disabledTooltip = 'You need admin or owner role to control sessions.',
}: ControlButtonProps) {
  if (canControl) {
    return (
      <Button variant={variant} size="sm" onClick={onClick} className={className}>
        {icon}
        {label}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button variant={variant} size="sm" disabled className={className}>
            {icon}
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{disabledTooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function SessionPanel({
  session,
  userRole,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onDismiss,
}: SessionPanelProps) {
  const panelState: SessionPanelState = !session
    ? 'idle'
    : session.status === 'running'
      ? 'running'
      : session.status === 'paused'
        ? 'paused'
        : session.status === 'completed'
          ? 'completed'
          : session.status === 'failed'
            ? 'failed'
            : 'cancelled';

  const canControl = userRole === 'admin' || userRole === 'owner';

  const [elapsed, setElapsed] = useState(0);
  const [prevStartedAt, setPrevStartedAt] = useState(session?.startedAt);

  if (session?.startedAt !== prevStartedAt) {
    setPrevStartedAt(session?.startedAt);
    setElapsed(
      session?.startedAt
        ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
        : 0
    );
  }

  useEffect(() => {
    if (panelState !== 'running') return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [panelState]);

  // Auto-dismiss completed sessions after 60s
  useEffect(() => {
    if (panelState !== 'completed') return;
    const timeout = setTimeout(() => onDismiss?.(), 60_000);
    return () => clearTimeout(timeout);
  }, [panelState, onDismiss]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  if (panelState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <DaemonMascot size={48} expression="idle" />
        <p className="text-text-muted font-mono text-xs tracking-widest uppercase">SYSTEM READY</p>
        <p className="text-text-secondary text-sm">No active session.</p>
        <Link
          href="/specs"
          className="text-phosphor-amber text-sm underline-offset-2 hover:underline"
        >
          Start a new spec →
        </Link>
      </div>
    );
  }

  if (panelState === 'running' || panelState === 'paused') {
    const totalTasks = session?.totalTasks ?? 0;
    const succeeded = session?.tasksSucceeded ?? 0;
    const progressPct = totalTasks > 0 ? Math.round((succeeded / totalTasks) * 100) : 0;

    return (
      <TooltipProvider>
        <div className="flex flex-col gap-3">
          {/* Header row: session ID badge + status + timer */}
          <div className="flex items-center gap-2">
            <span className="bg-bg-elevated text-text-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
              SES-{session!.id}
            </span>
            {session?.backend && (
              <span className="bg-bg-elevated text-text-secondary rounded px-1.5 py-0.5 font-mono text-[10px]">
                {session.backend === 'claude' ? '🤖 Claude' : '✨ Gemini'}
              </span>
            )}
            {panelState === 'running' ? (
              <span className="flex items-center gap-1 font-mono text-xs font-semibold text-green-400">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"
                  aria-hidden="true"
                />
                RUNNING
              </span>
            ) : (
              <span className="text-phosphor-amber flex items-center gap-1 font-mono text-xs font-semibold">
                <Pause className="h-3 w-3" /> PAUSED
              </span>
            )}
            <span className="text-text-muted ml-auto font-mono text-xs">
              {mm}:{ss}
            </span>
          </div>

          {/* Spec name */}
          {session?.specName && (
            <p className="text-text-secondary truncate font-mono text-xs">{session.specName}</p>
          )}

          {/* Progress bar */}
          <div className="flex flex-col gap-1">
            <Progress value={progressPct} className="h-1.5" />
            <span className="text-text-muted font-mono text-[10px]">
              {succeeded}/{totalTasks > 0 ? totalTasks : '?'} tasks · {progressPct}%
            </span>
          </div>

          {/* Current task pill */}
          {session?.currentTaskExternalId && (
            <div className="border-phosphor-amber/40 bg-phosphor-amber/5 flex items-center gap-1.5 rounded border px-2 py-1">
              <ChevronRight className="text-phosphor-amber h-3 w-3 shrink-0" />
              <span className="text-phosphor-amber font-mono text-[10px] font-semibold">
                {session.currentTaskExternalId}
              </span>
              {session.currentTaskTitle && (
                <span className="text-text-secondary truncate font-mono text-[10px]">
                  {session.currentTaskTitle}
                </span>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {panelState === 'running' ? (
              <ControlButton
                canControl={canControl}
                onClick={onPause}
                icon={<Pause className="h-3 w-3" />}
                label="Pause"
                variant="outline"
                className="border-phosphor-amber text-phosphor-amber hover:bg-phosphor-amber/10 border"
              />
            ) : (
              <ControlButton
                canControl={canControl}
                onClick={onResume}
                icon={<Play className="h-3 w-3" />}
                label="Resume"
              />
            )}
            <ControlButton
              canControl={canControl}
              onClick={onCancel}
              icon={<X className="h-3 w-3" />}
              label="Cancel"
              variant="destructive"
            />
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (panelState === 'completed') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <DaemonMascot size={48} expression="success" />
        <p className="flex items-center gap-1 font-mono text-xs font-semibold tracking-widest text-green-400 uppercase">
          <CheckCircle className="h-3 w-3" /> EXECUTION COMPLETE
        </p>
        {session && (
          <div className="text-text-secondary flex gap-4 font-mono text-xs">
            <span>Executed: {session.tasksExecuted}</span>
            <span className="text-green-400">OK: {session.tasksSucceeded}</span>
            <span className="text-status-red">Failed: {session.tasksFailed}</span>
          </div>
        )}
        {session?.specId && (
          <Link
            href={`/specs/${session.specId}?tab=changes`}
            className="text-phosphor-amber text-sm underline-offset-2 hover:underline"
          >
            View Changes →
          </Link>
        )}
      </div>
    );
  }

  if (panelState === 'failed') {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <DaemonMascot size={48} expression="error" />
          {session?.errorMessage && (
            <Alert variant="destructive" className="text-left">
              <AlertDescription>{session.errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <ControlButton
              canControl={canControl}
              onClick={onRetry}
              icon={<RefreshCw className="h-3 w-3" />}
              label="Retry"
              variant="outline"
              disabledTooltip="Requires admin role"
            />
            <ControlButton
              canControl={canControl}
              onClick={onDismiss}
              icon={<X className="h-3 w-3" />}
              label="Dismiss"
              variant="ghost"
              disabledTooltip="Requires admin role"
            />
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // cancelled
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <DaemonMascot size={48} expression="idle" />
      <p className="text-text-muted text-sm">Session cancelled.</p>
      <Link
        href="/specs"
        className="text-phosphor-amber text-sm underline-offset-2 hover:underline"
      >
        Return to specs
      </Link>
    </div>
  );
}
