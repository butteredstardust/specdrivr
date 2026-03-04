'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { ConfirmDialog } from './ui/dialog';
import { agentStatusLabels, type AgentStatus } from '@/lib/ios-styles';

export interface AgentButtonsProps {
  projectId: number;
  status: AgentStatus;
  hasActivePlan?: boolean;
  onStart?: () => Promise<void>;
  onPause?: () => Promise<void>;
  onStop?: () => Promise<void>;
  onRetry?: () => Promise<void>;
  disabled?: boolean;
}

export function AgentButtons({
  projectId,
  status,
  hasActivePlan = true,
  onStart,
  onPause,
  onStop,
  onRetry,
  disabled = false,
}: AgentButtonsProps) {
  const [loading, setLoading] = useState<AgentStatus | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const handleStart = async () => {
    if (!onStart) return;
    setLoading('running');
    try {
      await onStart();
    } finally {
      setLoading(null);
    }
  };

  const handlePause = async () => {
    if (!onPause) return;
    setLoading('paused');
    try {
      await onPause();
    } finally {
      setLoading(null);
    }
  };

  const handleStop = async () => {
    if (!onStop) return;
    setLoading('stopped');
    try {
      await onStop();
    } finally {
      setLoading(null);
    }
  };

  const handleStopConfirm = async () => {
    setShowStopConfirm(false);
    await handleStop();
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    setLoading('running');
    try {
      await onRetry();
    } finally {
      setLoading(null);
    }
  };

  const isRunning = status === 'running';
  const isIdle = status === 'idle' || status === 'stopped';
  const isPaused = status === 'paused';
  const isError = status === 'error';
  const isStale = status === 'stale';

  return (
    <div className="flex items-center gap-2">
      {/* Start Button */}
      <Button
        variant="secondary"
        size="small"
        onClick={handleStart}
        loading={loading === 'running'}
        disabled={disabled || isRunning || !hasActivePlan}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        }
      >
        Start
      </Button>

      {/* Pause Button */}
      <Button
        variant="secondary"
        size="small"
        onClick={handlePause}
        loading={loading === 'paused'}
        disabled={disabled || !isRunning && !isPaused}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        }
      >
        {isRunning ? 'Pause' : 'Resume'}
      </Button>

      {/* Stop Button */}
      <Button
        variant={isRunning || isPaused ? 'primary' : 'secondary'}
        size="small"
        onClick={() => setShowStopConfirm(true)}
        loading={loading === 'stopped'}
        disabled={disabled || isIdle && !isError && !isStale}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        }
      >
        Stop
      </Button>

      {/* Retry Button - shown on error or stale status */}
      {(isError || isStale) && onRetry && (
        <Button
          variant="secondary"
          size="small"
          onClick={handleRetry}
          loading={loading === 'running'}
          disabled={disabled}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          }
        >
          Retry
        </Button>
      )}

      {/* Stop Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showStopConfirm}
        onClose={() => setShowStopConfirm(false)}
        onConfirm={handleStopConfirm}
        title="Stop Agent?"
        message="This will immediately stop the agent work and mark the current task as blocked. Are you sure?"
        confirmText="Stop Agent"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
