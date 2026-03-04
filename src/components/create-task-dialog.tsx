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
  const [formData, setFormData] = useState({
    planId: plans[0]?.id || 0,
    description: '',
    filesInvolved: '',
    priority: '1',
    dependencyTaskId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Parse files involved
      const filesInvolved = formData.filesInvolved
        ? formData.filesInvolved.split(',').map((f) => f.trim()).filter((f) => f)
        : undefined;

      // Parse priority
      const priority = parseInt(formData.priority, 10);
      if (isNaN(priority) || priority < 1 || priority > 10) {
        setError('Priority must be a number between 1 and 10');
        setIsSubmitting(false);
        return;
      }

      // Parse dependency task id
      const dependencyTaskId = formData.dependencyTaskId
        ? parseInt(formData.dependencyTaskId, 10)
        : null;

      if (!formData.planId || formData.planId === 0) {
        setError('Please select a plan');
        setIsSubmitting(false);
        return;
      }

      if (!formData.description.trim()) {
        setError('Description is required');
        setIsSubmitting(false);
        return;
      }

      const result = await createTaskDev({
        planId: formData.planId,
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
        className="text-gray-400 hover:text-gray-600 font-medium transition-colors"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Task</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Plan Selection */}
            <div>
              <label htmlFor="planId" className="block text-sm font-medium text-gray-700 mb-1">
                Select Plan *
              </label>
              <select
                id="planId"
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    Plan #{plan.id} (ID: {plan.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Implement user authentication API endpoint"
                rows={3}
                required
              />
            </div>

            {/* Files Involved */}
            <div>
              <label htmlFor="filesInvolved" className="block text-sm font-medium text-gray-700 mb-1">
                Files Involved (comma-separated)
              </label>
              <input
                type="text"
                id="filesInvolved"
                value={formData.filesInvolved}
                onChange={(e) => setFormData({ ...formData, filesInvolved: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="src/api/auth.ts, tests/auth.test.ts"
              />
              <p className="mt-1 text-xs text-gray-500">Separate multiple files with commas</p>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1-10, higher = more important)
              </label>
              <input
                type="number"
                id="priority"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Dependency Task */}
            <div>
              <label htmlFor="dependencyTaskId" className="block text-sm font-medium text-gray-700 mb-1">
                Depends on Task (optional)
              </label>
              <select
                id="dependencyTaskId"
                value={formData.dependencyTaskId}
                onChange={(e) => setFormData({ ...formData, dependencyTaskId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                disabled={isSubmitting || !formData.description.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
