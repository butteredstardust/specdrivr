'use client';

import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';

export interface HealthData {
  status: 'ok' | 'degraded';
  db: boolean;
  redis: boolean;
  git: boolean;
  agentLastSeen: string | null;
}

export type SystemHealth = {
  git: 'ok' | 'warn' | 'error' | 'unknown';
  api: 'ok' | 'error' | 'unknown';
  agt: 'ok' | 'warn' | 'error' | 'unknown';
  pg: 'ok' | 'error' | 'unknown';
  overall: 'ok' | 'warn' | 'degraded' | 'unknown';
  agentLastSeen: string | null;
};

export function useSystemHealth(): SystemHealth {
  const { activeProjectId } = useShell();
  const url = activeProjectId ? `/api/v1/health?projectId=${activeProjectId}` : '/api/v1/health';

  const { data: health } = usePolling<HealthData>({ url, interval: 30_000 });

  if (!health) {
    return {
      git: 'unknown',
      api: 'unknown',
      agt: 'unknown',
      pg: 'unknown',
      overall: 'unknown',
      agentLastSeen: null,
    };
  }

  const minsAgo = health.agentLastSeen
    ? (Date.now() - new Date(health.agentLastSeen).getTime()) / 60_000
    : Infinity;

  const git = health.git ? 'ok' : 'warn';
  const api = health.status === 'ok' ? 'ok' : 'error';
  const agt = minsAgo < 5 ? 'ok' : minsAgo < 15 ? 'warn' : 'error';
  const pg = health.db ? 'ok' : 'error';

  const indicators = [git, api, agt, pg];

  return {
    git,
    api,
    agt,
    pg,
    // Summarises the four dots rather than mirroring `health.status`, which
    // only covers db + redis — that made the sidebar claim "All systems
    // operational" directly under a red agent dot. Warnings are kept separate
    // from 'degraded' because the only one is "GitHub not configured", which
    // is an unfinished setup step rather than an outage.
    overall: indicators.includes('error')
      ? 'degraded'
      : indicators.includes('warn')
        ? 'warn'
        : 'ok',
    agentLastSeen: health.agentLastSeen,
  };
}
