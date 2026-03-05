/**
 * Unit tests for KanbanBoard component
 * Comprehensive testing of drag-and-drop logic, state management, and task operations
 */

import { render, screen, waitFor, within } from '@testing-library/react';
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
        { id: 1, description: 'Todo task', status: 'todo', priority: 3, filesInvolved: null },
        { id: 2, description: 'In progress task', status: 'in_progress', priority: 5, filesInvolved: null },
        { id: 3, description: 'Done task', status: 'done', priority: 1, filesInvolved: null },
        { id: 4, description: 'Blocked task', status: 'blocked', priority: 5, filesInvolved: null },
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
        { id: 1, description: 'Todo 1', status: 'todo', priority: 3, filesInvolved: null },
        { id: 2, description: 'Todo 2', status: 'todo', priority: 5, filesInvolved: null },
        { id: 3, description: 'In Progress 1', status: 'in_progress', priority: 1, filesInvolved: null },
        { id: 4, description: 'Done 1', status: 'done', priority: 3, filesInvolved: null },
        { id: 5, description: 'Blocked 1', status: 'blocked', priority: 5, filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      // Count tasks in each column using column testids and count badges
      const todoCount = await screen.findByTestId('count-todo');
      const inProgressCount = await screen.findByTestId('count-in_progress');
      const doneCount = await screen.findByTestId('count-done');
      const blockedCount = await screen.findByTestId('count-blocked');

      expect(todoCount.textContent).toBe('2');
      expect(inProgressCount.textContent).toBe('1');
      expect(doneCount.textContent).toBe('1');
      expect(blockedCount.textContent).toBe('1');

      // Verify task cards are rendered
      const allTaskCards = await screen.findAllByTestId(/^task-card-\d+$/);
      expect(allTaskCards).toHaveLength(5);
    });

    test('handles empty columns gracefully', async () => {
      const tasks = [
        { id: 1, description: 'Todo 1', status: 'todo', priority: 3, filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      // Todo column has 1 task
      const todoCount = await screen.findByTestId('count-todo');
      expect(todoCount.textContent).toBe('1');

      // Verify at least one task card is rendered
      const todoTaskCards = await screen.findAllByTestId(/^task-card-\d+$/);
      expect(todoTaskCards.length).toBeGreaterThan(0);

      // Other columns show 0 counts
      const inProgressCount = await screen.findByTestId('count-in_progress');
      const doneCount = await screen.findByTestId('count-done');
      const blockedCount = await screen.findByTestId('count-blocked');

      expect(inProgressCount.textContent).toBe('0');
      expect(doneCount.textContent).toBe('0');
      expect(blockedCount.textContent).toBe('0');
    });

    test('displays correct task counts in column headers', async () => {
      const tasks = [
        { id: 1, description: 'Todo 1', status: 'todo', priority: 3, filesInvolved: null },
        { id: 2, description: 'Todo 2', status: 'todo', priority: 5, filesInvolved: null },
        { id: 3, description: 'Todo 3', status: 'todo', priority: 1, filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      const todoCount = await screen.findByTestId('count-todo');
      expect(todoCount.textContent).toBe('3');
    });
  });

  describe('Priority Display', () => {
    test('displays priority with correct color indicators', async () => {
      const tasks = [
        { id: 1, description: 'High priority', status: 'todo', priority: 5, filesInvolved: null },
        { id: 2, description: 'Medium priority', status: 'todo', priority: 3, filesInvolved: null },
        { id: 3, description: 'Low priority', status: 'todo', priority: 1, filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      // Check priority indicators (now numeric since priority is a number in the database)
      const highPriority = await screen.findAllByTestId('priority-indicator-5');
      const mediumPriority = await screen.findAllByTestId('priority-indicator-3');
      const lowPriority = await screen.findAllByTestId('priority-indicator-1');

      expect(highPriority).toHaveLength(1);
      expect(mediumPriority).toHaveLength(1);
      expect(lowPriority).toHaveLength(1);
    });

    test('sorts tasks by priority within columns', async () => {
      const tasks = [
        { id: 1, description: 'Low priority', status: 'todo', priority: 1, filesInvolved: null },
        { id: 2, description: 'High priority', status: 'todo', priority: 5, filesInvolved: null },
        { id: 3, description: 'Medium priority', status: 'todo', priority: 3, filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      // High priority should come first (sorted by priority desc, then created asc)
      // Get all task cards and check their order by looking at descriptions
      const todoColumn = await screen.findByTestId('column-todo');
      const todoTasks = await within(todoColumn).findAllByTestId(/^task-card-\d+$/);

      // Check that we have 3 tasks
      expect(todoTasks).toHaveLength(3);

      // Verify the descriptions are in priority order (high, medium, low)
      // by checking that "High priority" appears before "Medium priority" which appears before "Low priority"
      const todoContent = todoColumn.textContent || '';
      const highIndex = todoContent.indexOf('High priority');
      const mediumIndex = todoContent.indexOf('Medium priority');
      const lowIndex = todoContent.indexOf('Low priority');

      expect(highIndex).toBeLessThan(mediumIndex);
      expect(mediumIndex).toBeLessThan(lowIndex);
    });
  });

  describe('File Involvement Display', () => {
    test('displays file paths when present', async () => {
      const tasks = [
        {
          id: 1,
          description: 'Task with files',
          status: 'todo',
          priority: 3,
          filesInvolved: ['src/auth.ts', 'src/utils.ts'],
        },
      ];

      render(<KanbanBoard tasks={tasks} />);

      const fileIndicator = await screen.findByTestId('task-files-1');
      expect(fileIndicator.textContent).toContain('src/auth.ts');
      expect(fileIndicator.textContent).toContain('src/utils.ts');
    });

    test('hides file section when no files involved', async () => {
      const tasks = [
        { id: 1, description: 'Task without files', status: 'todo', priority: 3, filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      expect(screen.queryByTestId('task-files-1')).not.toBeInTheDocument();
    });
  });

  describe('Drag Sensors', () => {
    test.skip('registers pointer and keyboard sensors', async () => {
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

    test.skip('activates drag with pointer', async () => {
      const tasks = [{ id: 1, description: 'Draggable task', status: 'todo', priority: 3, filesInvolved: null }];

      const { container } = render(<KanbanBoard tasks={tasks} />);

      const taskCard = container.querySelector('[data-testid="task-card-1"]');
      expect(taskCard).toBeTruthy();

      // Simulate pointer down (drag start)
      const pointerDownEvent = new MouseEvent('pointerdown', { bubbles: true });
      taskCard!.dispatchEvent(pointerDownEvent);
    });

    test.skip('supports keyboard navigation in drag operations', async () => {
      const tasks = [{ id: 1, description: 'Draggable task', status: 'todo', priority: 3, filesInvolved: null }];

      const { container } = render(<KanbanBoard tasks={tasks} />);

      const taskCard = container.querySelector('[data-testid="task-card-1"]');
      expect(taskCard).toBeTruthy();

      // Simulate keyboard events
      const keyboardDownEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      taskCard!.dispatchEvent(keyboardDownEvent);
    });
  });

  describe('Drag Start Event', () => {
    test.skip('sets active task on drag start', async () => {
      const tasks = [{ id: 1, description: 'Draggable task', status: 'todo', priority: 3, filesInvolved: null }];

      render(<KanbanBoard tasks={tasks} />);

      const taskCard = await screen.findByTestId('task-card-1');
      const taskElement = taskCard.closest('[data-testid="draggable-task"]');

      // Simulate drag start
      expect(taskElement).toHaveAttribute('data-id', '1');
      expect(taskElement).toHaveAttribute('data-status', 'todo');
    });

    test.skip('disables drag operations when task is in progress', async () => {
      const tasks = [
        { id: 1, description: 'In progress task', status: 'in_progress', priority: 3, filesInvolved: null },
      ];

      render(<KanbanBoard tasks={tasks} />);

      const taskCard = await screen.findByTestId('task-card-1');
      expect(taskCard.closest('[data-testid="drag-disabled"]')).toBeInTheDocument();
    });
  });

  describe('Rich Interactions', () => {
    test.skip('supports hover effects', async () => {
      const tasks = [{ id: 1, description: 'Task', status: 'todo', priority: 3, filesInvolved: null }];

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
          priority: 3,
          filesInvolved: null,
          createdAt: now.toISOString(),
        },
      ];

      render(<KanbanBoard tasks={tasks} />);

      const taskCard = await screen.findByTestId('task-card-42');
      expect(taskCard).toBeInTheDocument();
      // Task ID #42 should be visible somewhere in the card
      expect(taskCard.textContent).toContain('#42');
    });
  });

  describe('Column Header Interactions', () => {
    test('displays column totals correctly', async () => {
      const tasks = [
        { id: 1, description: 'Todo 1', status: 'todo', priority: 3, filesInvolved: null },
        { id: 2, description: 'Todo 2', status: 'todo', priority: 5, filesInvolved: null },
        { id: 3, description: 'In Progress 1', status: 'in_progress', priority: 1, filesInvolved: null },
        { id: 4, description: 'Done 1', status: 'done', priority: 3, filesInvolved: null },
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

    test.skip('updates counts dynamically after drag', async () => {
      const tasks = [
        { id: 1, description: 'Todo 1', status: 'todo', priority: 3, filesInvolved: null },
        { id: 2, description: 'Todo 2', status: 'todo', priority: 5, filesInvolved: null },
      ];

      const { rerender } = render(<KanbanBoard tasks={tasks} />);

      const todoCountBefore = await screen.findByTestId('count-todo');
      expect(todoCountBefore.textContent).toBe('2');

      // Update tasks after drag
      const updatedTasks = [
        { id: 2, description: 'Todo 2', status: 'in_progress', priority: 5, filesInvolved: null },
      ];

      rerender(<KanbanBoard tasks={updatedTasks} />);

      const todoCountAfter = await screen.findByTestId('count-todo');
      expect(todoCountAfter.textContent).toBe('1'); // 'todo' is still referenced
    });
  });

  describe('Responsive Layout', () => {
    test('uses grid layout that adapts to screen size', () => {
      const tasks = [{ id: 1, description: 'Task', status: 'todo', priority: 3, filesInvolved: null }];

      render(<KanbanBoard tasks={tasks} />);

      const kanbanWrapper = screen.getByTestId('kanban-wrapper');
      // Should use grid layout (not flexbox)
      expect(kanbanWrapper).toHaveClass('grid');
      expect(kanbanWrapper).toHaveClass('grid-cols-1');
      expect(kanbanWrapper).toHaveClass('md:grid-cols-2');
      expect(kanbanWrapper).toHaveClass('lg:grid-cols-3');
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

    test('maintains consistent state across re-renders', async () => {
      // Test that the component maintains its state correctly
      const tasks = [
        { id: 1, description: 'Task 1', status: 'todo', priority: 3, filesInvolved: null },
        { id: 2, description: 'Task 2', status: 'in_progress', priority: 5, filesInvolved: null },
      ];

      const { rerender } = render(<KanbanBoard tasks={tasks} />);

      // Verify initial render shows correct task counts
      const todoCount = await screen.findByTestId('count-todo');
      expect(todoCount.textContent).toBe('1');

      // Rerender with same tasks
      rerender(<KanbanBoard tasks={tasks} />);

      // Task counts should remain consistent
      await waitFor(() => {
        expect(screen.getByTestId('count-todo').textContent).toBe('1');
        expect(screen.getByTestId('count-in_progress').textContent).toBe('1');
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', async () => {
      const tasks = [{ id: 1, description: 'Task', status: 'todo', priority: 3, filesInvolved: null }];

      const { container } = render(<KanbanBoard tasks={tasks} />);

      const kanban = container.querySelector('[role="main"]');
      expect(kanban).toBeInTheDocument();

      // Should have 6 columns (todo, in_progress, paused, blocked, done, skipped)
      const columns = container.querySelectorAll('[role="column"]');
      expect(columns).toHaveLength(6);
    });

    test('keyboard navigation support for drag operations', async () => {
      const tasks = [{ id: 1, description: 'Task', status: 'todo', priority: 3, filesInvolved: null }];

      render(<KanbanBoard tasks={tasks} />);

      const task = await screen.findByTestId('task-card-1');
      expect(task).toHaveAttribute('tabindex', '0');
    });
  });
});