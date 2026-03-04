"use client";

import { TaskSelect } from '@/db/schema';
import { TaskCard } from './task-card';
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

interface KanbanBoardProps {
  tasks: TaskSelect[];
  onTaskClick?: (task: TaskSelect) => void;
}

export function KanbanBoard({ tasks, onTaskClick }: KanbanBoardProps) {
  const [tasksState, setTasksState] = useState<TaskSelect[]>(tasks);
  const [activeTask, setActiveTask] = useState<TaskSelect | null>(null);

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
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
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
    const isOverColumn = columns.some((col) => col.id === over.id);
    if (isOverColumn && activeTask.status !== over.id) {
      // Update task in UI immediately for smooth UX
      setTasksState((prev) =>
        prev.map((task) =>
          task.id === active.id
            ? { ...task, status: over.id as TaskStatus }
            : task
        )
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasksState.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if over is a column
    const isOverColumn = columns.some((col) => col.id === over.id);

    if (isOverColumn && activeTask.status !== over.id) {
      const newStatus = over.id as TaskStatus;

      try {
        // Update in database via server action
        const result = await updateTaskStatus(active.id as number, newStatus);
        if (result.success) {
          // Ensure state matches database
          setTasksState((prev) =>
            prev.map((task) =>
              task.id === active.id
                ? { ...task, status: newStatus }
                : task
            )
          );
        } else {
          // Revert on error
          setTasksState(tasks);
          console.error('Failed to update task status:', result.error);
        }
      } catch (error) {
        // Revert on error
        setTasksState(tasks);
        console.error('Error updating task status:', error);
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
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => {
            const columnTasks = (groupedTasks[column.id] || []) as TaskSelect[];

            return (
              <div
                key={column.id}
                id={column.id}
                className={`rounded-lg p-4 min-h-96 ${column.bgColor}`}
              >
                <div
                  className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${column.borderColor}`}
                >
                  <h3 className="font-semibold text-lg text-gray-800">
                    {column.title}
                  </h3>
                  <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
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
                        onClick={onTaskClick}
                      />
                    ))}
                  </SortableContext>
                  {columnTasks.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <p className="text-sm">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
            <TaskCard task={activeTask} onClick={onTaskClick} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
