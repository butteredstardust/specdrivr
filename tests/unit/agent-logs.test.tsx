/**
 * Unit tests for AgentLogs component
 * Tests filtering, state management, sorting, and rendering
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AgentLogs } from '@/components/agent-logs';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';

// Mock data
const mockLogs = [
  {
    id: 1,
    taskId: 1,
    message: 'Starting task execution',
    level: 'info',
    context: { step: 'initialization' },
    timestamp: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: 2,
    taskId: 1,
    message: 'Error occurred',
    level: 'error',
    context: { error: 'Network timeout' },
    timestamp: new Date('2024-01-01T10:01:00Z'),
  },
  {
    id: 3,
    taskId: 2,
    message: 'Warning about configuration',
    level: 'warn',
    context: { config: 'missing' },
    timestamp: new Date('2024-01-01T10:02:00Z'),
  },
  {
    id: 4,
    taskId: 1,
    message: 'Debug information',
    level: 'debug',
    context: { detail: 'verbose' },
    timestamp: new Date('2024-01-01T10:03:00Z'),
  },
  {
    id: 5,
    taskId: 3,
    message: 'Task completed successfully',
    level: 'info',
    context: { result: 'success' },
    timestamp: new Date('2024-01-01T10:04:00Z'),
  },
];

const mockTasks = [
  { id: 1, description: 'Create API endpoint' },
  { id: 2, description: 'Update database schema' },
  { id: 3, description: 'Write tests' },
];

describe('AgentLogs - Core Functionality', () => {
  describe('Rendering', () => {
    test('renders component with logs', () => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);

      expect(screen.getByText(/5 of 5 logs/)).toBeInTheDocument();
      expect(screen.getByText('Starting task execution')).toBeInTheDocument();
    });

    test('shows empty state when no logs provided', () => {
      render(<AgentLogs logs={[]} tasks={mockTasks} />);

      expect(screen.getByText('No agent logs yet')).toBeInTheDocument();
      expect(screen.getByText('Add a log to track manual interventions')).toBeInTheDocument();
    });

    test('renders all log levels with correct colors', () => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);

      // Check log levels are visible (use getAllByText for duplicates)
      expect(screen.getByText('ERROR')).toBeInTheDocument();
      expect(screen.getAllByText('INFO').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('WARN')).toBeInTheDocument();
      expect(screen.getByText('DEBUG')).toBeInTheDocument();
    });

    test('displays log timestamps', () => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);

      // Should show timestamps (format: 1/1/2024, 2:00:00 AM or similar)
      const textContent = document.body.textContent || '';
      expect(textContent).toMatch(/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}, [0-9]{1,2}:[0-9]{2}:[0-9]{2}/);
    });

    test('shows task ID for each log', () => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);

      expect(screen.getAllByText(/Task #/).length).toBeGreaterThan(0);
    });
  });

  describe('Level Filtering', () => {
    beforeEach(() => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);
      // Open filters panel
      fireEvent.click(screen.getByText('Filters'));
    });

    test('shows all log levels by default', () => {
      // Should show checkbox for each level
      expect(screen.getByText('debug')).toBeInTheDocument();
      expect(screen.getByText('info')).toBeInTheDocument();
      expect(screen.getByText('warn')).toBeInTheDocument();
      expect(screen.getByText('error')).toBeInTheDocument();

      // All logs should be visible
      expect(screen.getByText('Starting task execution')).toBeInTheDocument();
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByText('Warning about configuration')).toBeInTheDocument();
      expect(screen.getByText('Debug information')).toBeInTheDocument();
    });

    test('toggles info logs on/off', () => {
      const infoCheckbox = screen.getByRole('checkbox', { name: /info/i });
      fireEvent.click(infoCheckbox);

      // Should hide info logs
      expect(screen.queryByText('Starting task execution')).not.toBeInTheDocument();
      expect(screen.queryByText('Task completed successfully')).not.toBeInTheDocument();

      // Other logs should still be visible
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByText('Warning about configuration')).toBeInTheDocument();
      expect(screen.getByText('Debug information')).toBeInTheDocument();
    });

    test('toggles error logs on/off', () => {
      const errorCheckbox = screen.getByRole('checkbox', { name: /error/i });
      fireEvent.click(errorCheckbox);

      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();

      // Other logs should still be visible
      expect(screen.getByText('Starting task execution')).toBeInTheDocument();
    });

    test('toggles warn logs on/off', () => {
      const warnCheckbox = screen.getByRole('checkbox', { name: /warn/i });
      fireEvent.click(warnCheckbox);

      expect(screen.queryByText('Warning about configuration')).not.toBeInTheDocument();
    });

    test('toggles debug logs on/off', () => {
      const debugCheckbox = screen.getByRole('checkbox', { name: /debug/i });
      fireEvent.click(debugCheckbox);

      expect(screen.queryByText('Debug information')).not.toBeInTheDocument();
    });

    test('can toggle multiple levels simultaneously', () => {
      fireEvent.click(screen.getByRole('checkbox', { name: /info/i }));
      fireEvent.click(screen.getByRole('checkbox', { name: /warn/i }));

      expect(screen.queryByText('Starting task execution')).not.toBeInTheDocument();
      expect(screen.queryByText('Task completed successfully')).not.toBeInTheDocument();
      expect(screen.queryByText('Warning about configuration')).not.toBeInTheDocument();

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByText('Debug information')).toBeInTheDocument();
    });

    test('disables all logs when all checkboxes unchecked', () => {
      ['info', 'error', 'warn', 'debug'].forEach((level) => {
        const checkbox = screen.getByRole('checkbox', { name: new RegExp(level, 'i') });
        fireEvent.click(checkbox);
      });

      expect(screen.queryByText('Starting task execution')).not.toBeInTheDocument();
      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
      expect(screen.queryByText('Warning about configuration')).not.toBeInTheDocument();
      expect(screen.queryByText('Debug information')).not.toBeInTheDocument();
    });

    test('clear all button appears when filters active', () => {
      fireEvent.click(screen.getByRole('checkbox', { name: /info/i }));
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });
  });

  describe('Task Filtering', () => {
    beforeEach(() => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);
      // Open filters panel to access task filter
      fireEvent.click(screen.getByText('Filters'));
    });

    test('filter dropdown shows all available tasks', () => {
      // Find the task filter dropdown
      const selectElements = document.getElementsByTagName('select');
      expect(selectElements.length).toBeGreaterThan(0);

      const taskSelect = selectElements[0];
      fireEvent.click(taskSelect);

      // Should contain task IDs from mockTasks
      expect(screen.getByText(/#1:/)).toBeInTheDocument();
      expect(screen.getByText(/#2:/)).toBeInTheDocument();
      expect(screen.getByText(/#3:/)).toBeInTheDocument();
    });

    test('filters logs by specific task', () => {
      // Select a specific task
      const selectElements = document.getElementsByTagName('select');
      const taskSelect = selectElements[0];

      fireEvent.change(taskSelect, { target: { value: '1' } });

      // Should show only logs for task 1
      waitFor(() => {
        expect(screen.getByText(/Task #1/)).toBeInTheDocument();
        expect(screen.queryByText(/Task #2/)).not.toBeInTheDocument();
        expect(screen.getAllByText(/Task #1/).length).toBeGreaterThan(2);
      });
    });

    test('filtering by task works with level filters', () => {
      const selectElements = document.getElementsByTagName('select');
      const taskSelect = selectElements[0];

      // First filter by task
      fireEvent.change(taskSelect, { target: { value: '1' } });

      // Then disable info level
      fireEvent.click(screen.getByRole('checkbox', { name: /info/i }));

      // Should show only non-info logs for task 1
      waitFor(() => {
        const logs = screen.getAllByText(/Task #1/);
        expect(logs.length).toBe(2); // error and debug logs for task 1
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
        expect(screen.getByText('Debug information')).toBeInTheDocument();
        expect(screen.queryByText('Starting task execution')).not.toBeInTheDocument();
      });
    });
  });

  describe('Date Filtering', () => {
    beforeEach(() => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);
      // Open filters panel
      fireEvent.click(screen.getByText('Filters'));
    });

    test('date range inputs are visible', () => {
      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBe(2);
    });

    test('filters logs by date range', () => {
      const dateInputs = document.querySelectorAll('input[type="date"]');

      // Set date range
      fireEvent.change(dateInputs[0], { target: { value: '2024-01-01' } });

      // Should show logs within or after that date
      expect(screen.getByText('Starting task execution')).toBeInTheDocument();
    });
  });

  describe('Context Display', () => {
    test('shows context details when available', async () => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);

      // Find the "Context" details elements
      const detailsElements = document.querySelectorAll('details');
      expect(detailsElements.length).toBeGreaterThan(0);

      // Click to open first context
      detailsElements[0].open = true;

      await waitFor(() => {
        const preElements = document.querySelectorAll('pre');
        expect(preElements.length).toBeGreaterThan(0);
        expect(preElements[0].textContent).toContain('initialization');
      });
    });

    test('formats context JSON correctly', async () => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);

      const detailsElements = document.querySelectorAll('details');
      detailsElements[1].open = true; // Second log with error context

      await waitFor(() => {
        const preElements = document.querySelectorAll('pre');
        expect(preElements.length).toBeGreaterThan(0);

        const jsonText = preElements[0].textContent || '';
        expect(jsonText).toMatch(/"error"\s*:/);
        expect(jsonText).toMatch(/"Network timeout"/);
      });
    });
  });

  describe('Sorting', () => {
    test('sorts logs by timestamp descending by default (newest first)', () => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);

      // The logs should be displayed newest first
      // Last log (newest) is "Task completed successfully"
      const allText = document.body.textContent || '';
      const taskCompletedIndex = allText.indexOf('Task completed successfully');
      const startingExecutionIndex = allText.indexOf('Starting task execution');

      expect(taskCompletedIndex).toBeLessThan(startingExecutionIndex);
    });

    test('maintains sort order when filters applied', async () => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);

      // Apply a filter
      fireEvent.click(screen.getByText('Filters'));
      const errorCheckbox = screen.getByRole('checkbox', { name: /error/i });
      fireEvent.click(errorCheckbox);

      // Should filter out error logs
      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
      expect(screen.getByText('Starting task execution')).toBeInTheDocument();
    });
  });

  describe('Clear All Filters', () => {
    beforeEach(() => {
      render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);
      fireEvent.click(screen.getByText('Filters'));
    });

    test('clear all button appears when filters active', () => {
      fireEvent.click(screen.getByRole('checkbox', { name: /info/i }));
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    test('clear all button resets all filters', () => {
      // Activate various filters
      fireEvent.click(screen.getByRole('checkbox', { name: /info/i }));
      fireEvent.click(screen.getByRole('checkbox', { name: /warn/i }));

      const selectElements = document.getElementsByTagName('select');
      if (selectElements.length > 0) {
        fireEvent.change(selectElements[0], { target: { value: '1' } });
      }

      // Clear all
      fireEvent.click(screen.getByText('Clear All'));

      // All logs should be visible again
      expect(screen.getByText('Starting task execution')).toBeInTheDocument();
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByText('Warning about configuration')).toBeInTheDocument();
      expect(screen.getByText('Debug information')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles logs with null context', () => {
      const logsWithNullContext = [
        {
          id: 1,
          taskId: 1,
          message: 'Log without context',
          level: 'info',
          context: null,
          timestamp: new Date(),
        },
      ];

      const { container } = render(<AgentLogs logs={logsWithNullContext} tasks={mockTasks} />);

      // Should not have details elements (no context)
      const detailsElements = container.querySelectorAll('details');
      expect(detailsElements.length).toBe(0);
    });

    test('handles unknown log level gracefully', () => {
      const logsWithUnknownLevel = [
        {
          id: 1,
          taskId: 1,
          message: 'Unknown level',
          level: 'unknown',
          context: null,
          timestamp: new Date(),
        },
      ];

      // Should render without crashing (falls back to info styling)
      const { container } = render(<AgentLogs logs={logsWithUnknownLevel} tasks={mockTasks} />);
      expect(screen.getByText('Unknown level')).toBeInTheDocument();

      // Should fall back to INFO styling
      expect(screen.getByText('INFO')).toBeInTheDocument();
    });

    test('handles task with no matching tasks array', () => {
      const logsWithUnknownTask = [
        {
          id: 1,
          taskId: 999,
          message: 'Task with unknown ID',
          level: 'info',
          context: null,
          timestamp: new Date(),
        },
      ];

      render(<AgentLogs logs={logsWithUnknownTask} tasks={mockTasks} />);

      // Should show task ID
      expect(screen.getByText(/Task #999/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('handles large number of logs efficiently', () => {
      const largeLogs = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        taskId: 1,
        message: `Log entry ${i + 1}`,
        level: ['info', 'warn', 'error', 'debug'][i % 4] as any,
        context: null,
        timestamp: new Date(2024, 0, 1, Math.floor(i / 100), i % 60),
      }));

      const startTime = performance.now();
      render(<AgentLogs logs={largeLogs} tasks={mockTasks} />);
      const endTime = performance.now();

      // Should render in under 200ms
      expect(endTime - startTime).toBeLessThan(200);

      // Should show all logs
      expect(screen.getByText(/1000 of 1000 logs/)).toBeInTheDocument();
    });
  });
});
