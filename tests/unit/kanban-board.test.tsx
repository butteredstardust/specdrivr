/**
 * Unit tests for KanbanBoard component
 * Comprehensive testing of drag-and-drop logic, state management, and task operations
 */

import { render, screen, waitFor } from '@testing-library/react';
import { KanbanBoard } from '@/components/kanban-board';
import { DndContext, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';

// Mock the server action
jest.mock('@/lib/actions', () => ({
  updateTaskStatus: jest.fn(),
}));

const mockUpdateTaskStatus = require('@/lib/actions').updateTaskStatus as jest.Mock;

// Helper to wrap component in DndContext for testing
const renderWithDnd = (component: React.ReactElement) => {
  return render(
    <DndContext sensors={[]} onDragStart={() => {}} onDragEnd={() => {}}>
      {component}
    </DndContext>
  );
};

describe('KanbanBoard - Core Functionality', () => {
  describe('Column Structure', () => {
    test('renders all four columns', async () => {
      const tasks = [
        { id: 1, description: 'Todo task', status: 'todo', priority: 'medium', filesInvolved: null },
        { id: 2, description: 'In progress task', status: 'in_progress', priority: 'high', filesInvolved: null },
        { id: 3, description: 'Done task', status: 'done', priority: 'low', filesInvolved: null },
        { id: 4, description: 'Blocked task', status: 'blocked', priority: 'high', filesInvolved: null },
      ];

      render(
        <DndContext sensors={[]} onDragStart={() => {}} onDragEnd={() => {}}>
          <KanbanBoard tasks={tasks} />
        </DndContext>
      );

      const columns = ['todo', 'in_progress', 'done', 'blocked'];
      for (const column of columns) {
        const columnElement = await screen.findByTestId(`column-${column}`);
        expect(columnElement).toBeInTheDocument();
      }
    });

    test('displays correct column headers', async () => {
      const tasks = [];
      render(<KanbanBoard tasks={tasks} />);

      expect(await screen.findByText('To Do')).toBeInTheDocument();
      expect(await screen.findByText('In Progress')).toBeInTheDocument();
      expect(await screen.findByText('Done')).toBeInTheDocument();
      expect(await screen.findByText('Blocked')).toBeInTheDocument();
    });
  });

  describe('Task Grouping', () => {
    test('groups tasks by status correctly', async () => {
      const tasks = [
        { id: 1, description: 'Todo 1', status: 'todo', priority: 'medium', filesInvolved: null },
        { id: 2, description: 'Todo 2', status: 'todo', priority: 'high', filesInvolved: null },
        { id: 3, description: 'In Progress 1', status: 'in_progress', priority: 'low', filesInvolved: null },
        { id: 4, description: 'Done 1', status: 'done', priority: 'medium', filesInvolved: null },
        { id: 5, description: 'Blocked 1', status: 'blocked', priority: 'high', filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      // Count tasks in each column
      const todoTaskCards = await screen.findAllByTestId(/^task-card-.*data-testid="todo".*$/);
      const inProgressTaskCards = await screen.findAllByTestId(/^task-card-.*data-testid="in_progress".*$/);
      const doneTaskCards = await screen.findAllByTestId(/^task-card-.*data-testid="done".*$/);
      const blockedTaskCards = await screen.findAllByTestId(/^task-card-.*data-testid="blocked".*$/);

      expect(todoTaskCards).toHaveLength(2);
      expect(inProgressTaskCards).toHaveLength(1);
      expect(doneTaskCards).toHaveLength(1);
      expect(blockedTaskCards).toHaveLength(1);
    });

    test('handles empty columns gracefully', async () => {
      const tasks = [
        { id: 1, description: 'Todo 1', status: 'todo', priority: 'medium', filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      // Todo column has 1 task
      const todoTasks = await screen.findAllByTestId(/^task-card-.*data-testid="todo".*$/);
      expect(todoTasks).toHaveLength(1);

      // Other columns have empty state
      expect(screen.queryByTestId('column-empty-in_progress')).toBeInTheDocument();
      expect(screen.queryByTestId('column-empty-done')).toBeInTheDocument();
      expect(screen.queryByTestId('column-empty-blocked')).toBeInTheDocument();
    });

    test('displays correct task counts in column headers', async () => {
      const tasks = [
        { id: 1, description: 'Todo 1', status: 'todo', priority: 'medium', filesInvolved: null },
        { id: 2, description: 'Todo 2', status: 'todo', priority: 'high', filesInvolved: null },
        { id: 3, description: 'Todo 3', status: 'todo', priority: 'low', filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      const todoCount = await screen.findByTestId('count-todo');
      expect(todoCount.textContent).toBe('3');
    });
  });

  describe('Priority Display', () => {
    test('displays priority with correct color indicators', async () => {
      const tasks = [
        { id: 1, description: 'High priority', status: 'todo', priority: 'high', filesInvolved: null },
        { id: 2, description: 'Medium priority', status: 'todo', priority: 'medium', filesInvolved: null },
        { id: 3, description: 'Low priority', status: 'todo', priority: 'low', filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      // Check priority indicators
      const highPriorities = await screen.findAllByTestId('priority-indicator-high');
      const mediumPriorities = await screen.findAllByTestId('priority-indicator-medium');
      const lowPriorities = await screen.findAllByTestId('priority-indicator-low');

      expect(highPriorities).toHaveLength(1);
      expect(mediumPriorities).toHaveLength(1);
      expect(lowPriorities).toHaveLength(1);
    });

    test('sorts tasks by priority within columns', async () => {
      const tasks = [
        { id: 1, description: 'Low priority', status: 'todo', priority: 'low', filesInvolved: null },
        { id: 2, description: 'High priority', status: 'todo', priority: 'high', filesInvolved: null },
        { id: 3, description: 'Medium priority', status: 'todo', priority: 'medium', filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      // High priority should come first
      const todoTasks = screen.getAllByTestId(/^task-description-priority-high.*/);
      expect(todoTasks[0].textContent).toBe('High priority');
      expect(todoTasks[1].textContent).toBe('Medium priority');
      expect(todoTasks[2].textContent).toBe('Low priority');
    });
  });

  describe('File Involvement Display', () => {
    test('displays file paths when present', async () => {
      const tasks = [
        {
          id: 1,
          description: 'Task with files',
          status: 'todo',
          priority: 'medium',
          filesInvolved: 'src/auth.ts, src/utils.ts',
        },
      ];

      render(<KanbanBoard tasks={tasks} />);

      const fileIndicator = await screen.findByTestId('task-files-1');
      expect(fileIndicator.textContent).toContain('src/auth.ts');
      expect(fileIndicator.textContent).toContain('src/utils.ts');
    });

    test('hides file section when no files involved', async () => {
      const tasks = [
        { id: 1, description: 'Task without files', status: 'todo', priority: 'medium', filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      expect(screen.queryByTestId('task-files-1')).not.toBeInTheDocument();
    });
  });

  describe('Drag Sensors', () => {
    test('registers pointer and keyboard sensors', async () => {
      // Mock useSensors to track calls
      const mockUseSensors = require('@dnd-kit/core').useSensors as jest.Mock;
      mockUseSensors.mockClear();

      const tasks = [];
      render(<KanbanBoard tasks={tasks} />);

      // Verify useSensors was called with sensors array
      expect(mockUseSensors).toHaveBeenCalled();
      const sensorArgs = mockUseSensors.mock.calls[0][0];
      expect(sensorArgs).toHaveLength(2); // PointerSensor and KeyboardSensor
    });

    test('activates drag with pointer', async () => {
      const tasks = [{ id: 1, description: 'Draggable task', status: 'todo', priority: 'medium', filesInvolved: null }];

      const { container } = render(<KanbanBoard tasks={tasks} />);

      const taskCard = container.querySelector('[data-testid="task-card-1"]');
      expect(taskCard).toBeTruthy();

      // Simulate pointer down (drag start)
      const pointerDownEvent = new MouseEvent('pointerdown', { bubbles: true });
      taskCard!.dispatchEvent(pointerDownEvent);
    });

    test('supports keyboard navigation in drag operations', async () => {
      const tasks = [{ id: 1, description: 'Draggable task', status: 'todo', priority: 'medium', filesInvolved: null }];

      const { container } = render(<KanbanBoard tasks={tasks} />);

      const taskCard = container.querySelector('[data-testid="task-card-1"]');
      expect(taskCard).toBeTruthy();

      // Simulate keyboard events
      const keyboardDownEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      taskCard!.dispatchEvent(keyboardDownEvent);
    });
  });

  describe('Drag Start Event', () => {
    test('sets active task on drag start', async () => {
      const tasks = [{ id: 1, description: 'Draggable task', status: 'todo', priority: 'medium', filesInvolved: null }];

      render(<KanbanBoard tasks={tasks} />);

      const taskCard = await screen.findByTestId('task-card-1');
      const taskElement = taskCard.closest('[data-testid="draggable-task"]');

      // Simulate drag start
      expect(taskElement).toHaveAttribute('data-id', '1');
      expect(taskElement).toHaveAttribute('data-status', 'todo');
    });

    test('disables drag operations when task is in progress', async () => {
      const tasks = [
        { id: 1, description: 'In progress task', status: 'in_progress', priority: 'medium', filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      const taskCard = await screen.findByTestId('task-card-1');
      expect(taskCard.closest('[data-testid="drag-disabled"]')).toBeInTheDocument();
    });
  });

  describe('Rich Interactions', () => {
    test('supports hover effects', async () => {
      const tasks = [{ id: 1, description: 'Task', status: 'todo', priority: 'medium', filesInvolved: null }];

      const { container } = render(<KanbanBoard tasks={tasks} />);

      const taskCard = container.querySelector('[data-testid="task-card-1"]');
      expect(taskCard).toBeTruthy();

      // Simulate hover
      await waitFor(() => {
        const hoverEvent = new MouseEvent('mouseenter', { bubbles: true });
        taskCard!.dispatchEvent(hoverEvent);
      });

      // Check for hover styles/classes
      const computedStyle = window.getComputedStyle(taskCard!);
      expect(computedStyle.cursor).toBe('grab');
    });

    test('displays task metadata (created date, ID)', async () => {
      const now = new Date();
      const tasks = [
        {
          id: 42,
          description: 'Task with metadata',
          status: 'todo',
          priority: 'medium',
          filesInvolved: null,
          createdAt: now.toISOString(),
        },
      ];

      render(<KanbanBoard tasks={tasks} />);

      const taskIdElement = await screen.findByTestId('task-id-42');
      expect(taskIdElement.textContent).toBe('#42');
    });
  });

  describe('Column Header Interactions', () => {
    test('displays column totals correctly', async () => {
      const tasks = [
        { id: 1, description: 'Todo 1', status: 'todo', priority: 'medium', filesInvolved: null },
        { id: 2, description: 'Todo 2', status: 'todo', priority: 'high', filesInvolved: null },
        { id: 3, description: 'In Progress 1', status: 'in_progress', priority: 'low', filesInvolved: null },
        { id: 4, description: 'Done 1', status: 'done', priority: 'medium', filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      const todoCount = await screen.findByTestId('count-todo');
      const inProgressCount = await screen.findByTestId('count-in_progress');
      const doneCount = await screen.findByTestId('count-done');

      expect(todoCount.textContent).toBe('2');
      expect(inProgressCount.textContent).toBe('1');
      expect(doneCount.textContent).toBe('1');
      expect(screen.queryByTestId('count-blocked')).toHaveTextContent('0');
    });

    test('updates counts dynamically after drag', async () => {
      const tasks = [
        { id: 1, description: 'Todo 1', status: 'todo', priority: 'medium', filesInvolved: null },
        { id: 2, description: 'Todo 2', status: 'todo', priority: 'high', filesInvolved: null },
      ];

      const { rerender } = render(<KanbanBoard tasks={tasks} />);

      const todoCountBefore = await screen.findByTestId('count-todo');
      expect(todoCountBefore.textContent).toBe('2');

      // Update tasks after drag
      const updatedTasks = [
        { id: 2, description: 'Todo 2', status: 'in_progress', priority: 'high', filesInvolved: null },
      ];

      rerender(<KanbanBoard tasks={updatedTasks} />);

      const todoCountAfter = await screen.findByTestId('count-todo');
      expect(totoCountAfter.textContent).toBe('1'); // 'todo' is still referenced
    });
  });

  describe('Responsive Behavior', () => {
    test('displays vertically on mobile (<768px)', async () => {
      // Mock mobile viewport
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      const tasks = [{ id: 1, description: 'Task', status: 'todo', priority: 'medium', filesInvolved: null }];

      render(<KanbanBoard tasks={tasks} />);

      await waitFor(() => {
        const kanbanWrapper = screen.getByTestId('kanban-wrapper');
        expect(kanbanWrapper).toHaveClass('flex-col');
      });
    });

    test('displays horizontally on desktop (>=768px)', async () => {
      window.innerWidth = 1024;
      window.dispatchEvent(new Event('resize'));

      const tasks = [{ id: 1, description: 'Task', status: 'todo', priority: 'medium', filesInvolved: null }];

      render(<KanbanBoard tasks={tasks} />);

      await waitFor(() => {
        const kanbanWrapper = screen.getByTestId('kanban-wrapper');
        expect(kanbanWrapper).toHaveClass('flex-row');
      });
    });
  });

  describe('Performance', () => {
    test('renders large number of tasks efficiently', async () => {
      const tasks = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        description: `Task number ${i + 1}`,
        status: ['todo', 'in_progress', 'done', 'blocked'][i % 4] as const,
        priority: ['low', 'medium', 'high'][i % 3] as const,
        filesInvolved: null,
      }));

      const startTime = performance.now();
      render(<KanbanBoard tasks={tasks} />);
      const endTime = performance.now();

      // Should render in under 100ms
      expect(endTime - startTime).toBeLessThan(100);

      // Should render correct number of tasks across columns
      const allTaskCards = await screen.findAllByTestId(/^task-card-\d+$/);
      expect(allTaskCards).toHaveLength(100);
    });

    test('memoizes renders for unchanged props', async () => {
      const mockRender = jest.fn();

      const TestKanban = ({ tasks }: { tasks: any[] }) => {
        mockRender();
        return <KanbanBoard tasks={tasks} />;
      };

      const tasks = [{ id: 1, description: 'Task', status: 'todo', priority: 'medium', filesInvolved: null }];

      const { rerender } = render(<TestKanban tasks={tasks} />);

      // Initial render
      expect(mockRender).toHaveBeenCalledTimes(1);

      // Rerender with same props
      rerender(<TestKanban tasks={tasks} />);

      // Should not re-render (memoized)
      expect(mockRender).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', async () => {
      const tasks = [{ id: 1, description: 'Task', status: 'todo', priority: 'medium', filesInvolved: null }];

      const { container } = render(<KanbanBoard tasks={tasks} />);

      const kanban = container.querySelector('[role="main"]');
      expect(kanban).toBeInTheDocument();

      const columns = container.querySelectorAll('[role="region"]');
      expect(columns).toHaveLength(4);
    });

    test('keyboard navigation support for drag operations', async () => {
      const tasks = [{ id: 1, description: 'Task', status: 'todo', priority: 'medium', filesInvolved: null }];

      render(<KanbanBoard tasks={tasks} />);

      const task = await screen.findByTestId('task-card-1');
      expect(task).toHaveAttribute('tabindex', '0');
    });
  });
});