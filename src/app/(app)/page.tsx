'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { clientLogger } from '@/lib/logger-client';
import { NeedsAttentionBanner } from '@/components/mission-control/needs-attention-banner';
import { SessionPanel } from '@/components/mission-control/session-panel';
import { EventLog } from '@/components/mission-control/event-log';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserRole } from '@/db/schema';
import dynamic from 'next/dynamic';
import { RecentSessions } from '@/components/mission-control/recent-sessions';

const LiveTerminal = dynamic(
  () => import('@/components/ui/live-terminal').then((m) => ({ default: m.LiveTerminal })),
  {
    ssr: false,
    loading: () => <div className="h-[320px] w-full animate-pulse rounded bg-[#0d0d0a]" />,
  }
);

export interface AgentSession {
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

interface BlockedTask {
  id: number;
  externalId: string;
  title: string;
  specId: number;
}

export default function MissionControlPage() {
  const { activeProjectId, user } = useShell();
  const userRole = (user.role ?? 'viewer') as UserRole;

  const [dismissed, setDismissed] = useState(false);

  const sessionsUrl =
    activeProjectId !== null ? `/api/v1/sessions?projectId=${activeProjectId}&limit=4` : null;

  const tasksUrl =
    activeProjectId !== null
      ? `/api/v1/tasks?status=blocked&projectId=${activeProjectId}&limit=50`
      : null;

  const { data: sessionsData } = usePolling<AgentSession[]>({
    url: sessionsUrl,
    interval: 3_000,
  });

  const { data: tasksData } = usePolling<BlockedTask[]>({
    url: tasksUrl,
    interval: 30_000,
  });

  const activeSession =
    sessionsData &&
    sessionsData.length > 0 &&
    ['running', 'paused'].includes(sessionsData[0].status)
      ? sessionsData[0]
      : null;

  const recentSessions = sessionsData || [];

  const blockedTasks = tasksData ?? [];

  const [prevTasks, setPrevTasks] = useState(tasksData);

  if (tasksData !== prevTasks) {
    setPrevTasks(tasksData);
    setDismissed(false);
  }

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
      <div className="border-border-default flex items-center justify-between border-b px-6 py-4">
        <div>
          <div className="text-muted-foreground mb-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            Mission Control
          </div>
          <h1 className="text-foreground text-xl font-semibold">Dashboard</h1>
        </div>
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

            {activeSession ? (
              <div className="flex flex-col gap-6">
                <div className="divide-border-default border-border-default grid grid-cols-1 border-b pb-6 lg:grid-cols-[1fr_1.2fr] lg:divide-x">
                  <div className="pb-6 lg:pr-6 lg:pb-0">
                    <SessionPanel
                      session={activeSession}
                      userRole={userRole}
                      onPause={handlePause}
                      onResume={handleResume}
                      onCancel={handleCancel}
                      onRetry={handleRetry}
                      onDismiss={handleDismiss}
                    />
                  </div>
                  <div className="lg:pl-6">
                    <EventLog sessionId={activeSession.id} />
                  </div>
                </div>
                <div>
                  <h2 className="text-text-muted mb-2 font-mono text-xs tracking-widest uppercase">
                    Live Terminal
                  </h2>
                  <LiveTerminal
                    sessionId={activeSession.id}
                    height={400}
                    active={activeSession.status === 'running'}
                  />
                </div>
              </div>
            ) : (
              <RecentSessions sessions={recentSessions} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
