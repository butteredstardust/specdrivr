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
  overall: 'ok' | 'degraded' | 'unknown';
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

  return {
    git: health.git ? 'ok' : 'warn',
    api: health.status === 'ok' ? 'ok' : 'error',
    agt: minsAgo < 5 ? 'ok' : minsAgo < 15 ? 'warn' : 'error',
    pg: health.db ? 'ok' : 'error',
    overall: health.status === 'ok' ? 'ok' : 'degraded',
    agentLastSeen: health.agentLastSeen,
  };
}
