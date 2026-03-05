'use client';

import { useState } from 'react';
import { addAgentLogDev } from '@/lib/actions';
import { TaskSelect } from '@/db/schema';
import type { LogLevel } from '@/db/schema';

interface AddLogDialogProps {
  tasks: TaskSelect[];
  isOpen?: boolean;
  onClose?: () => void;
  onLogAdded?: () => void;
  defaultTaskId?: number;
}

const iosInputStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: 'var(--bg-bg-primary)',
  color: 'var(--text-text-primary)',
  borderColor: 'var(--ios-separator)',
  borderRadius: '8px',
  fontSize: '17px',
  outline: 'none',
  transition: 'box-shadow 0.2s',
};

const levelColors: Record<LogLevel, { bg: string; text: string; border: string }> = {
  debug: { bg: 'bg-status-idle-6', text: 'text-status-idle-2', border: 'border-status-idle-4' },
  info: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' },
  warn: { bg: 'bg-ios-yellow/10', text: 'text-ios-yellow', border: 'border-ios-yellow/20' },
  error: { bg: 'bg-status-error/10', text: 'text-status-error', border: 'border-status-error/20' },
};

export function AddLogDialog({
  tasks,
  isOpen: controlledIsOpen,
  onClose,
  onLogAdded,
  defaultTaskId,
}: AddLogDialogProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpenInternal;

  const [selectedTaskId, setSelectedTaskId] = useState(defaultTaskId || tasks[0]?.id || 0);
  const [level, setLevel] = useState<LogLevel>('info');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!selectedTaskId || selectedTaskId === 0) {
      setError('Please select a task');
      setIsSubmitting(false);
      return;
    }

    if (!message.trim()) {
      setError('Message is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await addAgentLogDev({
        taskId: selectedTaskId,
        level,
        message: message.trim(),
      });

      if (result.success) {
        setMessage('');
        setLevel('info');
        onLogAdded?.();
        onClose?.();
      } else {
        setError(result.error || 'Failed to add log');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setMessage('');
    setLevel('info');
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
        className="flex items-center gap-2 px-4 py-2 text-[13px] text-white rounded-[8px]  transition-colors"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14"/>
          <path d="M5 12h14"/>
        </svg>
        Add Log
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
      <div className="bg-bg-elevated border border-border-default rounded-[8px] shadow-xl w-full max-w-md mx-4 overflow-hidden ios relative z-10">
        <div className="p-6">
          <h2 className="text-[20px] font-semibold text-ios-primary mb-6 ">
            Add Agent Log
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-opacity-10 border rounded-[8px]"
              style={{ backgroundColor: 'var(--status-error)', borderColor: 'var(--ios-separator)' }}
              data-testid="error-message"
            >
              <p className="text-[11px] text-text-tertiary text-status-error ">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 ">
            <div>
              <label htmlFor="taskId" className="block text-[12px] text-ios-primary mb-2">
                Task
              </label>
              <select
                id="taskId"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(parseInt(e.target.value, 10))}
                required
                style={iosInputStyle}
              >
                <option value={0}>Select a task...</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    #{task.id}: {task.description?.substring(0, 50)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] text-ios-primary mb-2">
                Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(levelColors) as LogLevel[]).map((lvl) => {
                  const colors = levelColors[lvl];
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`px-3 py-2 rounded-ios-md text-[11px] font-medium font-medium transition-colors  ${
                        level === lvl
                          ? `${colors.bg} ${colors.text} ${colors.border} border-2`
                          : 'bg-bg-elevated text-text-secondary border-2 border-border-default hover:border-ios-separator/50'
                      }`}
                    >
                      {lvl.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-[12px] text-ios-primary mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what happened..."
                rows={4}
                required
                style={{ ...iosInputStyle, resize: 'none' }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-[13px] text-accent bg-ios-secondary border border-ios rounded-[8px]  disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-[13px] text-white rounded-[8px]  transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {isSubmitting ? 'Adding...' : 'Add Log'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
