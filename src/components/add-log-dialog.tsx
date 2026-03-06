'use client';

import { useState } from 'react';
import { addAgentLogDev } from '@/lib/actions';
import { TaskSelect } from '@/db/schema';
import type { LogLevel } from '@/db/schema';
import { Plus } from 'lucide-react';

interface AddLogDialogProps {
  tasks: TaskSelect[];
  isOpen?: boolean;
  onClose?: () => void;
  onLogAdded?: () => void;
  defaultTaskId?: number;
}

const inputClass = "w-full h-[40px] px-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[var(--font-size-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-selected)] transition-all";
const textareaClass = "w-full p-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[var(--font-size-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-selected)] transition-all resize-none";
const labelClass = "block text-[var(--font-size-xs)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-[var(--sp-2)]";

const levelColors: Record<LogLevel, { bg: string; text: string; border: string }> = {
  debug: { bg: 'bg-[var(--log-debug-bg)]', text: 'text-[var(--log-debug-text)]', border: 'border-[var(--log-debug-text)]' },
  info: { bg: 'bg-[var(--log-info-bg)]', text: 'text-[var(--log-info-text)]', border: 'border-[var(--log-info-text)]' },
  warn: { bg: 'bg-[var(--log-warn-bg)]', text: 'text-[var(--log-warn-text)]', border: 'border-[var(--log-warn-text)]' },
  error: { bg: 'bg-[var(--log-error-bg)]', text: 'text-[var(--log-error-text)]', border: 'border-[var(--log-error-text)]' },
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
      const result = await addAgentLogDev(({
        taskId: selectedTaskId,
        level,
        message: message.trim(),
      }));

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
        className="flex items-center gap-[var(--sp-2)] px-[var(--sp-4)] py-[var(--sp-2)] text-[var(--font-size-sm)] text-white bg-[var(--color-brand-bold)] rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-bold-hovered)] transition-colors"
      >
        <Plus size={16} />
        Add Log
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleCancel}
      />

      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-overlay)] w-full max-w-md mx-[var(--sp-4)] overflow-hidden relative z-10">
        <div className="p-[var(--sp-6)]">
          <h2 className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-primary)] mb-[var(--sp-6)]">
            Add Agent Log
          </h2>

          {error && (
            <div className="mb-[var(--sp-4)] p-[var(--sp-3)] bg-[var(--status-blocked-bg)] border border-[var(--status-blocked-text)] rounded-[var(--radius-sm)]"
              data-testid="error-message"
            >
              <p className="text-[var(--font-size-xs)] text-[var(--status-blocked-text)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-[var(--sp-4)]">
            <div>
              <label htmlFor="taskId" className={labelClass}>Task</label>
              <select
                id="taskId"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(parseInt(e.target.value, 10))}
                required
                className={inputClass}
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
              <label className={labelClass}>Level</label>
              <div className="grid grid-cols-4 gap-[var(--sp-2)]">
                {(Object.keys(levelColors) as LogLevel[]).map((lvl) => {
                  const colors = levelColors[lvl];
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`px-[var(--sp-3)] py-[var(--sp-2)] rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-bold transition-colors ${level === lvl
                          ? `${colors.bg} ${colors.text} ${colors.border} border-2`
                          : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border-2 border-[var(--color-border-default)] hover:bg-[var(--color-bg-hovered)]'
                        }`}
                    >
                      {lvl.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="message" className={labelClass}>Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what happened..."
                rows={4}
                required
                className={textareaClass}
              />
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
                disabled={isSubmitting}
                className="px-[var(--sp-4)] py-[var(--sp-2)] text-[var(--font-size-sm)] text-white bg-[var(--color-brand-bold)] rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-bold-hovered)] transition-colors disabled:opacity-50"
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
