'use client';

import { useState } from 'react';
import { TaskSelect } from '@/db/schema';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { taskStatusColors, type TaskStatus } from '@/lib/ios-styles';
import { formatDateTime, formatDuration } from '@/lib/ios-styles';
import { clsx } from 'clsx';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskSelect & {
    testResults?: any[];
    agentLogs?: any[];
    dependencies?: TaskSelect[];
  };
  onRetry?: (taskId: number) => Promise<void>;
  onSkip?: (taskId: number) => Promise<void>;
  onStatusChange?: (taskId: number, status: TaskStatus) => Promise<void>;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onRetry,
  onSkip,
  onStatusChange,
}: TaskDetailModalProps) {
  const [showRetryConfirm, setShowRetryConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusInfo = taskStatusColors[task.status as TaskStatus] || taskStatusColors.todo;
  const filesInvolved = Array.isArray(task.filesInvolved)
    ? (task.filesInvolved as string[])
    : [];

  const handleCopyVerifyCommand = () => {
    const command = `verify-task --id ${task.id}`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsSubmitting(true);
    try {
      await onRetry(task.id);
      setShowRetryConfirm(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!onSkip) return;
    setIsSubmitting(true);
    try {
      await onSkip(task.id);
      setShowSkipConfirm(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!onStatusChange) return;
    setIsSubmitting(true);
    try {
      await onStatusChange(task.id, newStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate uptime if task is running
  const uptime = task.status === 'in_progress' && task.updatedAt
    ? Date.now() - new Date(task.updatedAt).getTime()
    : null;

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={`Task #${task.id}`}
        size="large"
        footer={
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-ios-text-secondary">
              Created {formatDateTime(task.createdAt)}
            </div>
            <div className="flex items-center gap-2">
              {task.status === 'blocked' && onRetry && (
                <Button
                  variant="secondary"
                  onClick={() => setShowRetryConfirm(true)}
                  disabled={isSubmitting}
                >
                  Retry
                </Button>
              )}
              {(task.status === 'todo' || task.status === 'blocked' || task.status === 'in_progress') && onSkip && (
                <Button
                  variant="secondary"
                  onClick={() => setShowSkipConfirm(true)}
                  disabled={isSubmitting}
                >
                  Skip
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Status Section */}
          <div className="flex items-center justify-between">
            <div>
              <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide">
                Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium',
                    statusInfo.bg,
                    statusInfo.text,
                    statusInfo.border,
                    'border'
                  )}
                >
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
                {task.retryCount > 0 && (
                  <span className="ios-caption-1 text-ios-text-secondary">
                    (Retried {task.retryCount} time{task.retryCount > 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>
            {uptime !== null && (
              <div className="text-right">
                <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide">
                  In Progress For
                </span>
                <div className="ios-callout text-ios-text-primary mt-1">
                  {formatDuration(uptime)}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide block mb-2">
              Description
            </span>
            <p className="ios-body text-ios-text-primary">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Priority */}
          <div>
            <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide block mb-2">
              Priority
            </span>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((p) => (
                  <div
                    key={p}
                    className={clsx(
                      'w-3 h-3 rounded-full',
                      p <= task.priority
                        ? `bg-${['gray', 'yellow', 'orange', 'red', 'red'][p - 1]}-${400 + (p === 5 ? 200 : 100)}`
                        : 'bg-ios-gray-5'
                    )}
                  />
                ))}
              </div>
              <span className="ios-callout text-ios-text-primary">
                P{task.priority}
              </span>
            </div>
          </div>

          {/* Status Control (for manual override) */}
          {onStatusChange && (
            <div>
              <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide block mb-2">
                Change Status
              </span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(taskStatusColors) as TaskStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={status === task.status || isSubmitting}
                    className={clsx(
                      'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors',
                      status === task.status
                        ? `${taskStatusColors[status].text} ${taskStatusColors[status].bg} ${taskStatusColors[status].border}`
                        : 'text-ios-text-secondary bg-ios-bg-card border-ios-border hover:bg-ios-gray-5'
                    )}
                  >
                    {status.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files Involved */}
          {filesInvolved.length > 0 && (
            <div>
              <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide block mb-2">
                Files Involved
              </span>
              <div className="ios-card bg-ios-secondary p-3 space-y-1">
                {filesInvolved.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-ios-text-tertiary flex-shrink-0"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <code className="text-ios-text-primary">{file}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {task.dependencies && task.dependencies.length > 0 && (
            <div>
              <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide block mb-2">
                Dependencies
              </span>
              <div className="flex flex-wrap gap-2">
                {task.dependencies.map((dep) => (
                  <span key={dep.id} className="ios-badge bg-ios-gray-100 text-ios-text-secondary">
                    #{dep.id} {dep.description?.slice(0, 30)}...
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verify Command */}
          <div>
            <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide block mb-2">
              Verify Command
            </span>
            <div className="flex items-center gap-2">
              <code className="flex-1 ios-card p-3 text-sm text-ios-text-primary bg-ios-gray-6">
                verify-task --id {task.id}
              </code>
              <Button
                variant="secondary"
                size="small"
                onClick={handleCopyVerifyCommand}
                icon={
                  copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )
                }
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Notes (Agent Notes) */}
          {task.notes && (
            <div>
              <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide block mb-2">
                Notes
              </span>
              <div className="ios-card p-3 text-sm text-ios-text-secondary">
                {task.notes}
              </div>
            </div>
          )}

          {/* Test Results */}
          {task.testResults && task.testResults.length > 0 && (
            <div>
              <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide block mb-2">
                Test Results
              </span>
              <div className="ios-card p-3 space-y-2">
                {task.testResults.map((result, index) => (
                  <div
                    key={index}
                    className={clsx(
                      'flex items-start gap-3 p-2 rounded-md',
                      result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                    )}
                  >
                    <span className={result.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {result.success ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ios-text-primary mb-1">
                        {result.success ? 'Passed' : 'Failed'}
                      </div>
                      {result.logs && (
                        <pre className="text-xs text-ios-text-secondary whitespace-pre-wrap">
                          {result.logs}
                        </pre>
                      )}
                      <div className="text-xs text-ios-text-tertiary mt-1">
                        {formatDateTime(result.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Logs */}
          {task.agentLogs && task.agentLogs.length > 0 && (
            <div>
              <span className="ios-caption-1 text-ios-text-secondary uppercase tracking-wide block mb-2">
                Agent Logs
              </span>
              <div className="ios-card p-3 max-h-48 overflow-y-auto ios-scrollbar">
                {task.agentLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 py-1 border-b border-ios-border last:border-0">
                    <span className="text-xs text-ios-text-tertiary font-mono flex-shrink-0 w-12">
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-ios-text-primary flex-1">
                      {log.message}
                    </span>
                    <span className="text-xs text-ios-text-tertiary flex-shrink-0">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="ios-caption-1 text-ios-text-secondary block">
                Created
              </span>
              <span className="ios-callout text-ios-text-primary">
                {formatDateTime(task.createdAt)}
              </span>
            </div>
            <div>
              <span className="ios-caption-1 text-ios-text-secondary block">
                Updated
              </span>
              <span className="ios-callout text-ios-text-primary">
                {formatDateTime(task.updatedAt)}
              </span>
            </div>
            {task.completedAt && (
              <div>
                <span className="ios-caption-1 text-ios-text-secondary block">
                  Completed
                </span>
                <span className="ios-callout text-ios-text-primary">
                  {formatDateTime(task.completedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Retry Confirmation */}
      <ConfirmDialog
        isOpen={showRetryConfirm}
        onClose={() => setShowRetryConfirm(false)}
        onConfirm={handleRetry}
        title="Retry Task"
        message="This will reset the task status to 'todo' and increment the retry counter. The agent will attempt this task again."
        confirmText="Retry"
        variant="primary"
      />

      {/* Skip Confirmation */}
      <ConfirmDialog
        isOpen={showSkipConfirm}
        onClose={() => setShowSkipConfirm(false)}
        onConfirm={handleSkip}
        title="Skip Task"
        message="This will mark the task as done without execution. Use this only if you're certain the task can be safely skipped."
        confirmText="Skip"
        variant="danger"
      />
    </>
  );
}
