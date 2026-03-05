/**
 * Unit tests for TaskDetailModal component
 * Tests rendering, state management, and all interaction flows
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDetailModal } from '@/components/task-detail-modal';
import '@testing-library/jest-dom';
import { TaskSelect } from '@/db/schema';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

// Mock task data
const mockTask: TaskSelect & {
  testResults?: any[];
  agentLogs?: any[];
  dependencies?: TaskSelect[];
} = {
  id: 42,
  projectId: 1,
  description: 'Implement authentication middleware',
  priority: 3,
  status: 'in_progress',
  filesInvolved: ['src/auth.ts', 'src/middleware.ts'],
  dependencyTaskId: null,
  notes: 'Need to handle edge case with expired tokens',
  retryCount: 2,
  completedAt: null,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:30:00Z',
};

const mockTaskTodo: TaskSelect = {
  id: 43,
  projectId: 1,
  description: 'Setup database connection',
  priority: 2,
  status: 'todo',
  filesInvolved: null,
  dependencyTaskId: null,
  notes: null,
  retryCount: 0,
  completedAt: null,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
};

const mockTaskBlocked: TaskSelect = {
  id: 44,
  projectId: 1,
  description: 'Create API endpoint',
  priority: 5,
  status: 'blocked',
  filesInvolved: null,
  dependencyTaskId: null,
  notes: 'Blocked by API contract not final',
  retryCount: 3,
  completedAt: null,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
};

const mockTaskDone: TaskSelect = {
  id: 45,
  projectId: 1,
  description: 'Write unit tests',
  priority: 2,
  status: 'done',
  filesInvolved: ['tests/auth.test.ts'],
  dependencyTaskId: null,
  notes: 'All tests passing',
  retryCount: 0,
  completedAt: '2024-01-01T11:00:00Z',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T11:00:00Z',
};

const mockDependents: TaskSelect[] = [
  {
    id: 46,
    projectId: 1,
    description: 'Depends on task 42',
    priority: 2,
    status: 'todo',
    filesInvolved: null,
    dependencyTaskId: 42,
    notes: null,
    retryCount: 0,
    completedAt: null,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
];

describe('TaskDetailModal - Core Functionality', () => {
  describe('Rendering', () => {
    test('renders modal with task details', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.getByText(/Task #42/)).toBeInTheDocument();
      expect(screen.getByText('Implement authentication middleware')).toBeInTheDocument();
    });

    test('shows empty state when modal is closed', () => {
      const { container } = render(
        <TaskDetailModal
          isOpen={false}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      // Should render but not show content
      expect(container.textContent).toBe('');
    });

    test('shows no description text when description is empty', () => {
      const taskNoDescription = { ...mockTask, description: '' };

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={taskNoDescription}
        />
      );

      expect(screen.getByText('No description provided.')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    test('displays current status with correct styling for in_progress', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    });

    test('displays current status for todo', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskTodo}
        />
      );

      expect(screen.getByText('TODO')).toBeInTheDocument();
    });

    test('displays current status for blocked', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskBlocked}
        />
      );

      expect(screen.getByText('BLOCKED')).toBeInTheDocument();
    });

    test('displays current status for done', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskDone}
        />
      );

      expect(screen.getByText('DONE')).toBeInTheDocument();
    });

    test('shows retry count when retries exist', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.getByText('(Retried 2 times)')).toBeInTheDocument();
    });

    test('shows single retry time correctly', () => {
      const taskOneRetry = { ...mockTask, retryCount: 1 };

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={taskOneRetry}
        />
      );

      expect(screen.getByText('(Retried 1 time)')).toBeInTheDocument();
    });

    test('shows no retry indicator when no retries', () => {
      const taskNoRetry = { ...mockTask, retryCount: 0 };

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={taskNoRetry}
        />
      );

      expect(screen.queryByText(/Retried/)).not.toBeInTheDocument();
    });

    test('displays uptime for in_progress tasks', () => {
      const inProgressTask = {
        ...mockTask,
        status: 'in_progress',
        updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      };

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={inProgressTask}
        />
      );

      expect(screen.getByText(/In Progress For/)).toBeInTheDocument();

      // The uptime duration should show 59:00 or 60:00 format (mm:ss)
      const modalText = screen.getByText(/In Progress For/).closest('.space-y-6')?.textContent;
      expect(modalText).toMatch(/\d+:\d+/);
    });

    test('does not show uptime for non-in_progress tasks', () => {
      const todoTask = { ...mockTask, status: 'todo' };

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={todoTask}
        />
      );

      expect(screen.queryByText(/In Progress For/)).not.toBeInTheDocument();
    });
  });

  describe('Priority Display', () => {
    test('displays priority with 5-dot indicator', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.getByText('P3')).toBeInTheDocument();

      // Should have 5 dots
      const dots = document.querySelectorAll('div.w-3.h-3.rounded-full');
      expect(dots.length).toBeGreaterThanOrEqual(5);
    });

    test('shows correct number of filled dots for priority 5', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskBlocked}
        />
      );

      expect(screen.getByText('P5')).toBeInTheDocument();
    });

    test('shows correct number of filled dots for priority 1', () => {
      const lowPriorityTask = { ...mockTask, priority: 1 };

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={lowPriorityTask}
        />
      );

      expect(screen.getByText('P1')).toBeInTheDocument();
    });
  });

  describe('Files Involved Display', () => {
    test('displays all files involved', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.getByText('Files Involved')).toBeInTheDocument();
      expect(screen.getByText('src/auth.ts')).toBeInTheDocument();
      expect(screen.getByText('src/middleware.ts')).toBeInTheDocument();
    });

    test('hides files section when no files involved', () => {
      const taskNoFiles = { ...mockTask, filesInvolved: [] };

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={taskNoFiles}
        />
      );

      expect(screen.queryByText('Files Involved')).not.toBeInTheDocument();
    });
  });

  describe('Status Change Buttons', () => {
    const mockOnStatusChange = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('shows all status change buttons when onStatusChange provided', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByTestId('task-status-todo')).toBeInTheDocument();
      expect(screen.getByTestId('task-status-in_progress')).toBeInTheDocument();
      expect(screen.getByTestId('task-status-done')).toBeInTheDocument();
      expect(screen.getByTestId('task-status-blocked')).toBeInTheDocument();
    });

    test('marks active status button', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
          onStatusChange={mockOnStatusChange}
        />
      );

      const activeButton = screen.getByTestId('task-status-in_progress');
      expect(activeButton).toBeInTheDocument();
      expect(activeButton).toHaveTextContent('IN PROGRESS');
    });

    test('changes status when button clicked', async () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
          onStatusChange={mockOnStatusChange}
        />
      );

      const todoButton = screen.getByTestId('task-status-todo');
      fireEvent.click(todoButton);

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith(42, 'todo');
      });
    });

    test('shows loading state during status change', async () => {
      mockOnStatusChange.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
          onStatusChange={mockOnStatusChange}
        />
      );

      const todoButton = screen.getByTestId('task-status-todo');
      fireEvent.click(todoButton);

      // Button should be disabled during submission
      expect(todoButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalled();
      });
    });
  });

  describe('Dependencies Display', () => {
    test('shows dependencies when provided', () => {
      const taskWithDeps = { ...mockTask, dependencies: mockDependents };

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={taskWithDeps}
        />
      );

      expect(screen.getByText('Dependencies')).toBeInTheDocument();
      expect(screen.getByText(/#46/)).toBeInTheDocument();
      expect(screen.getByText(/Depends on task 42/)).toBeInTheDocument();
    });

    test('hides dependencies when none', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.queryByText('Dependencies')).not.toBeInTheDocument();
    });
  });

  describe('Verify Command', () => {
    test('displays verify command', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.getByText(/verify-task --id 42/)).toBeInTheDocument();
    });

    test('has copy button for verify command', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    test('copies command to clipboard when clicking Copy', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith('verify-task --id 42');
    });

    test('shows Copied text after copying', async () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      expect(screen.getByText('Copied')).toBeInTheDocument();

      // Should revert after 2 seconds
      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
      }, { timeout: 2100 });
    });
  });

  describe('Notes Display', () => {
    test('displays notes when provided', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Need to handle edge case with expired tokens')).toBeInTheDocument();
    });

    test('hides notes section when no notes', () => {
      const taskNoNotes = { ...mockTask, notes: null };

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={taskNoNotes}
        />
      );

      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });
  });

  describe('Test Results Display', () => {
    const taskWithTestResults = {
      ...mockTask,
      testResults: [
        {
          success: true,
          logs: 'All tests passed',
          timestamp: '2024-01-01T10:30:00Z',
        },
        {
          success: false,
          logs: 'Auth test failed',
          timestamp: '2024-01-01T10:25:00Z',
        },
      ],
    };

    test('displays test results when available', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={taskWithTestResults}
        />
      );

      expect(screen.getByText('Test Results')).toBeInTheDocument();
      expect(screen.getByText('Passed')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('All tests passed')).toBeInTheDocument();
      expect(screen.getByText('Auth test failed')).toBeInTheDocument();
    });

    test('hides test results when none', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.queryByText('Test Results')).not.toBeInTheDocument();
    });
  });

  describe('Agent Logs Display', () => {
    const taskWithAgentLogs = {
      ...mockTask,
      agentLogs: [
        {
          level: 'info',
          message: 'Starting task execution',
          timestamp: '2024-01-01T10:20:00Z',
        },
        {
          level: 'error',
          message: 'Network timeout occurred',
          timestamp: '2024-01-01T10:21:00Z',
        },
      ],
    };

    test('displays agent logs when available', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={taskWithAgentLogs}
        />
      );

      expect(screen.getByText('Agent Logs')).toBeInTheDocument();
      expect(screen.getByText('INFO')).toBeInTheDocument();
      expect(screen.getByText('ERROR')).toBeInTheDocument();
      expect(screen.getByText('Starting task execution')).toBeInTheDocument();
      expect(screen.getByText('Network timeout occurred')).toBeInTheDocument();
    });

    test('hides agent logs when none', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.queryByText('Agent Logs')).not.toBeInTheDocument();
    });
  });

  describe('Timestamps Display', () => {
    test('displays created and updated timestamps', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      // Find the specific timestamp section in the main content area, not footer
      const timestampSection = document.querySelector('.grid.grid-cols-2.gap-4');
      expect(timestampSection?.textContent).toMatch(/Created/);
      expect(timestampSection?.textContent).toMatch(/Updated/);
    });

    test('displays completed timestamp when available', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskDone}
        />
      );

      expect(screen.getByText(/Completed/)).toBeInTheDocument();
    });

    test('hides completed timestamp when not completed', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.queryByText(/Completed/)).not.toBeInTheDocument();
    });
  });

  describe('Dialog Footer', () => {
    test('displays created timestamp in footer', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      // Find footer and check for timestamp (format: Jan 1, 2024, 12:00 PM)
      const footer = document.querySelector('.flex.items-center.justify-between.flex-wrap');
      expect(footer?.textContent).toMatch(/Created Jan 1, 2024/);
      expect(footer?.textContent).toMatch(/12:00 PM/);
    });

    test('has Close button in footer', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
        />
      );

      expect(screen.getByTestId('task-close-button')).toBeInTheDocument();
      expect(screen.getByTestId('task-close-button')).toHaveTextContent('Close');
    });
  });

  describe('Retry Functionality', () => {
    const mockOnRetry = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('shows Retry button for blocked tasks with onRetry handler', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskBlocked}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    test('hides Retry button for non-blocked tasks', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    test('hides Retry button when onRetry not provided', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskBlocked}
        />
      );

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    test('shows confirmation dialog when Retry clicked', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskBlocked}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByTestId('task-retry-button');
      fireEvent.click(retryButton);

      expect(screen.getByText('Retry Task')).toBeInTheDocument();
      expect(screen.getByText(/reset the task status/)).toBeInTheDocument();
    });

    test('executes retry when confirmed', async () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskBlocked}
          onRetry={mockOnRetry}
        />
      );

      // Click retry button
      fireEvent.click(screen.getByTestId('task-retry-button'));

      // Confirm in dialog
      const confirmButton = screen.getByTestId('confirm-confirm-button');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnRetry).toHaveBeenCalledWith(44);
      });
    });

    test('closes modal after successful retry', async () => {
      const mockOnClose = jest.fn();

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={mockOnClose}
          task={mockTaskBlocked}
          onRetry={mockOnRetry}
        />
      );

      fireEvent.click(screen.getByTestId('task-retry-button'));
      fireEvent.click(screen.getByTestId('confirm-confirm-button'));

      await waitFor(() => {
        expect(mockOnRetry).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Skip Functionality', () => {
    const mockOnSkip = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('shows Skip button for todo tasks with onSkip handler', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskTodo}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    test('shows Skip button for blocked tasks with onSkip handler', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskBlocked}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    test('shows Skip button for in_progress tasks with onSkip handler', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTask}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    test('hides Skip button for done tasks', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskDone}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.queryByText('Skip')).not.toBeInTheDocument();
    });

    test('hides Skip button when onSkip not provided', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskTodo}
        />
      );

      expect(screen.queryByText('Skip')).not.toBeInTheDocument();
    });

    test('shows confirmation dialog when Skip clicked', () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskTodo}
          onSkip={mockOnSkip}
        />
      );

      fireEvent.click(screen.getByTestId('task-skip-button'));

      expect(screen.getByText('Skip Task')).toBeInTheDocument();
      expect(screen.getByText(/mark the task as done/)).toBeInTheDocument();
    });

    test('executes skip when confirmed', async () => {
      render(
        <TaskDetailModal
          isOpen={true}
          onClose={jest.fn()}
          task={mockTaskTodo}
          onSkip={mockOnSkip}
        />
      );

      fireEvent.click(screen.getByTestId('task-skip-button'));
      fireEvent.click(screen.getByTestId('confirm-confirm-button'));

      await waitFor(() => {
        expect(mockOnSkip).toHaveBeenCalledWith(43);
      });
    });
  });

  describe('Close Button', () => {
    test('calls onClose when Close button clicked', () => {
      const mockOnClose = jest.fn();

      render(
        <TaskDetailModal
          isOpen={true}
          onClose={mockOnClose}
          task={mockTask}
        />
      );

      fireEvent.click(screen.getByTestId('task-close-button'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
