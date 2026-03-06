'use client';

import { useState } from 'react';
import { logTestResultDev } from '@/lib/actions';
import { TaskSelect } from '@/db/schema';
import { CheckCircle2, XCircle } from 'lucide-react';

interface LogTestResultDialogProps {
  task: TaskSelect;
  isOpen?: boolean;
  onClose?: () => void;
  onResultLogged?: () => void;
}

const textareaClass = "w-full p-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[var(--font-size-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-selected)] transition-all resize-none";
const labelClass = "block text-[var(--font-size-xs)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-[var(--sp-2)]";

export function LogTestResultDialog({
  task,
  isOpen: controlledIsOpen,
  onClose,
  onResultLogged,
}: LogTestResultDialogProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpenInternal;

  const [success, setSuccess] = useState<boolean | null>(null);
  const [logs, setLogs] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (success === null) {
      setError('Please select a test result');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await logTestResultDev({
        taskId: task.id,
        success,
        logs: logs.trim(),
      });

      if (result.success) {
        setLogs('');
        setSuccess(null);
        onResultLogged?.();
        onClose?.();
      } else {
        setError(result.error || 'Failed to log test result');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setLogs('');
    setSuccess(null);
    setError('');
    onClose?.();
  };

  // Trigger button
  if (!isOpen) {
    return (
      <button
        onClick={() => {
          if (controlledIsOpen === undefined) {
            setIsOpenInternal(true);
          }
        }}
        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        title="Log Test Result"
      >
        <CheckCircle2 size={16} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleCancel}
      />

      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-overlay)] w-full max-w-lg mx-[var(--sp-4)] overflow-hidden relative z-10">
        <div className="p-[var(--sp-6)]">
          <h2 className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-primary)] mb-[var(--sp-4)]">
            Log Test Result
          </h2>

          {/* Task Info */}
          <div className="mb-[var(--sp-4)] p-[var(--sp-3)] bg-[var(--color-bg-sunken)] rounded-[var(--radius-sm)]">
            <p className="text-[var(--font-size-xs)] text-[var(--color-text-tertiary)] mb-[var(--sp-1)]">Task</p>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-primary)]">
              #{task.id}: {task.description?.substring(0, 80)}
              {task.description && task.description.length > 80 ? '...' : ''}
            </p>
          </div>

          {error && (
            <div className="mb-[var(--sp-4)] p-[var(--sp-3)] bg-[var(--status-blocked-bg)] border border-[var(--status-blocked-text)] rounded-[var(--radius-sm)]">
              <p className="text-[var(--font-size-xs)] text-[var(--status-blocked-text)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-[var(--sp-4)]">
            <div>
              <label className={`${labelClass} mb-[var(--sp-3)]`}>Test Result</label>
              <div className="grid grid-cols-2 gap-[var(--sp-3)]">
                <button
                  type="button"
                  onClick={() => setSuccess(true)}
                  className={`p-[var(--sp-4)] rounded-[var(--radius-sm)] text-[var(--font-size-sm)] transition-all ${success === true
                    ? 'bg-[var(--status-done-bg)] text-[var(--status-done-text)] border-2 border-[var(--status-done-text)]'
                    : 'bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)] border-2 border-[var(--color-border-default)] hover:border-[var(--status-done-text)]'
                    }`}
                >
                  <div className="flex flex-col items-center gap-[var(--sp-2)]">
                    <CheckCircle2 size={32} className={success === true ? 'text-[var(--status-done-text)]' : 'text-[var(--color-text-tertiary)]'} />
                    <span className="font-semibold">Passed</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className={`p-[var(--sp-4)] rounded-[var(--radius-sm)] text-[var(--font-size-sm)] transition-all ${success === false
                    ? 'bg-[var(--status-blocked-bg)] text-[var(--status-blocked-text)] border-2 border-[var(--status-blocked-text)]'
                    : 'bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)] border-2 border-[var(--color-border-default)] hover:border-[var(--status-blocked-text)]'
                    }`}
                >
                  <div className="flex flex-col items-center gap-[var(--sp-2)]">
                    <XCircle size={32} className={success === false ? 'text-[var(--status-blocked-text)]' : 'text-[var(--color-text-tertiary)]'} />
                    <span className="font-semibold">Failed</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="logs" className={labelClass}>Test Logs</label>
              <textarea
                id="logs"
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
                placeholder="Paste test output, error messages, or verification details..."
                rows={6}
                className={`${textareaClass} font-mono text-[var(--font-size-xs)]`}
              />
              <p className="mt-[var(--sp-1)] text-[var(--font-size-xs)] text-[var(--color-text-tertiary)]">
                Optional but recommended for tracking
              </p>
            </div>

            <div className="flex justify-end gap-[var(--sp-3)] pt-[var(--sp-4)]">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-[var(--sp-4)] py-[var(--sp-2)] text-[var(--font-size-sm)] text-[var(--color-brand-bold)] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-hovered)] disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || success === null}
                className="px-[var(--sp-4)] py-[var(--sp-2)] text-[var(--font-size-sm)] text-white bg-[var(--color-brand-bold)] rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-bold-hovered)] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
