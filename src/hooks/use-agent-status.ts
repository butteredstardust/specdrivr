'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AgentStatusData {
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'error' | 'stale';
  currentTask?: {
    id: number;
    description: string;
  };
  uptimeSeconds?: number;
  lastHeartbeat?: string;
  isStale?: boolean;
  staleSince?: string;
  errorCount?: number;
}

export interface AgentStatusResponse {
  status: AgentStatusData['status'];
  current_task?: AgentStatusData['currentTask'];
  uptime_seconds?: number;
  last_heartbeat_at?: string;
  is_stale?: boolean;
  stale_since?: string;
  error_count?: number;
}

interface UseAgentStatusOptions {
  projectId: number;
  enabled?: boolean;
  pollInterval?: number; // milliseconds
  onError?: (error: Error) => void;
}

export function useAgentStatus({
  projectId,
  enabled = true,
  pollInterval = 5000,
  onError,
}: UseAgentStatusOptions) {
  const [data, setData] = useState<AgentStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/agent/status`);

      if (!response.ok) {
        throw new Error(`Failed to fetch agent status: ${response.statusText}`);
      }

      const json: AgentStatusResponse = await response.json();

      const mappedData: AgentStatusData = {
        status: json.status,
        currentTask: json.current_task,
        uptimeSeconds: json.uptime_seconds,
        lastHeartbeat: json.last_heartbeat_at,
        isStale: json.is_stale,
        staleSince: json.stale_since,
        errorCount: json.error_count,
      };

      setData(mappedData);
      setError(null);

      // Only clear loading on first successful fetch
      if (isLoading) {
        setIsLoading(false);
      }

      // Check if status changed
      if (prevStatusRef.current !== json.status) {
        prevStatusRef.current = json.status;
      }

      // If server says it's stale but our status isn't stale, update it
      if (json.is_stale && mappedData.status !== 'stale') {
        setData(prev => prev ? { ...prev, status: 'stale' } : null);
      }

    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setIsLoading(false);
      onError?.(errorObj);
    }
  }, [projectId, enabled, isLoading, onError]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    fetchStatus();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [fetchStatus, enabled]);

  // Set up polling
  useEffect(() => {
    if (!enabled || isLoading) return;

    pollIntervalRef.current = setInterval(fetchStatus, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [fetchStatus, enabled, isLoading, pollInterval]);

  // Manually trigger a refresh
  const refresh = useCallback(() => {
    return fetchStatus();
  }, [fetchStatus]);

  return {
    data,
    isLoading,
    error,
    refresh,
    status: data?.status ?? 'idle',
    isRunning: data?.status === 'running',
    isPaused: data?.status === 'paused',
    isIdle: data?.status === 'idle' || data?.status === 'stopped',
    isError: data?.status === 'error',
    isStale: data?.status === 'stale' || data?.isStale,
  };
}

// Hook for agent actions (start, pause, stop, retry)
export function useAgentActions(projectId: number) {
  type ActionType = 'start' | 'pause' | 'stop' | 'retry' | null;

  const [isActionLoading, setIsActionLoading] = useState<ActionType>(null);

  const executeAction = useCallback(async (
    action: Exclude<ActionType, null>
  ): Promise<{ success: boolean; error?: string }> => {
    setIsActionLoading(action);

    try {
      const endpoint = `/api/projects/${projectId}/agent/${action}`;
      const response = await fetch(endpoint, { method: 'POST' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${action} agent: ${response.statusText}`);
      }

      return { success: true };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to ${action} agent:`, err);
      return { success: false, error: errorMessage };

    } finally {
      setIsActionLoading(null);
    }
  }, [projectId]);

  const start = useCallback(() => executeAction('start'), [executeAction]);
  const pause = useCallback(() => executeAction('pause'), [executeAction]);
  const stop = useCallback(() => executeAction('stop'), [executeAction]);
  const retry = useCallback(() => executeAction('retry'), [executeAction]);

  return {
    start,
    pause,
    stop,
    retry,
    isLoading: isActionLoading,
  };
}
