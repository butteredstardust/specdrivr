import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDetailModal } from '@/components/features/kanban/task-detail-modal';
import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

const mockTask: any = {
  id: 42,
  projectId: 1,
  description: 'Implement authentication middleware',
  priority: 3,
  status: 'in_progress',
  filesInvolved: ['src/auth.ts'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('TaskDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal with task details', () => {
    render(<TaskDetailModal isOpen={true} onClose={vi.fn()} task={mockTask} />);
    expect(screen.getByText("Implement authentication middleware")).toBeInTheDocument();
    expect(screen.getByText('Implement authentication middleware')).toBeInTheDocument();
  });

  test('displays current status correctly', () => {
    render(<TaskDetailModal isOpen={true} onClose={vi.fn()} task={mockTask} />);
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });

  test('copies verify command to clipboard', async () => {
    render(<TaskDetailModal isOpen={true} onClose={vi.fn()} task={mockTask} />);
    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);
    expect(mockClipboard.writeText).toHaveBeenCalledWith('verify-task --id 42');
  });

  test('triggers status change callback', async () => {
    const mockOnStatusChange = vi.fn().mockResolvedValue({ success: true });
    render(
      <TaskDetailModal
        isOpen={true}
        onClose={vi.fn()}
        task={mockTask}
        onStatusChange={mockOnStatusChange}
      />
    );

    const todoButton = screen.getByTestId('status-option-todo');
    fireEvent.click(todoButton);

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(42, 'todo');
    });
  });
});
