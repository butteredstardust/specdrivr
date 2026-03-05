'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateTaskDialog } from './create-task-dialog';
import { PlanSelect, TaskSelect } from '@/db/schema';

interface ActionBarProps {
  projectId: number;
  plans: PlanSelect[];
  existingTasks: TaskSelect[];
  onTaskCreated?: (task: TaskSelect) => void;
}

export function ActionBar({ projectId, plans, existingTasks, onTaskCreated }: ActionBarProps) {
  const router = useRouter();
  const [showCreateTask, setShowCreateTask] = useState(false);

  return (
    <div className="mb-6 bg-bg-elevated border border-border-default rounded-[8px] shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between ios-font">
          <h2 className="text-[16px] font-semibold text-ios-primary ">
            Project Actions
          </h2>
          <button
            onClick={() => setShowCreateTask(true)}
            className="px-4 py-2 text-[13px] text-white rounded-[8px] transition-colors flex items-center gap-1.5 "
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <span className="text-[20px] font-semibold">+</span>
            <span>Add Task</span>
          </button>
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
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
