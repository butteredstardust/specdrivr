"use client";

import { TaskSelect } from '@/db/schema';
import { TaskCard } from './task-card';

interface KanbanBoardProps {
  tasks: TaskSelect[];
  onTaskClick?: (task: TaskSelect) => void;
}

export function KanbanBoard({ tasks, onTaskClick }: KanbanBoardProps) {
  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
    },
    {
      id: 'done',
      title: 'Done',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
    },
    {
      id: 'blocked',
      title: 'Blocked',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
    },
  ];

  const groupedTasks = tasks.reduce(
    (acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    },
    {} as Record<string, TaskSelect[]>
  );

  // Sort tasks within each column by priority (highest first) and created time
  Object.keys(groupedTasks).forEach((status) => {
    groupedTasks[status].sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  });

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`rounded-lg p-4 min-h-96 ${column.bgColor}`}
          >
            <div
              className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${column.borderColor}`}
            >
              <h3 className="font-semibold text-lg text-gray-800">
                {column.title}
              </h3>
              <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
                {(groupedTasks[column.id] || []).length}
              </span>
            </div>

            <div className="min-h-80">
              {(groupedTasks[column.id] || []).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={onTaskClick}
                />
              ))}
              {(!groupedTasks[column.id] ||
                groupedTasks[column.id].length === 0) && (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
