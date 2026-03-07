import { render, screen, within } from '@testing-library/react';
import { KanbanBoard } from '@/components/kanban-board';
import { DndContext } from '@dnd-kit/core';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock the server action
vi.mock('@/lib/actions', () => ({
  updateTaskStatus: vi.fn(),
}));

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all columns', async () => {
    const tasks: any[] = [
      { id: 1, description: 'Todo task', status: 'todo', priority: 3, filesInvolved: null },
      { id: 2, description: 'In progress task', status: 'in_progress', priority: 5, filesInvolved: null },
      { id: 3, description: 'Done task', status: 'done', priority: 1, filesInvolved: null },
      { id: 4, description: 'Blocked task', status: 'blocked', priority: 5, filesInvolved: null },
    ];

    render(
      <DndContext sensors={[]} onDragStart={() => { }} onDragEnd={() => { }}>
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
    render(<KanbanBoard tasks={[]} />);
    expect(await screen.findByText('To Do')).toBeInTheDocument();
    expect(await screen.findByText('In Progress')).toBeInTheDocument();
    expect(await screen.findByText('Done')).toBeInTheDocument();
  });

  test('groups tasks by status correctly', async () => {
    const tasks: any[] = [
      { id: 1, description: 'Todo 1', status: 'todo', priority: 3, filesInvolved: null },
      { id: 2, description: 'Todo 2', status: 'todo', priority: 5, filesInvolved: null },
      { id: 3, description: 'In Progress 1', status: 'in_progress', priority: 1, filesInvolved: null },
    ];

    render(<KanbanBoard tasks={tasks} />);

    const todoCount = (await screen.findAllByTestId('column-count'))[0];
    const inProgressCount = (await screen.findAllByTestId('column-count'))[1];

    expect(todoCount.textContent).toBe('2');
    expect(inProgressCount.textContent).toBe('1');
  });

  test('sorts tasks by priority within columns', async () => {
    const tasks: any[] = [
      { id: 1, description: 'Low priority', status: 'todo', priority: 1, filesInvolved: null },
      { id: 2, description: 'High priority', status: 'todo', priority: 10, filesInvolved: null },
    ];

    render(<KanbanBoard tasks={tasks} />);

    const todoColumn = await screen.findByTestId('column-todo');
    const todoContent = todoColumn.textContent || '';
    const highIndex = todoContent.indexOf('High priority');
    const lowIndex = todoContent.indexOf('Low priority');

    expect(highIndex).toBeLessThan(lowIndex);
  });
});