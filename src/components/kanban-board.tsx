"use client";

import { TaskSelect, PlanSelect } from '@/db/schema';
import { TaskCard } from './task-card';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { updateTaskStatus } from '@/lib/actions';
import { CreateTaskDialog } from './create-task-dialog';
import { TaskDetailModal } from './task-detail-modal';

interface KanbanBoardProps {
  projectId?: number;
  plans?: PlanSelect[];
  tasks: TaskSelect[];
  onTaskClick?: (task: TaskSelect) => void;
}

export function KanbanBoard({ projectId, plans = [], tasks, onTaskClick }: KanbanBoardProps) {
  const [tasksState, setTasksState] = useState<TaskSelect[]>(tasks);
  const [activeTask, setActiveTask] = useState<TaskSelect | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskSelect | null>(null);
  const router = useRouter();

  // Type narrowing for valid status values
  const validStatuses = ['todo', 'in_progress', 'done', 'blocked', 'paused', 'skipped'] as const;

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
      id: 'paused',
      title: 'Paused',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
    },
    {
      id: 'blocked',
      title: 'Blocked',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
    },
    {
      id: 'done',
      title: 'Done',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
    },
    {
      id: 'skipped',
      title: 'Skipped',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const groupedTasks = tasksState.reduce(
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
    groupedTasks[status].sort((a: TaskSelect, b: TaskSelect) => {
      // Convert priority to number in case it's a string (type safety)
      const priorityA = typeof a.priority === 'string' ? parseInt(a.priority, 10) : a.priority;
      const priorityB = typeof b.priority === 'string' ? parseInt(b.priority, 10) : b.priority;

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  });

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = tasksState.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasksState.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if over is a column
    const column = columns.find((col) => col.id === over.id);
    if (column && activeTask.status !== over.id) {
      // Type assertion - we know over.id matches one of our valid statuses
      const newStatus = over.id as string;
      if (validStatuses.includes(newStatus as any)) {
        // Update task in UI immediately for smooth UX
        setTasksState((prev) =>
          prev.map((task) =>
            task.id === active.id
              ? { ...task, status: newStatus as TaskSelect['status'] }
              : task
          )
        );
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasksState.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if over is a column
    const column = columns.find((col) => col.id === over.id);

    if (column && activeTask.status !== over.id) {
      const newStatus = over.id as string;
      if (validStatuses.includes(newStatus as any)) {
        try {
          // Update in database via server action
          const taskId = typeof active.id === 'number' ? active.id : parseInt(active.id as string, 10);
          const result = await updateTaskStatus(taskId, newStatus);
          if (result.success) {
            // Ensure state matches database
            setTasksState((prev) =>
              prev.map((task) =>
                task.id === active.id
                  ? { ...task, status: newStatus as TaskSelect['status'] }
                  : task
              )
            );
            router.refresh();
          } else {
            // Revert on error
            setTasksState(tasks);
          }
        } catch (error) {
          // Revert on error
          setTasksState(tasks);
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full" role="main">
        <div data-testid="kanban-wrapper" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {columns.map((column) => {
            const columnTasks = (groupedTasks[column.id] || []) as TaskSelect[];

            return (
              <div
                key={column.id}
                id={column.id}
                role="column"
                data-testid={`column-${column.id}`}
                className={`rounded-lg p-4 min-h-96 ${column.bgColor}`}
              >
                <div
                  className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${column.borderColor}`}
                >
                  <h3 className="font-semibold text-lg text-gray-800">
                    {column.title}
                  </h3>
                  <span
                    data-testid={`count-${column.id}`}
                    className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600"
                  >
                    {columnTasks.length}
                  </span>
                </div>

                <div className="min-h-80">
                  <SortableContext
                    items={columnTasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnTasks.map((task: TaskSelect) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={(t) => {
                          setSelectedTask(t);
                          onTaskClick?.(t);
                        }}
                      />
                    ))}
                  </SortableContext>
                  {columnTasks.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <p className="text-sm">No tasks</p>
                    </div>
                  )}
                </div>

                {/* Create Task Button for this column */}
                {projectId && plans.length > 0 && (
                  <div className="mt-3">
                    <CreateTaskDialog
                      projectId={projectId}
                      plans={plans}
                      existingTasks={tasks}
                      prefilledStatus={column.id}
                      onTaskCreated={() => {
                        router.refresh();
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
            <TaskCard
              task={activeTask}
              onClick={(t) => {
                setSelectedTask(t);
                onTaskClick?.(t);
              }}
            />
          </div>
        ) : null}
      </DragOverlay>

      {selectedTask && (
        <TaskDetailModal
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          onStatusChange={async (taskId, status) => {
            const result = await updateTaskStatus(taskId, status);
            if (result.success) {
              setTasksState((prev) =>
                prev.map((t) =>
                  t.id === taskId ? { ...t, status: status as TaskSelect['status'] } : t
                )
              );
              router.refresh();
            }
          }}
          onRetry={async (taskId) => {
            try {
              const response = await fetch(`/api/tasks/${taskId}/agent/retry`, {
                method: 'POST',
              });
              if (response.ok) {
                router.refresh();
              }
            } catch (error) {
              console.error('Failed to retry task:', error);
            }
          }}
          onSkip={async (taskId) => {
            try {
              const response = await fetch(`/api/tasks/${taskId}/agent/skip`, {
                method: 'POST',
              });
              if (response.ok) {
                router.refresh();
              }
            } catch (error) {
              console.error('Failed to skip task:', error);
            }
          }}
        />
      )}
    </DndContext>
  );
}

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
