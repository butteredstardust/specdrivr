"use client";

import { TaskSelect } from '@/db/schema';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { LogTestResultDialog } from './log-test-result-dialog';
import { taskStatusColors, taskPriorityBorderColors } from '@/lib/ios-styles';

interface TaskCardProps {
  task: TaskSelect;
  onClick?: (task: TaskSelect) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const [showLogDialog, setShowLogDialog] = useState(false);

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
    onClick?.(task);
  };

  const statusInfo = taskStatusColors[status as keyof typeof taskStatusColors] || taskStatusColors.todo;
  const priorityBorder = taskPriorityBorderColors[priority];

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`ios-card p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${priorityBorder}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        data-testid={`task-card-${task.id}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="ios-body text-ios-text-primary ios-font-text flex-1 pr-2">
            {task.description || 'Untitled Task'}
          </h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} border flex-shrink-0`}>
            {status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {Array.isArray(task.filesInvolved) && task.filesInvolved.length > 0 && (
          <div className="mb-2">
            <p className="ios-caption-1 text-ios-text-secondary mb-1">Files:</p>
            <div className="flex flex-wrap gap-1">
              {task.filesInvolved.map((file: string, idx: number) => (
                <span
                  key={idx}
                  className="ios-caption-1 bg-ios-secondary border border-ios-border px-2 py-1 rounded text-ios-text-primary"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-ios-border">
          <div className="ios-caption-1 text-ios-text-secondary flex items-center gap-3">
            <span>P{priority}</span>
            <span>#{task.id}</span>
          </div>
          <button
            onClick={handleLogResultClick}
            className="flex items-center gap-1 ios-caption-1 text-ios-blue hover:text-ios-blue-dark transition-colors"
            title="Log Test Result"
            type="button"
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
