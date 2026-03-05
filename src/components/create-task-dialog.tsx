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
const iosInputFocusStyle = {
  boxShadow: '0 0 0 2px var(--ios-blue)',
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

  // Parse description for quick mode
  // Supports: "[P3] Modify src/api/auth.ts and tests/auth.test.ts"
  const parseQuickDescription = (text: string) => {
    const trimmed = text.trim();

    // Extract priority: [P1], [P2], [P3], etc.
    const priorityMatch = trimmed.match(/\[P([1-9]|10)\]/i);
    const priority = priorityMatch ? priorityMatch[1] : '1';

    // Extract file paths: simple .ts, .tsx extensions, or paths in quotes
    const fileMatches = trimmed.matchAll(/"([^"]+\.(ts|tsx|js|jsx))"/g);
    const extMatches = trimmed.matchAll(/\b([a-zA-Z0-9_/\\.-]+\.(ts|tsx|js|jsx))\b/g);

    const files = [
      ...[...fileMatches].map((m) => m[1]),
      ...[...extMatches].map((m) => m[1]),
    ];

    return { priority, files, text: trimmed.replace(/\[P([1-9]|10)\]/gi, '').replace(/"[^"]+\.(ts|tsx|js|jsx)"/g, '').trim() };
  };

  const handleDescriptionChange = (value: string) => {
    setFormData({ ...formData, description: value });

    if (isQuickMode) {
      const parsed = parseQuickDescription(value);
      setFormData((prev) => ({
        ...prev,
        priority: parsed.priority,
        filesInvolved: parsed.files.join(', '),
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
        priority: parsed.priority,
        filesInvolved: parsed.files.join(', '),
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
        className="text-ios-placeholder hover:text-ios-primary font-medium transition-colors ios-font-text text-2xl"
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

      <div className="ios-card shadow-xl w-full max-w-lg mx-4 overflow-hidden ios relative z-10">
        <div className="p-6">
          <h2 className="ios-title-2 text-ios-primary mb-6 ios-font-display">
            Create New Task
          </h2>

          {/* Quick Mode Toggle */}
          <div className="mb-6 flex items-center justify-between ios-card p-3 border-ios-border">
            <div>
              <span className="ios-body text-ios-primary font-medium">Quick Mode</span>
              <p className="ios-caption-1 text-ios-secondary">
                Auto-parse priority and files from description
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleQuickModeToggle(!isQuickMode)}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                isQuickMode ? 'bg-ios-blue' : 'bg-ios-gray-5'
              }`}
              aria-pressed={isQuickMode}
            >
              <span
                className={`block w-5 h-5 rounded-full transition-transform ${
                  isQuickMode ? 'translate-x-5 bg-white' : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-opacity-10 border ios-radius" style={{ backgroundColor: 'var(--ios-red)', borderColor: 'var(--ios-separator)' }}>
              <p className="text-sm text-ios-red ios-font-text">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 ios-font-text">
            {!isQuickMode && (
              <div>
                <label htmlFor="planId" className="block ios-subheadline text-ios-primary mb-2">
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
              <label htmlFor="description" className="block ios-subheadline text-ios-primary mb-2">
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
                <p className="mt-1 ios-caption text-ios-secondary">
                  Tips: Use [P1-P10] for priority, quote files like "src/api/auth.ts"
                </p>
              )}
            </div>

            {!isQuickMode && (
              <div>
                <label htmlFor="filesInvolved" className="block ios-subheadline text-ios-primary mb-2">
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
                <p className="mt-1 ios-caption text-ios-placeholder">Separate files with commas</p>
              </div>
            )}

            {!isQuickMode && (
              <div>
                <label htmlFor="priority" className="block ios-subheadline text-ios-primary mb-2">
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
              <label htmlFor="dependencyTaskId" className="block ios-subheadline text-ios-primary mb-2">
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
                className="px-4 py-2 ios-body text-ios-blue bg-ios-secondary border border-ios ios-radius ios-font-text disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.description.trim()}
                className="px-4 py-2 ios-body text-white ios-radius ios-font-text transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--ios-blue)' }}
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
