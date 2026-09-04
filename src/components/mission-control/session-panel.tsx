'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pause, Play, XCircle, RefreshCw, ChevronRight, ExternalLink, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/db/schema';
import { StatusIcon } from '@/components/ui/status-icon';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { EntityId } from '@/components/ui/entity-id';

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
        <StatusIcon size={24} status="idle" />
        <p className="text-fg-muted text-2xs font-medium">System ready</p>
        <p className="text-fg-secondary text-sm">No active session.</p>
        <Button asChild variant="default" size="sm" className="mt-1">
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
            'flex flex-col gap-3 rounded-lg border p-3',
            panelState === 'running' ? 'border-accent-border' : 'border-line'
          )}
        >
          {/* Header row: session ID badge + status + timer */}
          <div className="flex items-center gap-2">
            <EntityId chip>SES-{session!.id}</EntityId>
            {session?.backend && (
              <Badge variant="neutral" className="capitalize">
                {session.backend}
              </Badge>
            )}
            {panelState === 'running' ? (
              <Badge variant="info" dot>
                Running
              </Badge>
            ) : (
              <Badge variant="warning">Paused</Badge>
            )}
            <span className="text-fg-muted ml-auto font-mono text-xs tracking-tighter tabular-nums">
              {mm}:{ss}
            </span>
          </div>

          {/* Spec name */}
          {session?.specName && (
            <p className="text-fg-secondary truncate text-xs">{session.specName}</p>
          )}

          {/* Progress bar */}
          <div className="flex flex-col gap-2">
            <div className="text-fg-muted flex items-center justify-between text-xs">
              <span>
                {succeeded}/{totalTasks > 0 ? totalTasks : '?'} tasks
              </span>
              <span className="text-fg-secondary tabular-nums">{progressPct}%</span>
            </div>
            <Progress value={progressPct} aria-label="Session progress" />
          </div>

          {/* Current task pill */}
          {session?.currentTaskExternalId && (
            <div className="border-accent-border bg-accent-subtle flex items-center gap-2 rounded border px-2 py-1.5">
              <ChevronRight className="text-accent h-3.5 w-3.5 shrink-0" />
              <EntityId className="text-accent">{session.currentTaskExternalId}</EntityId>
              {session.currentTaskTitle && (
                <span className="text-fg-secondary truncate text-xs">
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
                className="h-8 flex-1"
              />
            ) : (
              <ControlButton
                canControl={canControl}
                onClick={onResume}
                icon={<Play className="mr-2 h-3 w-3" />}
                label="Resume Session"
                variant="outline"
                className="h-8 flex-1"
              />
            )}
            <ControlButton
              canControl={canControl}
              onClick={onCancel}
              icon={<XCircle className="mr-2 h-3 w-3" />}
              label="Abort"
              variant="outline"
              className="border-danger-border text-danger hover:bg-danger-bg h-8 px-3"
            />
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (panelState === 'completed') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <StatusIcon size={24} status="success" />
        <Badge variant="success">Execution complete</Badge>
        {session && (
          <div className="flex flex-col items-center gap-1.5 text-xs">
            <div className="text-fg-secondary flex gap-4">
              <span>Executed {session.tasksExecuted}</span>
              <span className="text-success">Succeeded {session.tasksSucceeded}</span>
              <span className="text-danger">Failed {session.tasksFailed}</span>
            </div>
            {session.totalCostUsd != null && session.totalCostUsd > 0 && (
              <span className="text-fg-muted">Total cost ${session.totalCostUsd.toFixed(4)}</span>
            )}
          </div>
        )}
        {session?.specId && (
          <div className="flex items-center gap-3">
            <Link
              href={`/specs/${session.specId}?tab=changes`}
              className="text-accent text-sm underline-offset-2 hover:underline"
            >
              View Changes →
            </Link>
            {session.pullRequestUrl && (
              <>
                <span className="text-line">|</span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-fg-secondary hover:text-fg h-auto p-0 text-sm font-normal"
                  onClick={() => window.open(session.pullRequestUrl!, '_blank')}
                >
                  <Github className="mr-1.5 h-3.5 w-3.5" />
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
          <StatusIcon size={24} status="error" />
          <Badge variant="danger">Execution failed</Badge>
          {session?.totalCostUsd != null && session.totalCostUsd > 0 && (
            <span className="text-fg-muted text-2xs font-mono">
              Est. cost ${session.totalCostUsd.toFixed(4)}
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
      <StatusIcon size={24} status="idle" />
      <Badge variant="muted">Cancelled</Badge>
      <Link href="/specs" className="text-accent text-sm underline-offset-2 hover:underline">
        Return to specs
      </Link>
    </div>
  );
}
