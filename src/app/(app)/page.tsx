'use client';

import React from 'react';
import { NeedsAttentionBanner } from '@/components/dashboard/needs-attention-banner';
import { SessionPanel } from '@/components/dashboard/session-panel';
import { EventLog } from '@/components/dashboard/event-log';
import { usePolling } from '@/hooks/use-polling';
import { useShell } from '@/components/providers/shell-provider';

export default function MissionControlPage() {
  const { activeProjectId } = useShell();

  // We need the active session ID to pass to EventLog and NeedsAttentionBanner
  // The session panel already polls, but we poll here to coordinate state
  const { data: sessionData } = usePolling<{ data: unknown }>({
    url: `/api/v1/sessions?projectId=${activeProjectId}&status=running&limit=1`,
    interval: 3000,
    enabled: !!activeProjectId,
    stopWhen: () => false,
  });

  const activeSessionId = sessionData?.data?.id;

  // Poll for blocked tasks if we have an active project
  const { data: blockedData } = usePolling<{ data: unknown[] }>({
    url: activeProjectId ? `/api/v1/tasks?projectId=${activeProjectId}&status=blocked` : '',
    interval: 5000,
    enabled: !!activeProjectId,
  });

  const blockedTasks = blockedData?.data || [];

  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden">
      {/* Needs Attention Banner */}
      <NeedsAttentionBanner blockedTasks={blockedTasks} />

      {/* Columns Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Session Panel */}
        <div className="w-[60%] overflow-y-auto border-r border-[--border-default]">
          <SessionPanel />
        </div>

        {/* Right Column: Event Log */}
        <div className="w-[40%] overflow-y-auto bg-[--bg-surface]">
          <EventLog activeSessionId={activeSessionId} />
        </div>
      </div>
    </div>
  );
}
