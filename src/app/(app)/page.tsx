'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { clientLogger } from '@/lib/logger-client';
import { NeedsAttentionBanner } from '@/components/mission-control/needs-attention-banner';
import { SessionPanel } from '@/components/mission-control/session-panel';
import { EventLog } from '@/components/mission-control/event-log';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserRole } from '@/db/schema';

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

interface BlockedTask {
  id: number;
  title: string;
  specId: number;
}

export default function MissionControlPage() {
  const { activeProjectId, user } = useShell();
  const userRole = (user.role ?? 'viewer') as UserRole;

  const [dismissed, setDismissed] = useState(false);

  const sessionsUrl =
    activeProjectId !== null
      ? `/api/v1/sessions?projectId=${activeProjectId}&status=running&limit=1`
      : null;

  const tasksUrl =
    activeProjectId !== null
      ? `/api/v1/tasks?status=blocked&projectId=${activeProjectId}&limit=50`
      : null;

  const { data: sessionsData } = usePolling<AgentSession[]>({
    url: sessionsUrl,
    interval: 10_000,
  });

  const { data: tasksData } = usePolling<BlockedTask[]>({
    url: tasksUrl,
    interval: 30_000,
  });

  const activeSession = sessionsData?.[0] ?? null;
  const blockedTasks = tasksData ?? [];

  // Reset dismissed state whenever the polled task data reference changes
  useEffect(() => {
    setDismissed(false);
  }, [tasksData]);

  async function handleSessionPatch(sessionId: number, status: string) {
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      clientLogger.error('Failed to update session status', { sessionId, status, err });
      toast.error('Failed to update session');
    }
  }

  const handlePause = async () => {
    if (!activeSession) return;
    await handleSessionPatch(activeSession.id, 'paused');
  };

  const handleResume = async () => {
    if (!activeSession) return;
    await handleSessionPatch(activeSession.id, 'running');
  };

  const handleCancel = async () => {
    if (!activeSession) return;
    await handleSessionPatch(activeSession.id, 'cancelled');
  };

  const handleRetry = async () => {
    if (!activeSession) return;
    try {
      const response = await fetch(`/api/v1/sessions/${activeSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      toast.info('Session cancelled. Start a new session from the spec page.');
    } catch (err) {
      clientLogger.error('Failed to cancel session for retry', {
        sessionId: activeSession.id,
        err,
      });
      toast.error('Failed to update session');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      {/* Header */}
      <div className="border-border border-b px-6 py-4">
        <div className="text-muted-foreground mb-1 font-mono text-[10px] tracking-[0.2em] uppercase">
          Mission Control
        </div>
        <h1 className="text-foreground text-xl font-semibold">Dashboard</h1>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 px-6 py-6">
        {activeProjectId === null ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            {blockedTasks.length > 0 && !dismissed && (
              <NeedsAttentionBanner blockedTasks={blockedTasks} onDismiss={handleDismiss} />
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SessionPanel
                session={activeSession}
                userRole={userRole}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
                onRetry={handleRetry}
                onDismiss={handleDismiss}
              />
              <EventLog sessionId={activeSession?.id ?? null} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
