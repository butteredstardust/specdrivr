'use client';

import React, { useState, useEffect } from 'react';
import { usePolling } from '@/hooks/use-polling';
import { useShell } from '@/components/providers/shell-provider';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import {
  PixelPulse,
  PixelProgress,
  PixelButton,
  PixelTypewriter,
  PixelAlert,
} from '@pxlkit/ui-kit';
import { TerminalLog, LogLine } from '@/components/ui/terminal-log';
import Link from 'next/link';

// Helper type for polling response
type SessionData = {
  id: string;
  externalId: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  totalTasks: number;
  currentTaskExternalId?: string;
  currentTaskTitle?: string;
  startedAt: string;
  lastHeartbeatAt?: string;
};

export function SessionPanel() {
  const { activeProjectId } = useShell();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isBooting, setIsBooting] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');

  const { isLoading } = usePolling<{ data: SessionData }>({
    url: `/api/v1/sessions?projectId=${activeProjectId}&status=running&limit=1`,
    interval: 3000,
    enabled: !!activeProjectId,
    stopWhen: () => false, // always poll — session state can change
    onData: (data) => {
      // Basic boot sequence logic
      if (!session && data.data) {
        setIsBooting(true);
        setTimeout(() => setIsBooting(false), 800);
      }
      setSession(data.data);
    },
  });

  // Calculate elapsed time
  useEffect(() => {
    if (!session || session.status === 'paused') return;

    const interval = setInterval(() => {
      const start = new Date(session.startedAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.startedAt, session?.status]);

  // Handle Action Buttons
  const handlePause = async () => {
    if (!session) return;
    await fetch(`/api/v1/sessions/${session.id}/pause`, {
      method: 'POST',
      credentials: 'include',
    });
  };

  const handleResume = async () => {
    if (!session) return;
    await fetch(`/api/v1/sessions/${session.id}/resume`, {
      method: 'POST',
      credentials: 'include',
    });
  };

  const handleCancel = async () => {
    if (!session) return;
    await fetch(`/api/v1/sessions/${session.id}/cancel`, {
      method: 'POST',
      credentials: 'include',
    });
  };

  if (isLoading && !session) {
    return (
      <div className="flex h-full items-center justify-center">
        <DaemonMascot size="lg" state="thinking" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <DaemonMascot size="lg" state="idle" />
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
            System Ready
          </span>
          <span className="text-sm text-[--text-muted]">No active session.</span>
          <Link href="/specs" className="text-sm text-[--accent-violet] hover:underline">
            Open a spec to begin.
          </Link>
        </div>
      </div>
    );
  }

  const isRunning = session.status === 'running';
  const isPaused = session.status === 'paused';
  const isCompleted = session.status === 'completed'; // Assumes auto-clears via polling

  const totalCompleted = session.tasksSucceeded + session.tasksFailed;

  // Check heartbeat (auto-recovery banner)
  let lostHeartbeat = false;
  let minutesSinceHeartbeat = 0;
  if (isRunning && session.lastHeartbeatAt) {
    const diffMs = new Date().getTime() - new Date(session.lastHeartbeatAt).getTime();
    if (diffMs > 60000) {
      lostHeartbeat = true;
      minutesSinceHeartbeat = Math.floor(diffMs / 60000);
    }
  }

  // TODO: Actual log polling will be separate or passed down, mocked here for layout
  const logLines: LogLine[] = [];

  if (isCompleted) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <DaemonMascot size="lg" state="success" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg text-[--text-primary]">Execution complete.</span>
          <span className="text-sm text-[--text-muted]">
            {session.tasksSucceeded} / {session.totalTasks} tasks succeeded.
          </span>
          {/* TODO: Needs specId linking properly, passing generic for now */}
          <Link href={`/specs/${session.id}?tab=changes`} className="mt-2">
            <PixelButton tone="neutral" variant="ghost">
              View Changes →
            </PixelButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Header Row */}
      <div className="flex items-center gap-4">
        {isRunning ? (
          <div className="flex items-center gap-2">
            <PixelPulse>Live</PixelPulse>
            <span className="font-mono text-xs text-[--accent-violet] uppercase">Live</span>
          </div>
        ) : isPaused ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[--phosphor-amber] uppercase">⏸ Paused</span>
          </div>
        ) : null}
        <span className="font-mono text-xs text-[--phosphor-amber]">{session.externalId}</span>
        <span className="font-mono text-xs text-[--text-muted]">{elapsed}</span>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1">
        <PixelProgress value={totalCompleted} tone="purple" />
        <span className="text-right text-xs text-[--text-muted]">
          {totalCompleted} / {session.totalTasks} tasks
        </span>
      </div>

      {/* Current Task Line */}
      {(isRunning || isPaused) && session.currentTaskTitle && (
        <div className="flex items-center gap-2 text-sm">
          <span className="animate-[blink_1s_infinite] text-[--accent-violet]">▶</span>
          <span className="font-medium text-[--text-primary]">
            {session.currentTaskExternalId} · {session.currentTaskTitle}
          </span>
        </div>
      )}

      {/* Auto-Recovery Banner */}
      {lostHeartbeat && (
        <div className="flex flex-col gap-2">
          <PixelAlert
            tone="gold"
            title="Attention"
            message={`Session ${session.externalId} may have lost connection. Last heartbeat ${minutesSinceHeartbeat} minutes ago.`}
          />
          <div className="flex gap-2">
            <PixelButton
              tone="neutral"
              size="sm"
              onClick={() => {
                fetch(`/api/v1/sessions/${session.id}`, { credentials: 'include' });
              }}
            >
              Check Status
            </PixelButton>
            <PixelButton tone="red" size="sm" onClick={handleCancel}>
              Abandon Session
            </PixelButton>
          </div>
        </div>
      )}

      {/* Terminal */}
      <div className="relative flex-1 overflow-hidden">
        {isBooting ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[--terminal-bg]">
            <PixelTypewriter text="> DAEMON INITIALIZING..." />
          </div>
        ) : null}
        <TerminalLog lines={logLines} height="100%" autoScroll />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3">
        {isRunning && (
          <PixelButton tone="neutral" size="sm" onClick={handlePause}>
            ⏸ PAUSE
          </PixelButton>
        )}
        {isPaused && (
          <PixelButton tone="gold" size="sm" onClick={handleResume}>
            RESUME
          </PixelButton>
        )}
        <PixelButton tone="red" size="sm" variant="ghost" onClick={handleCancel}>
          ✕ CANCEL
        </PixelButton>
      </div>
    </div>
  );
}
