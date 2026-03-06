'use client';

import { useState } from 'react';
import { createTaskDev } from '@/lib/actions';
import { TaskSelect } from '@/db/schema';
import { PlanSelect } from '@/db/schema';

interface CreateTaskDialogProps {
  projectId: number;
  plans: PlanSelect[];
  existingTasks: TaskSelect[];
  prefilledStatus?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onTaskCreated?: (task: TaskSelect) => void;
}

// Parse description for quick mode
// Supports: "Fix bug #5 in src/api/auth.ts"
export const parseQuickDescription = (text: string) => {
  const trimmed = text.trim();

  // Extract priority: #1, #2, #3 through #10
  const priorityMatch = trimmed.match(/#([1-9]|10)\b/);
  const priority = priorityMatch ? priorityMatch[1] : '5'; // Default to 5

  // Extract file paths from quotes
  const filePaths: string[] = [];
  const quotedMatches = trimmed.matchAll(/"([^"]+?)"/g);
  for (const match of quotedMatches) {
    filePaths.push(match[1]);
  }

  // Remove file paths and priority notation from description
  let description = trimmed;
  filePaths.forEach((file) => {
    description = description.replace(`"${file}"`, '');
  });
  description = description.replace(/#[1-9]\b/g, '').replace(/#10\b/g, '').replace(/\s+/g, ' ').trim();

  return {
    priority: parseInt(priority, 10),
    description: description || trimmed,
    filesInvolved: filePaths,
  };
};

const inputClass = "w-full h-[40px] px-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[var(--font-size-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-selected)] transition-all";
const textareaClass = "w-full p-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[var(--font-size-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-selected)] transition-all resize-none";
const labelClass = "block text-[var(--font-size-xs)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-[var(--sp-2)]";

export function CreateTaskDialog({
  projectId,
  plans,
  existingTasks,
  prefilledStatus = 'todo',
  isOpen: controlledIsOpen,
  onClose,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpenInternal;
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [formData, setFormData] = useState({
    planId: plans[0]?.id || 0,
    description: '',
    filesInvolved: '',
    priority: '1',
    dependencyTaskId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDescriptionChange = (value: string) => {
    setFormData({ ...formData, description: value });

    if (isQuickMode) {
      const parsed = parseQuickDescription(value);
      setFormData((prev) => ({
        ...prev,
        priority: parsed.priority.toString(),
        filesInvolved: parsed.filesInvolved.join(', '),
      }));
    }
  };

  const handleQuickModeToggle = (checked: boolean) => {
    setIsQuickMode(checked);
    // When switching to quick mode, parse current description
    if (checked && formData.description) {
      const parsed = parseQuickDescription(formData.description);
      setFormData((prev) => ({
        ...prev,
        priority: parsed.priority.toString(),
        filesInvolved: parsed.filesInvolved.join(', '),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const filesInvolved = formData.filesInvolved
        ? formData.filesInvolved.split(',').map((f) => f.trim()).filter((f) => f)
        : undefined;

      const priority = parseInt(formData.priority, 10);
      if (isNaN(priority) || priority < 1 || priority > 10) {
        setError('Priority must be a number between 1 and 10');
        setIsSubmitting(false);
        return;
      }

      const dependencyTaskId = formData.dependencyTaskId
        ? parseInt(formData.dependencyTaskId, 10)
        : null;

      if (!isQuickMode && (!formData.planId || formData.planId === 0)) {
        setError('Please select a plan');
        setIsSubmitting(false);
        return;
      }

      // In quick mode, use default plan if not selected
      const planId = isQuickMode ? (plans[0]?.id || 0) : formData.planId;

      if (!formData.description.trim()) {
        setError('Description is required');
        setIsSubmitting(false);
        return;
      }

      const result = await createTaskDev({
        planId,
        description: formData.description.trim(),
        filesInvolved,
        priority,
        dependencyTaskId,
      });

      if (result.success && result.task) {
        setFormData({
          planId: plans[0]?.id || 0,
          description: '',
          filesInvolved: '',
          priority: '1',
          dependencyTaskId: '',
        });
        onTaskCreated?.(result.task);
        onClose?.();
      } else {
        setError(result.error || 'Failed to create task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      planId: plans[0]?.id || 0,
      description: '',
      filesInvolved: '',
      priority: '1',
      dependencyTaskId: '',
    });
    setError('');
    onClose?.();
  };

  if (!isOpen) {
    return (
      <button
        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] font-medium transition-colors text-2xl"
        onClick={() => {
          if (controlledIsOpen === undefined) {
            setIsOpenInternal(true);
          }
        }}
        title="Add Task"
      >
        +
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
          <h2 className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-primary)] mb-[var(--sp-6)]">
            Create New Task
          </h2>

          {/* Quick Mode Toggle */}
          <div className="mb-[var(--sp-6)] flex items-center justify-between bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] p-[var(--sp-3)]">
            <div>
              <span className="text-[var(--font-size-sm)] text-[var(--color-text-primary)] font-medium">Quick Mode</span>
              <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)]">
                Auto-parse priority and files from description
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleQuickModeToggle(!isQuickMode)}
              className={`w-[40px] h-[22px] rounded-full p-[2px] transition-colors ${isQuickMode ? 'bg-[var(--color-brand-bold)]' : 'bg-[var(--color-border-default)]'
                }`}
              aria-pressed={isQuickMode}
            >
              <span
                className={`block w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${isQuickMode ? 'translate-x-[18px]' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          {error && (
            <div className="mb-[var(--sp-4)] p-[var(--sp-3)] bg-[var(--status-blocked-bg)] border border-[var(--status-blocked-text)] rounded-[var(--radius-sm)]">
              <p className="text-[var(--font-size-xs)] text-[var(--status-blocked-text)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-[var(--sp-4)]">
            {!isQuickMode && (
              <div>
                <label htmlFor="planId" className={labelClass}>Plan</label>
                <select
                  id="planId"
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: parseInt(e.target.value, 10) })}
                  required={!isQuickMode}
                  className={inputClass}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>Plan #{plan.id}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="description" className={labelClass}>Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder={
                  isQuickMode
                    ? '[P3] Modify "src/api/auth.ts" to add JWT verification'
                    : 'Implement user authentication API endpoint'
                }
                rows={3}
                required
                className={textareaClass}
              />
              {isQuickMode && (
                <p className="mt-[var(--sp-1)] text-[var(--font-size-xs)] text-[var(--color-text-secondary)]">
                  Tips: Use [P1-P10] for priority, quote files like &quot;src/api/auth.ts&quot;
                </p>
              )}
            </div>

            {!isQuickMode && (
              <div>
                <label htmlFor="filesInvolved" className={labelClass}>Files</label>
                <input
                  type="text"
                  id="filesInvolved"
                  value={formData.filesInvolved}
                  onChange={(e) => setFormData({ ...formData, filesInvolved: e.target.value })}
                  placeholder="src/api/auth.ts, tests/auth.test.ts"
                  className={inputClass}
                />
                <p className="mt-[var(--sp-1)] text-[var(--font-size-xs)] text-[var(--color-text-tertiary)]">Separate files with commas</p>
              </div>
            )}

            {!isQuickMode && (
              <div>
                <label htmlFor="priority" className={labelClass}>Priority (1-10)</label>
                <input
                  type="number"
                  id="priority"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label htmlFor="dependencyTaskId" className={labelClass}>Depends on Task</label>
              <select
                id="dependencyTaskId"
                value={formData.dependencyTaskId}
                onChange={(e) => setFormData({ ...formData, dependencyTaskId: e.target.value })}
                className={inputClass}
              >
                <option value="">No dependencies</option>
                {existingTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    #{task.id}: {(task.description || '').substring(0, 50)}
                    {task.description && task.description.length > 50 ? '...' : ''}
                  </option>
                ))}
              </select>
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
                disabled={isSubmitting || !formData.description.trim()}
                className="px-[var(--sp-4)] py-[var(--sp-2)] text-[var(--font-size-sm)] text-white bg-[var(--color-brand-bold)] rounded-[var(--radius-sm)] hover:bg-[var(--color-brand-bold-hovered)] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
