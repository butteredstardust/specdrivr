'use client';

import { useState } from 'react';
import { TaskSelect } from '@/db/schema';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { taskStatusColors, type TaskStatus } from '@/lib/ios-styles';
import { formatDateTime, formatDuration } from '@/lib/ios-styles';
import { clsx } from 'clsx';
import { FileText, Copy, Check } from 'lucide-react';

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

  const sectionLabel = "text-[var(--font-size-xs)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-[var(--sp-2)]";
  const infoBox = "bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-[var(--sp-3)]";

  return (
    <>
      <Dialog
        data-testid="task-detail-modal"
        isOpen={isOpen}
        onClose={onClose}
        title={`Task #${task.id}`}
        size="large"
        footer={
          <div className="flex items-center justify-between flex-wrap gap-[var(--sp-3)]">
            <div className="text-[var(--font-size-sm)] text-[var(--text-secondary)]">
              Created {formatDateTime(task.createdAt)}
            </div>
            <div className="flex items-center gap-[var(--sp-2)]">
              {task.status === 'blocked' && onRetry && (
                <Button
                  variant="secondary"
                  onClick={() => setShowRetryConfirm(true)}
                  disabled={isSubmitting}
                  data-testid="task-retry-button"
                >
                  Retry
                </Button>
              )}
              {(task.status === 'todo' || task.status === 'blocked' || task.status === 'in_progress') && onSkip && (
                <Button
                  variant="secondary"
                  onClick={() => setShowSkipConfirm(true)}
                  disabled={isSubmitting}
                  data-testid="task-skip-button"
                >
                  Skip
                </Button>
              )}
              <Button onClick={onClose} data-testid="modal-close">Close</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-[var(--sp-6)]">
          {/* Status Section */}
          <div className="flex items-center justify-between">
            <div>
              <span className={sectionLabel}>Status</span>
              <div className="flex items-center gap-[var(--sp-2)] mt-[var(--sp-1)]">
                <span
                  className={clsx(
                    'inline-flex items-center gap-[var(--sp-1)] px-[var(--sp-2)] py-[var(--sp-1)] rounded-[var(--radius-sm)] text-[var(--font-size-sm)] font-bold',
                    statusInfo.bg,
                    statusInfo.text,
                    'border'
                  )}
                >
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
                {task.retryCount > 0 && (
                  <span className="text-[var(--font-size-xs)] text-[var(--text-secondary)]">
                    (Retried {task.retryCount} time{task.retryCount > 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>
            {uptime !== null && (
              <div className="text-right">
                <span className="text-[var(--font-size-xs)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                  In Progress For
                </span>
                <div className="text-[var(--font-size-sm)] font-medium text-[var(--text-primary)] mt-[var(--sp-1)]">
                  {formatDuration(uptime)}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <span className={sectionLabel}>Description</span>
            <p data-testid="task-description" className="text-[var(--font-size-sm)] text-[var(--text-primary)]">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Priority */}
          <div>
            <span className={sectionLabel}>Priority</span>
            <div className="flex items-center gap-[var(--sp-2)]">
              <div className="flex gap-[2px]">
                {[1, 2, 3, 4, 5].map((p) => (
                  <div
                    key={p}
                    className={clsx(
                      'w-[12px] h-[12px] rounded-full',
                      p <= Math.min(task.priority, 5)
                        ? 'bg-[var(--status-blocked-text)]'
                        : 'bg-[var(--bg-sunken)]'
                    )}
                  />
                ))}
              </div>
              <span data-testid="task-priority" className="text-[var(--font-size-sm)] font-medium text-[var(--text-primary)]">
                P{task.priority}
              </span>
            </div>
          </div>

          {/* Status Control (for manual override) */}
          {onStatusChange && (
            <div>
              <span className={sectionLabel}>Change Status</span>
              <div data-testid="change-status-button" className="flex flex-wrap gap-[var(--sp-2)]">
                {(Object.keys(taskStatusColors) as TaskStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={status === task.status || isSubmitting}
                    data-testid={`status-option-${status}`.toLowerCase()}
                    className={clsx(
                      'px-[var(--sp-3)] py-[6px] rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-bold border transition-colors',
                      status === task.status
                        ? `${taskStatusColors[status].text} ${taskStatusColors[status].bg} ${'border' in taskStatusColors[status] ? taskStatusColors[status].border : ''}`
                        : 'text-[var(--text-secondary)] bg-[var(--bg-surface)] border-[var(--border-default)] hover:bg-[var(--bg-hovered)]'
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
              <span className={sectionLabel}>Files Involved</span>
              <div className={clsx(infoBox, 'space-y-[var(--sp-1)]')}>
                {filesInvolved.map((file, index) => (
                  <div key={index} className="flex items-center gap-[var(--sp-2)] text-[var(--font-size-xs)]">
                    <FileText size={14} className="text-[var(--text-tertiary)] flex-shrink-0" />
                    <code className="text-[var(--text-primary)]">{file}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {task.dependencies && task.dependencies.length > 0 && (
            <div>
              <span className={sectionLabel}>Dependencies</span>
              <div className="flex flex-wrap gap-[var(--sp-2)]">
                {task.dependencies.map((dep) => (
                  <span key={dep.id} className="px-[var(--sp-2)] py-[var(--sp-1)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--font-size-xs)] text-[var(--text-secondary)] font-medium">
                    #{dep.id} {dep.description?.slice(0, 30)}...
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verify Command */}
          <div>
            <span className={sectionLabel}>Verify Command</span>
            <div className="flex items-center gap-[var(--sp-2)]">
              <code className={clsx(infoBox, 'flex-1 text-[var(--font-size-xs)] text-[var(--text-primary)] font-mono')}>
                verify-task --id {task.id}
              </code>
              <Button
                variant="secondary"
                size="small"
                onClick={handleCopyVerifyCommand}
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Notes (Agent Notes) */}
          {task.notes && (
            <div>
              <span className={sectionLabel}>Notes</span>
              <div className={clsx(infoBox, 'text-[var(--font-size-xs)] text-[var(--text-secondary)]')}>
                {task.notes}
              </div>
            </div>
          )}

          {/* Test Results */}
          {task.testResults && task.testResults.length > 0 && (
            <div>
              <span className={sectionLabel}>Test Results</span>
              <div className={clsx(infoBox, 'space-y-[var(--sp-2)]')}>
                {task.testResults.map((result, index) => (
                  <div
                    key={index}
                    className={clsx(
                      'flex items-start gap-[var(--sp-3)] p-[var(--sp-2)] rounded-[var(--radius-sm)]',
                      result.success ? 'bg-[var(--status-done-bg)]' : 'bg-[var(--status-blocked-bg)]'
                    )}
                  >
                    <span className={result.success ? 'text-[var(--status-done-text)]' : 'text-[var(--status-blocked-text)]'}>
                      {result.success ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <div className="text-[var(--font-size-xs)] font-medium text-[var(--text-primary)] mb-[var(--sp-1)]">
                        {result.success ? 'Passed' : 'Failed'}
                      </div>
                      {result.logs && (
                        <pre className="text-[var(--font-size-xs)] text-[var(--text-secondary)] whitespace-pre-wrap">
                          {result.logs}
                        </pre>
                      )}
                      <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)] mt-[var(--sp-1)]">
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
              <span className={sectionLabel}>Agent Logs</span>
              <div className={clsx(infoBox, 'max-h-[192px] overflow-y-auto')}>
                {task.agentLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-[var(--sp-3)] py-[var(--sp-1)] border-b border-[var(--border-default)] last:border-0">
                    <span className="text-[var(--font-size-xs)] text-[var(--text-tertiary)] font-mono flex-shrink-0 w-[48px]">
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-[var(--font-size-xs)] text-[var(--text-primary)] flex-1">
                      {log.message}
                    </span>
                    <span className="text-[var(--font-size-xs)] text-[var(--text-tertiary)] flex-shrink-0">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-[var(--sp-4)] text-[var(--font-size-xs)] text-[var(--text-tertiary)]">
            <div>
              <span className="text-[var(--font-size-xs)] text-[var(--text-secondary)] block">
                Created
              </span>
              <span className="text-[var(--font-size-sm)] font-medium text-[var(--text-primary)]">
                {formatDateTime(task.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-[var(--font-size-xs)] text-[var(--text-secondary)] block">
                Updated
              </span>
              <span className="text-[var(--font-size-sm)] font-medium text-[var(--text-primary)]">
                {formatDateTime(task.updatedAt)}
              </span>
            </div>
            {task.completedAt && (
              <div>
                <span className="text-[var(--font-size-xs)] text-[var(--text-secondary)] block">
                  Completed
                </span>
                <span className="text-[var(--font-size-sm)] font-medium text-[var(--text-primary)]">
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
