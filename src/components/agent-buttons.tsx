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
        size="sm"
        onClick={handleStart}
        loading={loading === 'running'}
        disabled={disabled || isRunning || !hasActivePlan}
      >
        Start
      </Button>

      {/* Pause Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handlePause}
        loading={loading === 'paused'}
        disabled={disabled || !isRunning && !isPaused}
      >
        {isRunning ? 'Pause' : 'Resume'}
      </Button>

      {/* Stop Button */}
      <Button
        variant={isRunning || isPaused ? 'default' : 'secondary'}
        size="sm"
        onClick={() => setShowStopConfirm(true)}
        loading={loading === 'stopped'}
        disabled={disabled || isIdle && !isError && !isStale}
      >
        Stop
      </Button>

      {/* Retry Button - shown on error or stale status */}
      {(isError || isStale) && onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRetry}
          loading={loading === 'running'}
          disabled={disabled}
        >
          Retry
        </Button>
      )}

      {/* Stop Confirmation Dialog */}
      <ConfirmDialog
        open={showStopConfirm}
        onOpenChange={() => setShowStopConfirm(false)}
        onConfirm={handleStopConfirm}
        title="Stop Agent?"
        message="This will immediately stop the agent work and mark the current task as blocked. Are you sure?"
        confirmText="Stop Agent"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
