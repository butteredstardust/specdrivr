import { render, screen, fireEvent } from '@testing-library/react';
import { AgentLogs } from '@/components/agent-logs';
import '@testing-library/jest-dom';
import { describe, test, expect } from 'vitest';

const mockLogs = [
  {
    id: 1,
    taskId: 1,
    message: 'Starting task execution',
    level: 'info' as const,
    timestamp: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: 2,
    taskId: 1,
    message: 'Error occurred',
    level: 'error' as const,
    timestamp: new Date('2024-01-01T10:01:00Z'),
  },
];

const mockTasks = [
  { id: 1, description: 'Create API endpoint' },
];

describe('AgentLogs', () => {
  test('renders component with logs', () => {
    render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);
    expect(screen.getByText(/Agent Activity \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('Starting task execution')).toBeInTheDocument();
  });

  test('level filtering toggles visibility', async () => {
    render(<AgentLogs logs={mockLogs} tasks={mockTasks} />);
    fireEvent.click(screen.getByText('Filters'));

    const infoCheckboxes = screen.getAllByText('info');
    fireEvent.click(infoCheckboxes[0]);

    expect(screen.queryByText('Starting task execution')).not.toBeInTheDocument();
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });
});
