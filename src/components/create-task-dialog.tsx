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
const iosInputFocusStyle = {
  boxShadow: '0 0 0 2px var(--accent)',
};

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
        className="text-text-tertiary hover:text-ios-primary font-medium transition-colors  text-2xl"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center ios-font">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      <div className="bg-bg-elevated border border-border-default rounded-[8px] shadow-xl w-full max-w-lg mx-4 overflow-hidden ios relative z-10">
        <div className="p-6">
          <h2 className="text-[20px] font-semibold text-ios-primary mb-6 ">
            Create New Task
          </h2>

          {/* Quick Mode Toggle */}
          <div className="mb-6 flex items-center justify-between bg-bg-elevated border border-border-default rounded-[8px] p-3 border-border-default">
            <div>
              <span className="text-[13px] text-ios-primary font-medium">Quick Mode</span>
              <p className="text-[11px] text-text-secondary">
                Auto-parse priority and files from description
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleQuickModeToggle(!isQuickMode)}
              className={`w-12 h-7 rounded-ios-xl p-1 transition-colors ${isQuickMode ? 'bg-accent' : 'bg-status-idle-5'
                }`}
              aria-pressed={isQuickMode}
            >
              <span
                className={`block w-5 h-5 rounded-full transition-transform ${isQuickMode ? 'translate-x-5 bg-bg-elevated' : 'translate-x-0 bg-bg-elevated'
                  }`}
              />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-opacity-10 border rounded-[8px]" style={{ backgroundColor: 'var(--status-error)', borderColor: 'var(--ios-separator)' }}>
              <p className="text-[11px] text-text-tertiary text-status-error ">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 ">
            {!isQuickMode && (
              <div>
                <label htmlFor="planId" className="block text-[12px] text-ios-primary mb-2">
                  Plan
                </label>
                <select
                  id="planId"
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: parseInt(e.target.value, 10) })}
                  required={!isQuickMode}
                  style={iosInputStyle}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>Plan #{plan.id}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="description" className="block text-[12px] text-ios-primary mb-2">
                Description
              </label>
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
                style={{ ...iosInputStyle, resize: 'none' }}
              />
              {isQuickMode && (
                <p className="mt-1 ios-caption text-text-secondary">
                  Tips: Use [P1-P10] for priority, quote files like "src/api/auth.ts"
                </p>
              )}
            </div>

            {!isQuickMode && (
              <div>
                <label htmlFor="filesInvolved" className="block text-[12px] text-ios-primary mb-2">
                  Files
                </label>
                <input
                  type="text"
                  id="filesInvolved"
                  value={formData.filesInvolved}
                  onChange={(e) => setFormData({ ...formData, filesInvolved: e.target.value })}
                  placeholder="src/api/auth.ts, tests/auth.test.ts"
                  style={iosInputStyle}
                />
                <p className="mt-1 ios-caption text-text-tertiary">Separate files with commas</p>
              </div>
            )}

            {!isQuickMode && (
              <div>
                <label htmlFor="priority" className="block text-[12px] text-ios-primary mb-2">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  id="priority"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={iosInputStyle}
                />
              </div>
            )}

            <div>
              <label htmlFor="dependencyTaskId" className="block text-[12px] text-ios-primary mb-2">
                Depends on Task
              </label>
              <select
                id="dependencyTaskId"
                value={formData.dependencyTaskId}
                onChange={(e) => setFormData({ ...formData, dependencyTaskId: e.target.value })}
                style={iosInputStyle}
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
                disabled={isSubmitting || !formData.description.trim()}
                className="px-4 py-2 text-[13px] text-white rounded-[8px]  transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
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
