'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pause, Play, XCircle, RefreshCw, ChevronRight, ExternalLink } from 'lucide-react';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/db/schema';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress, ASCIIProgress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PixelBadge } from '@/components/ui/pixel-badge';

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
  backend?: 'gemini' | 'claude';
  pullRequestUrl?: string | null;
  totalCostUsd?: number | null;
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
        <Button asChild variant="phosphor" size="sm" className="mt-1">
          <Link href="/specs/new">
            Start a new spec
            <ChevronRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    );
  }

  if (panelState === 'running' || panelState === 'paused') {
    const totalTasks = session?.totalTasks ?? 0;
    const succeeded = session?.tasksSucceeded ?? 0;
    const progressPct = totalTasks > 0 ? Math.round((succeeded / totalTasks) * 100) : 0;

    return (
      <TooltipProvider>
        <div
          className={cn(
            'scanline-overlay flex flex-col gap-3 rounded-lg border p-3 transition-all',
            panelState === 'running' ? 'cyber-glow-active border-accent-blue/30' : 'border-border'
          )}
        >
          {/* Header row: session ID badge + status + timer */}
          <div className="flex items-center gap-2">
            <span className="bg-bg-elevated text-text-muted rounded px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
              SES-{session!.id}
            </span>
            {session?.backend && (
              <span className="bg-bg-elevated text-text-secondary rounded px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                {session.backend === 'claude' ? '🤖 Claude' : '✨ Gemini'}
              </span>
            )}
            {panelState === 'running' ? (
              <PixelBadge variant="blue" dot>
                RUNNING
              </PixelBadge>
            ) : (
              <PixelBadge variant="amber">PAUSED</PixelBadge>
            )}
            <span className="text-text-muted ml-auto font-mono text-xs tracking-tighter tabular-nums">
              {mm}:{ss}
            </span>
          </div>

          {/* Spec name */}
          {session?.specName && (
            <p className="text-text-secondary truncate font-mono text-xs tracking-tight">
              {session.specName}
            </p>
          )}

          {/* Progress bar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-mono text-[10px] tracking-wider uppercase">
                Progress: {succeeded}/{totalTasks > 0 ? totalTasks : '?'} · {progressPct}%
              </span>
              <ASCIIProgress
                value={succeeded}
                max={totalTasks > 0 ? totalTasks : 100}
                length={12}
                className="text-status-emerald"
              />
            </div>
            <Progress value={progressPct} className="h-1 shadow-inner" />
          </div>

          {/* Current task pill */}
          {session?.currentTaskExternalId && (
            <div className="border-phosphor-amber/30 bg-phosphor-amber/5 flex items-center gap-2 rounded border px-2 py-1.5 shadow-sm transition-all">
              <div className="bg-phosphor-amber/20 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px]">
                <ChevronRight className="text-phosphor-amber h-3 w-3" />
              </div>
              <span className="text-phosphor-amber font-mono text-[10px] font-bold">
                {session.currentTaskExternalId}
              </span>
              {session.currentTaskTitle && (
                <span className="text-text-secondary truncate font-mono text-[10px] tracking-tight">
                  {session.currentTaskTitle}
                </span>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2 pt-1">
            {panelState === 'running' ? (
              <ControlButton
                canControl={canControl}
                onClick={onPause}
                icon={<Pause className="mr-2 h-3 w-3" />}
                label="Pause Session"
                variant="outline"
                className="border-phosphor-amber/40 text-phosphor-amber hover:bg-phosphor-amber/10 h-8 flex-1"
              />
            ) : (
              <ControlButton
                canControl={canControl}
                onClick={onResume}
                icon={<Play className="mr-2 h-3 w-3" />}
                label="Resume Session"
                variant="outline"
                className="border-status-emerald/40 text-status-emerald hover:bg-status-emerald/10 h-8 flex-1"
              />
            )}
            <ControlButton
              canControl={canControl}
              onClick={onCancel}
              icon={<XCircle className="mr-2 h-3 w-3" />}
              label="Abort"
              variant="outline"
              className="border-status-red/40 text-status-red hover:bg-status-red/10 h-8 px-3"
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
        <PixelBadge variant="emerald">EXECUTION COMPLETE</PixelBadge>
        {session && (
          <div className="flex flex-col items-center gap-1.5 font-mono text-xs">
            <div className="text-text-secondary flex gap-4">
              <span>Executed: {session.tasksExecuted}</span>
              <span className="text-status-emerald">OK: {session.tasksSucceeded}</span>
              <span className="text-status-red">Failed: {session.tasksFailed}</span>
            </div>
            {session.totalCostUsd != null && session.totalCostUsd > 0 && (
              <span className="text-text-muted">
                TOTAL COST: ${session.totalCostUsd.toFixed(4)}
              </span>
            )}
          </div>
        )}
        {session?.specId && (
          <div className="flex items-center gap-3">
            <Link
              href={`/specs/${session.specId}?tab=changes`}
              className="text-phosphor-amber text-sm underline-offset-2 hover:underline"
            >
              View Changes →
            </Link>
            {session.pullRequestUrl && (
              <>
                <span className="text-border-default">|</span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-text-secondary hover:text-text-primary h-auto p-0 text-sm font-normal"
                  onClick={() => window.open(session.pullRequestUrl!, '_blank')}
                >
                  <GitHubLogoIcon className="mr-1.5 h-3.5 w-3.5" />
                  View PR
                  <ExternalLink className="ml-1 h-3 w-3 opacity-50" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (panelState === 'failed') {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <DaemonMascot size={48} expression="error" />
          <PixelBadge variant="red">EXECUTION FAILED</PixelBadge>
          {session?.totalCostUsd != null && session.totalCostUsd > 0 && (
            <span className="text-text-muted font-mono text-[10px]">
              EST. COST: ${session.totalCostUsd.toFixed(4)}
            </span>
          )}
          {session?.errorMessage && (
            <Alert variant="destructive" className="text-left">
              <AlertDescription>{session.errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <ControlButton
              canControl={canControl}
              onClick={onRetry}
              icon={<RefreshCw className="mr-1.5 h-3 w-3" />}
              label="Retry"
              variant="outline"
              disabledTooltip="Requires admin role"
            />
            <ControlButton
              canControl={canControl}
              onClick={onDismiss}
              icon={<XCircle className="mr-1.5 h-3 w-3" />}
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
      <PixelBadge variant="muted">CANCELLED</PixelBadge>
      <Link
        href="/specs"
        className="text-phosphor-amber text-sm underline-offset-2 hover:underline"
      >
        Return to specs
      </Link>
    </div>
  );
}
