/**
 * Unit tests for AddLogDialog component
 * Tests rendering, state management, form validation, and submission
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddLogDialog } from '@/components/add-log-dialog';
import '@testing-library/jest-dom';

// Mock the server action
jest.mock('@/lib/actions', () => ({
  addAgentLogDev: jest.fn(),
}));

const mockAddAgentLogDev = require('@/lib/actions').addAgentLogDev;

const mockTasks = [
  { id: 1, description: 'Implement authentication middleware' },
  { id: 2, description: 'Setup database connection' },
  { id: 3, description: 'Write unit tests' },
];

describe('AddLogDialog - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddAgentLogDev.mockResolvedValue({ success: true });
  });

  describe('Rendering Modes', () => {
    test('renders trigger button when closed (uncontrolled mode)', () => {
      render(<AddLogDialog tasks={mockTasks} />);

      expect(screen.getByText('Add Log')).toBeInTheDocument();
      expect(screen.queryByText('Add Agent Log')).not.toBeInTheDocument();
    });

    test('shows dialog when isOpen=true (controlled mode)', () => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      expect(screen.getByText('Add Agent Log')).toBeInTheDocument();
      expect(screen.queryByText('Add Log')).not.toBeInTheDocument();
    });

    test('opens dialog when trigger button clicked (uncontrolled)', () => {
      render(<AddLogDialog tasks={mockTasks} />);

      fireEvent.click(screen.getByText('Add Log'));

      expect(screen.getByText('Add Agent Log')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    beforeEach(() => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);
    });

    test('displays task selection dropdown', () => {
      expect(screen.getByText('Task')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('shows all tasks in dropdown', () => {
      const select = screen.getByRole('combobox');
      fireEvent.click(select);

      expect(screen.getByText(/#1: Implement authentication/)).toBeInTheDocument();
      expect(screen.getByText(/#2: Setup database/)).toBeInTheDocument();
      expect(screen.getByText(/#3: Write unit tests/)).toBeInTheDocument();
    });

    test('displays level selection buttons', () => {
      expect(screen.getByText('Level')).toBeInTheDocument();
      expect(screen.getByText('DEBUG')).toBeInTheDocument();
      expect(screen.getByText('INFO')).toBeInTheDocument();
      expect(screen.getByText('WARN')).toBeInTheDocument();
      expect(screen.getByText('ERROR')).toBeInTheDocument();
    });

    test('has message textarea', () => {
      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Describe what happened...')).toBeInTheDocument();
    });

    test('has Cancel and Add Log buttons', () => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Add Log')).toBeInTheDocument();
    });
  });

  describe('Level Selection', () => {
    beforeEach(() => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);
    });

    test('selects info level by default', () => {
      const infoButton = screen.getByText('INFO');
      expect(infoButton).toHaveClass('bg-blue-50');
    });

    test('changes level when clicking level buttons', () => {
      const errorButton = screen.getByText('ERROR');
      fireEvent.click(errorButton);

      expect(errorButton).toHaveClass('bg-red-50');
      expect(screen.getByText('INFO')).not.toHaveClass('bg-blue-50');
    });

    test('shows visual feedback for selected level', () => {
      const debugButton = screen.getByText('DEBUG');
      fireEvent.click(debugButton);

      expect(debugButton).toHaveClass('bg-gray-100');
      expect(debugButton).toHaveClass('border-2');
    });
  });

  describe('Message Input', () => {
    beforeEach(() => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);
    });

    test('accepts text input in textarea', () => {
      const textarea = screen.getByPlaceholderText('Describe what happened...');
      fireEvent.change(textarea, { target: { value: 'Test log message' } });

      expect(textarea).toHaveValue('Test log message');
    });

    test('textarea is required', () => {
      const textarea = screen.getByPlaceholderText('Describe what happened...');
      expect(textarea).toHaveAttribute('required');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);
    });

    test('shows error when submitting with no task selected', async () => {
      // Set task to 0 (none selected)
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '0' } });

      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(screen.getByText('Please select a task')).toBeInTheDocument();
      });
    });

    test('shows error when message is empty', async () => {
      const textarea = screen.getByPlaceholderText('Describe what happened...');
      fireEvent.change(textarea, { target: { value: '' } });

      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(screen.getByText('Message is required')).toBeInTheDocument();
      });
    });

    test('shows error when message is only whitespace', async () => {
      const textarea = screen.getByPlaceholderText('Describe what happened...');
      fireEvent.change(textarea, { target: { value: '   \n  ' } });

      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(screen.getByText('Message is required')).toBeInTheDocument();
      });
    });

    test('shows error in error banner', async () => {
      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        const errorBox = document.querySelector('[style*="background-color: var(--ios-red)"]');
        expect(errorBox).toBeInTheDocument();
      });
    });

    test('clears error when correcting the error', async () => {
      // Trigger error first
      fireEvent.click(screen.getByText('Add Log'));
      await waitFor(() => {
        expect(screen.getByText('Please select a task')).toBeInTheDocument();
      });

      // Fix it by selecting a task
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Please select a task')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits with correct data', async () => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Select task
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '2' } });

      // Select level
      fireEvent.click(screen.getByText('WARN'));

      // Enter message
      const textarea = screen.getByPlaceholderText('Describe what happened...');
      fireEvent.change(textarea, { target: { value: 'This is a warning' } });

      // Submit
      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(mockAddAgentLogDev).toHaveBeenCalledWith({
          taskId: 2,
          level: 'warn',
          message: 'This is a warning',
        });
      });
    });

    test('resets form after successful submission', async () => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Fill form
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
      fireEvent.click(screen.getByText('ERROR'));
      fireEvent.change(screen.getByPlaceholderText('Describe what happened...'), {
        target: { value: 'Error occurred' },
      });

      // Submit
      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(mockAddAgentLogDev).toHaveBeenCalled();
      });

      // Form should reset
      const textarea = screen.getByPlaceholderText('Describe what happened...');
      expect(textarea).toHaveValue('');

      // Level should reset to info
      expect(screen.getByText('INFO')).toHaveClass('bg-blue-50');
    });

    test('shows loading state during submission', async () => {
      mockAddAgentLogDev.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Fill form
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
      fireEvent.change(screen.getByPlaceholderText('Describe what happened...'), {
        target: { value: 'Test message' },
      });

      // Submit
      fireEvent.click(screen.getByText('Add Log'));

      // Should show loading text
      expect(screen.getByText('Adding...')).toBeInTheDocument();

      // Button should be disabled
      expect(screen.getByText('Adding...')).toBeDisabled();

      await waitFor(() => {
        expect(mockAddAgentLogDev).toHaveBeenCalled();
      });
    });

    test('shows error when server action fails', async () => {
      mockAddAgentLogDev.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Fill form
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
      fireEvent.change(screen.getByPlaceholderText('Describe what happened...'), {
        target: { value: 'Test message' },
      });

      // Submit
      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(screen.getByText('Database error')).toBeInTheDocument();
      });
    });

    test('does not reset form on submission failure', async () => {
      mockAddAgentLogDev.mockResolvedValue({
        success: false,
        error: 'Server error',
      });

      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Fill form
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
      fireEvent.change(screen.getByPlaceholderText('Describe what happened...'), {
        target: { value: 'Test message' },
      });

      // Submit
      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });

      // Form should NOT reset
      const textarea = screen.getByPlaceholderText('Describe what happened...');
      expect(textarea).toHaveValue('Test message');
    });

    test('handles exception from server action', async () => {
      mockAddAgentLogDev.mockRejectedValue(new Error('Network error'));

      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Fill form
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
      fireEvent.change(screen.getByPlaceholderText('Describe what happened...'), {
        target: { value: 'Test message' },
      });

      // Submit
      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    test('calls onLogAdded after successful submission', async () => {
      const mockOnLogAdded = jest.fn();

      render(
        <AddLogDialog
          tasks={mockTasks}
          isOpen={true}
          onLogAdded={mockOnLogAdded}
        />
      );

      // Fill form
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
      fireEvent.change(screen.getByPlaceholderText('Describe what happened...'), {
        target: { value: 'Test message' },
      });

      // Submit
      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(mockOnLogAdded).toHaveBeenCalled();
      });
    });

    test('calls onClose after successful submission', async () => {
      const mockOnClose = jest.fn();

      render(
        <AddLogDialog
          tasks={mockTasks}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Fill form
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
      fireEvent.change(screen.getByPlaceholderText('Describe what happened...'), {
        target: { value: 'Test message' },
      });

      // Submit
      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('calls onClose when Cancel button clicked', () => {
      const mockOnClose = jest.fn();

      render(
        <AddLogDialog tasks={mockTasks} isOpen={true} onClose={mockOnClose} />
      );

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('calls onClose when backdrop clicked', () => {
      const mockOnClose = jest.fn();

      render(
        <AddLogDialog tasks={mockTasks} isOpen={true} onClose={mockOnClose} />
      );

      // Find backdrop and click it
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Cancel Behavior', () => {
    test('resets form when canceling', () => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Fill form
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
      fireEvent.click(screen.getByText('WARN'));
      fireEvent.change(screen.getByPlaceholderText('Describe what happened...'), {
        target: { value: 'Some message' },
      });

      // Cancel
      fireEvent.click(screen.getByText('Cancel'));

      // Re-open to check reset
      fireEvent.click(screen.getByText('Add Log'));

      const textarea = screen.getByPlaceholderText('Describe what happened...');
      expect(textarea).toHaveValue('');
      expect(screen.getByText('INFO')).toHaveClass('bg-blue-50');
    });

    test('clears error when canceling', async () => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Trigger error
      fireEvent.click(screen.getByText('Add Log'));
      await waitFor(() => {
        expect(screen.getByText('Please select a task')).toBeInTheDocument();
      });

      // Cancel
      fireEvent.click(screen.getByText('Cancel'));

      // Re-open
      fireEvent.click(screen.getByText('Add Log'));

      expect(screen.queryByText('Please select a task')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty tasks list', () => {
      render(<AddLogDialog tasks={[]} isOpen={true} />);

      // Should show dialog but with no tasks
      expect(screen.getByText('Add Agent Log')).toBeInTheDocument();
    });

    test('selects default task when defaultTaskId provided', () => {
      render(
        <AddLogDialog
          tasks={mockTasks}
          isOpen={true}
          defaultTaskId={2}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('2');
    });

    test('disables submit button when message empty', () => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Check initially disabled (no message entered)
      const submitButton = screen.getByText('Add Log').closest('button');
      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when message has content', () => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Fill message
      const textarea = screen.getByPlaceholderText('Describe what happened...');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      // Button should be enabled now
      expect(screen.getByText('Add Log')).not.toBeDisabled();
    });

    test('trims whitespace from message on submit', async () => {
      render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

      // Fill form with whitespace
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
      fireEvent.change(screen.getByPlaceholderText('Describe what happened...'), {
        target: { value: '  Test message  \n  ' },
      });

      // Submit
      fireEvent.click(screen.getByText('Add Log'));

      await waitFor(() => {
        expect(mockAddAgentLogDev).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Test message',
          })
        );
      });
    });
  });
});
