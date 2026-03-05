'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateTaskDialog } from './create-task-dialog';
import { PlanSelect, TaskSelect } from '@/db/schema';
import { Button } from './ui/button';
import { Plus, Filter, Search } from 'lucide-react';

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
    <div className="flex items-center justify-between mb-[var(--sp-6)]">
      <div className="flex items-center gap-[var(--sp-2)]">
        <div className="relative">
          <Search size={14} className="absolute left-[var(--sp-2)] top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="h-[32px] pl-[32px] pr-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--color-border-selected)] transition-colors w-[200px]"
          />
        </div>
        <Button variant="secondary" size="small" icon={<Filter size={14} />}>
          Filter
        </Button>
      </div>

      <Button
        variant="primary"
        onClick={() => setShowCreateTask(true)}
        icon={<Plus size={16} />}
      >
        Create Task
      </Button>

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
