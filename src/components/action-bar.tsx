'use client';

import { useState } from 'react';
import { CreateTaskDialog } from './create-task-dialog';
import { PlanSelect, TaskSelect } from '@/db/schema';

interface ActionBarProps {
  projectId: number;
  plans: PlanSelect[];
  existingTasks: TaskSelect[];
  onTaskCreated?: (task: TaskSelect) => void;
}

export function ActionBar({ projectId, plans, existingTasks, onTaskCreated }: ActionBarProps) {
  const [showCreateTask, setShowCreateTask] = useState(false);

  return (
    <div className="mb-6 bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Project Actions</h2>
          <div className="flex gap-3">
            {/* Add Task Button */}
            <button
              onClick={() => setShowCreateTask(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
            >
              + Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Create Task Dialog */}
      {showCreateTask && (
        <CreateTaskDialog
          projectId={projectId}
          plans={plans}
          existingTasks={existingTasks}
          onTaskCreated={(task) => {
            setShowCreateTask(false);
            onTaskCreated?.(task);
          }}
        />
      )}
    </div>
  );
}
