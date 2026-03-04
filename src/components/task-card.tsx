"use client";

import { TaskSelect } from '@/db/schema';

interface TaskCardProps {
  task: TaskSelect;
  onClick?: (task: TaskSelect) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
  };

  const priorityColors = {
    1: 'border-l-gray-400',
    2: 'border-l-yellow-400',
    3: 'border-l-orange-400',
    4: 'border-l-red-400',
    5: 'border-l-red-600',
  };

  const priority = task.priority || 1;

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border-2
        p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow
        border-${priorityColors[priority]} border-l-4
      `}
      onClick={() => onClick && onClick(task)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 flex-1">
          {task.description || 'Untitled Task'}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>

      {task.filesInvolved && task.filesInvolved.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">Files:</p>
          <div className="flex flex-wrap gap-1">
            {task.filesInvolved.map((file, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {file}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Priority: {priority}</span>
        <span>ID: #{task.id}</span>
      </div>
    </div>
  );
}
