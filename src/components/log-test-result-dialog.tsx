'use client';

import { useState } from 'react';
import { logTestResultDev } from '@/lib/actions';
import { TaskSelect } from '@/db/schema';

interface LogTestResultDialogProps {
  task: TaskSelect;
  isOpen?: boolean;
  onClose?: () => void;
  onResultLogged?: () => void;
}

const iosInputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--ios-bg-primary)',
  color: 'var(--ios-text-primary)',
  borderColor: 'var(--ios-separator)',
  borderRadius: '8px',
  fontSize: '17px',
  outline: 'none',
  transition: 'box-shadow 0.2s',
};

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
        className="text-ios-placeholder hover:text-ios-primary transition-colors ios-font-text"
        title="Log Test Result"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ios-font">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="ios-card shadow-xl w-full max-w-lg mx-4 overflow-hidden ios relative z-10">
        <div className="p-6">
          <h2 className="ios-title-2 text-ios-primary mb-4 ios-font-display">
            Log Test Result
          </h2>

          {/* Task Info */}
          <div className="mb-4 p-3 bg-ios-secondary rounded-lg">
            <p className="ios-caption text-ios-placeholder mb-1 ios-font-text">Task</p>
            <p className="ios-body text-ios-primary ios-font-text">
              #{task.id}: {task.description?.substring(0, 80)}
              {task.description && task.description.length > 80 ? '...' : ''}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-opacity-10 border ios-radius"
              style={{ backgroundColor: 'var(--ios-red)', borderColor: 'var(--ios-separator)' }}
            >
              <p className="text-sm text-ios-red ios-font-text">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 ios-font-text">
            <div>
              <label className="block ios-subheadline text-ios-primary mb-3">
                Test Result
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSuccess(true)}
                  className={`p-4 rounded-lg ios-body ios-font-text transition-all ${
                    success === true
                      ? 'bg-green-100 text-green-800 border-2 border-green-400'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={success === true ? 'text-green-600' : 'text-gray-400'}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span className="font-semibold">Passed</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className={`p-4 rounded-lg ios-body ios-font-text transition-all ${
                    success === false
                      ? 'bg-red-100 text-red-800 border-2 border-red-400'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={success === false ? 'text-red-600' : 'text-gray-400'}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span className="font-semibold">Failed</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="logs" className="block ios-subheadline text-ios-primary mb-2">
                Test Logs
              </label>
              <textarea
                id="logs"
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
                placeholder="Paste test output, error messages, or verification details..."
                rows={6}
                className="font-mono text-sm ios-font-text"
                style={{ ...iosInputStyle, resize: 'none' }}
              />
              <p className="mt-1 ios-caption text-ios-placeholder ios-font-text">
                Optional but recommended for tracking
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || success === null}
                className="px-4 py-2 ios-body text-white ios-radius ios-font-text transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--ios-blue)' }}
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
