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
import { cn } from '@/lib/utils';
import { taskStatusColors } from '@/lib/ios-styles';

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

  const validStatuses = ['todo', 'in_progress', 'done', 'blocked', 'paused', 'skipped'] as const;

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'paused', title: 'Paused' },
    { id: 'blocked', title: 'Blocked' },
    { id: 'done', title: 'Done' },
    { id: 'skipped', title: 'Skipped' },
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
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    },
    {} as Record<string, TaskSelect[]>
  );

  Object.keys(groupedTasks).forEach((status) => {
    groupedTasks[status].sort((a, b) => {
      const pA = typeof a.priority === 'string' ? parseInt(a.priority, 10) : a.priority;
      const pB = typeof b.priority === 'string' ? parseInt(b.priority, 10) : b.priority;
      if (pA !== pB) return pB - pA;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  });

  function handleDragStart(event: DragStartEvent) {
    const task = tasksState.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeTask = tasksState.find((t) => t.id === active.id);
    if (!activeTask) return;
    const newStatus = over.id as string;
    if (validStatuses.includes(newStatus as any) && activeTask.status !== over.id) {
      setTasksState((prev) =>
        prev.map((t) => t.id === active.id ? { ...t, status: newStatus as TaskSelect['status'] } : t)
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const activeTask = tasksState.find((t) => t.id === active.id);
    if (!activeTask) return;
    const newStatus = over.id as string;
    if (validStatuses.includes(newStatus as any) && activeTask.status !== over.id) {
      try {
        const taskId = typeof active.id === 'number' ? active.id : parseInt(active.id as string, 10);
        const result = await updateTaskStatus(taskId, newStatus);
        if (result.success) {
          router.refresh();
        } else {
          setTasksState(tasks);
        }
      } catch {
        setTasksState(tasks);
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
      <div className="flex gap-[var(--sp-4)] overflow-x-auto pb-[var(--sp-8)] linear-scrollbar min-h-[calc(100vh-280px)]">
        {columns.map((column) => {
          const columnTasks = (groupedTasks[column.id] || []) as TaskSelect[];

          return (
            <div
              key={column.id}
              id={column.id}
              className="flex flex-col w-[272px] shrink-0 bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--sp-3)]"
            >
              <div className="flex items-center justify-between mb-[var(--sp-4)] px-[var(--sp-1)]">
                <div className="flex items-center gap-[var(--sp-2)]">
                  <span className={cn(
                    "px-[6px] flex items-center h-[20px] rounded-[3px] text-[11px] font-bold uppercase tracking-[0.04em] whitespace-nowrap",
                    taskStatusColors[column.id as keyof typeof taskStatusColors]?.bg || "bg-[var(--status-todo-bg)]",
                    taskStatusColors[column.id as keyof typeof taskStatusColors]?.text || "text-[var(--status-todo-text)]"
                  )}>
                    {column.title}
                  </span>
                  <span className="bg-[var(--color-bg-sunken)] px-[var(--sp-2)] py-0.5 rounded-full text-[11px] font-bold text-[var(--color-text-secondary)] ml-1">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-[var(--sp-3)] min-h-[100px]">
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
                  <div className="flex-1 border-2 border-dashed border-[var(--color-border-default)] rounded-[var(--radius-sm)] flex items-center justify-center py-[var(--sp-8)]">
                    <p className="text-[11px] text-[var(--color-text-tertiary)] italic">No tasks yet</p>
                  </div>
                )}
              </div>

              {projectId && plans.length > 0 && (
                <div className="mt-[var(--sp-2)]">
                  <CreateTaskDialog
                    projectId={projectId}
                    plans={plans}
                    existingTasks={tasks}
                    prefilledStatus={column.id}
                    onTaskCreated={() => router.refresh()}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80 rotate-3 scale-105 shadow-2xl">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>

      {
        selectedTask && (
          <TaskDetailModal
            isOpen={true}
            onClose={() => setSelectedTask(null)}
            task={selectedTask}
            onStatusChange={async (taskId, status) => {
              const result = await updateTaskStatus(taskId, status);
              if (result.success) {
                setTasksState((prev) =>
                  prev.map((t) => t.id === taskId ? { ...t, status: status as TaskSelect['status'] } : t)
                );
                router.refresh();
              }
            }}
            onRetry={async (taskId) => {
              try {
                const response = await fetch(`/api/tasks/${taskId}/agent/retry`, { method: 'POST' });
                if (response.ok) router.refresh();
              } catch (error) { console.error('Failed to retry task:', error); }
            }}
            onSkip={async (taskId) => {
              try {
                const response = await fetch(`/api/tasks/${taskId}/agent/skip`, { method: 'POST' });
                if (response.ok) router.refresh();
              } catch (error) { console.error('Failed to skip task:', error); }
            }}
          />
        )
      }
    </DndContext>
  );
}

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
