'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pause, Play, X, RefreshCw } from 'lucide-react';
import type { UserRole } from '@/db/schema';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  disabledTooltip?: string;
}

function ControlButton({
  canControl,
  onClick,
  icon,
  label,
  variant = 'outline',
  disabledTooltip = 'You need admin or owner role to control sessions.',
}: ControlButtonProps) {
  if (canControl) {
    return (
      <Button variant={variant} size="sm" onClick={onClick}>
        {icon}
        {label}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button variant={variant} size="sm" disabled>
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

  const [elapsed, setElapsed] = useState(() => {
    if (!session?.startedAt) return 0;
    return Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
  });

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
        <p className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
          SYSTEM READY
        </p>
        <p className="text-sm text-[--text-secondary]">No active session.</p>
        <Link
          href="/specs"
          className="text-sm text-[--phosphor-amber] underline-offset-2 hover:underline"
        >
          Start a new spec →
        </Link>
      </div>
    );
  }

  if (panelState === 'running') {
    return (
      <TooltipProvider>
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" aria-hidden="true" />
            <span className="font-mono text-xs font-semibold text-green-400">● LIVE</span>
            <span className="ml-auto font-mono text-xs text-[--text-muted]">
              {mm}:{ss}
            </span>
          </div>

          {/* Task counts */}
          {session && (
            <div className="flex gap-4 font-mono text-xs text-[--text-secondary]">
              <span>Executed: {session.tasksExecuted}</span>
              <span className="text-green-400">OK: {session.tasksSucceeded}</span>
              <span className="text-[--status-red]">Failed: {session.tasksFailed}</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <ControlButton
              canControl={canControl}
              onClick={onPause}
              icon={<Pause className="h-3 w-3" />}
              label="Pause"
            />
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

  if (panelState === 'paused') {
    return (
      <TooltipProvider>
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[--phosphor-amber]">
              ⏸ PAUSED
            </span>
            <span className="ml-auto font-mono text-xs text-[--text-muted]">
              {mm}:{ss}
            </span>
          </div>

          {/* Task counts */}
          {session && (
            <div className="flex gap-4 font-mono text-xs text-[--text-secondary]">
              <span>Executed: {session.tasksExecuted}</span>
              <span className="text-green-400">OK: {session.tasksSucceeded}</span>
              <span className="text-[--status-red]">Failed: {session.tasksFailed}</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <ControlButton
              canControl={canControl}
              onClick={onResume}
              icon={<Play className="h-3 w-3" />}
              label="Resume"
            />
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
        <p className="font-mono text-xs font-semibold tracking-widest text-green-400 uppercase">
          ✓ Execution Complete
        </p>
        {session && (
          <div className="flex gap-4 font-mono text-xs text-[--text-secondary]">
            <span>Executed: {session.tasksExecuted}</span>
            <span className="text-green-400">OK: {session.tasksSucceeded}</span>
            <span className="text-[--status-red]">Failed: {session.tasksFailed}</span>
          </div>
        )}
        {session?.specId && (
          <Link
            href={`/specs/${session.specId}?tab=changes`}
            className="text-sm text-[--phosphor-amber] underline-offset-2 hover:underline"
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
      <p className="text-sm text-[--text-muted]">Session cancelled.</p>
      <Link
        href="/specs"
        className="text-sm text-[--phosphor-amber] underline-offset-2 hover:underline"
      >
        Return to specs
      </Link>
    </div>
  );
}
