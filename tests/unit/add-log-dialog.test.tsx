import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddLogDialog } from '@/components/add-log-dialog';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from '@/lib/actions';

// Mock the server action
vi.mock('@/lib/actions', () => ({
  addAgentLogDev: vi.fn(),
}));

const mockTasks = [
  { id: 1, description: 'Implement authentication middleware' },
  { id: 2, description: 'Setup database connection' },
];

describe('AddLogDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button when closed', () => {
    render(<AddLogDialog tasks={mockTasks} />);
    expect(screen.getByText('Add Log')).toBeInTheDocument();
  });

  it('opens dialog when trigger button clicked', () => {
    render(<AddLogDialog tasks={mockTasks} />);
    fireEvent.click(screen.getByText('Add Log'));
    expect(screen.getByText('Add Agent Log')).toBeInTheDocument();
  });

  it('submits with correct data', async () => {
    const mockAdd = vi.mocked(actions.addAgentLogDev);
    mockAdd.mockResolvedValue({ success: true } as any);

    render(<AddLogDialog tasks={mockTasks} isOpen={true} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    const textarea = screen.getByPlaceholderText('Describe what happened...');
    fireEvent.change(textarea, { target: { value: 'Test log message' } });

    fireEvent.click(screen.getByText('Add Log'));

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
        taskId: 1,
        message: 'Test log message',
      }));
    });
  });
});
