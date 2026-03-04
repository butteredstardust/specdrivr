"use client";

import { TaskSelect } from '@/db/schema';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { LogTestResultDialog } from './log-test-result-dialog';

interface TaskCardProps {
  task: TaskSelect;
  onClick?: (task: TaskSelect) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const [showLogDialog, setShowLogDialog] = useState(false);

  const statusColors = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
  };

  const priorityColors: Record<number, string> = {
    1: 'border-gray-300',
    2: 'border-yellow-400',
    3: 'border-orange-400',
    4: 'border-red-400',
    5: 'border-red-600',
  };

  const priority = Math.max(1, Math.min(5, (task.priority as number) || 1));
  const status = (task.status as string) || 'todo';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  const handleLogResultClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLogDialog(true);
  };

  const handleCardClick = () => {
    onClick && onClick(task);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`
          bg-white rounded-lg shadow-sm border-2
          p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow
          border-l-4 ${priorityColors[priority]}
        `}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 flex-1 pr-2 text-sm">
            {task.description || 'Untitled Task'}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]} flex-shrink-0`}>
            {status.replace('_', ' ')}
          </span>
        </div>

        {(Array.isArray(task.filesInvolved) && task.filesInvolved.length > 0) ? (
          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-1">Files:</p>
            <div className="flex flex-wrap gap-1">
              {task.filesInvolved.map((file: string, idx: number) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 flex items-center gap-3">
            <span>P{priority}</span>
            <span>#{task.id}</span>
          </div>
          <button
            onClick={handleLogResultClick}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            title="Log Test Result"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Log Test
          </button>
        </div>
      </div>

      {showLogDialog && (
        <LogTestResultDialog
          task={task}
          isOpen={true}
          onClose={() => setShowLogDialog(false)}
          onResultLogged={() => setShowLogDialog(false)}
        />
      )}
    </>
  );
}
