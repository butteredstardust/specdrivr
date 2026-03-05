/**
 * Unit tests for InlinePlanEditor component
 * Tests view mode, edit mode, plan creation, JSON editing, and save/cancel flows
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InlinePlanEditor } from '@/components/inline-plan-editor';
import '@testing-library/jest-dom';

// Mock server actions
jest.mock('@/lib/actions', () => ({
  updatePlanDev: jest.fn(),
  createPlanDev: jest.fn(),
}));

const mockUpdatePlanDev = require('@/lib/actions').updatePlanDev;
const mockCreatePlanDev = require('@/lib/actions').createPlanDev;

const mockPlans = [
  {
    id: 1,
    specId: 1,
    version: 1,
    architectureDecisions: {
      frontend: "Next.js",
      backend: "API Routes"
    },
    status: 'draft',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    specId: 1,
    version: 2,
    architectureDecisions: {
      frontend: "Next.js 14",
      backend: "Node.js"
    },
    status: 'active',
    createdAt: '2024-01-02T00:00:00Z',
  },
];

describe('InlinePlanEditor - View Mode', () => {
  test('renders plan details in view mode', () => {
    render(<InlinePlanEditor specId={1} plans={mockPlans} />);

    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('Next.js 14')).toBeInTheDocument();
  });

  test('shows active status badge', () => {
    render(<InlinePlanEditor specId={1} plans={mockPlans} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('shows Edit button in view mode', () => {
    render(<InlinePlanEditor specId={1} plans={mockPlans} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('shows New button in view mode', () => {
    render(<InlinePlanEditor specId={1} plans={mockPlans} />);

    expect(screen.getByText('+ New')).toBeInTheDocument();
  });

  test('shows plan version when multiple plans exist', () => {
    render(<InlinePlanEditor specId={1} plans={mockPlans} />);

    expect(screen.getByText('Plan #2')).toBeInTheDocument();
  });

  test('shows no plan defined message when no plans', () => {
    render(<InlinePlanEditor specId={1} plans={[]} />);

    expect(screen.getByText('No plan defined. Create one to define architecture decisions.')).toBeInTheDocument();
  });
});

describe('InlinePlanEditor - Edit Mode', () => {
  beforeEach(() => {
    render(<InlinePlanEditor specId={1} plans={mockPlans} />);
    // Click Edit to enter edit mode
    fireEvent.click(screen.getByText('Edit'));
  });

  test('enters edit mode and shows form fields', () => {
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Architecture Decisions (JSON)')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  test('shows all status buttons', () => {
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  test('selects active status by default', () => {
    expect(screen.getByText('Active')).toHaveClass('bg-blue-50');
  });

  test('changes status when clicking status buttons', () => {
    const draftButton = screen.getByText('Draft');
    fireEvent.click(draftButton);

    expect(draftButton).toHaveClass('bg-gray-100');
  });

  test('highlights selected status', () => {
    const completedButton = screen.getByText('Completed');
    fireEvent.click(completedButton);

    expect(completedButton).toHaveClass('bg-green-50');
  });

  test('shows textarea with plan JSON', () => {
    const textarea = document.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea?.value).toContain('frontend');
    expect(textarea?.value).toContain('backend');
  });

  test('accepts text input in textarea', () => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"test": "data"}' } });

    expect(textarea.value).toBe('{"test": "data"}');
  });

  test('shows Format JSON button', () => {
    expect(screen.getByText('Format JSON')).toBeInTheDocument();
  });

  test('formats valid JSON to pretty format when clicking Format JSON', () => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"frontend":"Next.js","backend":"Node.js"}' } });

    fireEvent.click(screen.getByText('Format JSON'));

    expect(textarea.value).toContain('\n');
  });

  test('shows error for invalid JSON', async () => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
    });
  });
});

describe('InlinePlanEditor - Creation Mode', () => {
  test('enters creation mode by clicking New button', () => {
    render(<InlinePlanEditor specId={1} plans={[]} />);

    fireEvent.click(screen.getByText('+ New'));

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Architecture Decisions (JSON)')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  test('shows default JSON template in creation mode', () => {
    render(<InlinePlanEditor specId={1} plans={[]} />);

    fireEvent.click(screen.getByText('+ New'));

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('frontend');
    expect(textarea.value).toContain('backend');
  });

  test('changes template JSON', () => {
    render(<InlinePlanEditor specId={1} plans={[]} />);

    fireEvent.click(screen.getByText('+ New'));

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"test": "template"}' } });

    expect(textarea.value).toContain('test');
  });
});

describe('InlinePlanEditor - Save Operations', () => {
  test('saves existing plan successfully', async () => {
    render(<InlinePlanEditor specId={1} plans={mockPlans} />);

    fireEvent.click(screen.getByText('Edit'));

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"updated": "architecture"}' } });

    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(mockUpdatePlanDev).toHaveBeenCalledWith(
        mockPlans[1].id,
        { updated: 'architecture' },
        'active'
      );
    });
  });

  test('creates new plan successfully', async () => {
    render(<InlinePlanEditor specId={1} plans={[]} />);

    fireEvent.click(screen.getByText('+ New'));

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"test": "data"}' } });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockCreatePlanDev).toHaveBeenCalledWith({
        specId: 1,
        architectureDecisions: { test: 'data' },
        status: 'draft',
      });
    });
  });

  test('calls onCreated after successful save', async () => {
    const mockOnCreated = jest.fn();

    render(
      <InlinePlanEditor specId={1} plans={mockPlans} onCreated={mockOnCreated} />
    );

    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(document.querySelector('textarea')!, { target: { value: '{"test": "save"}' } });
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(mockOnCreated).toHaveBeenCalled();
    });
  });

  test('shows loading state during save', async () => {
    mockUpdatePlanDev.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<InlinePlanEditor specId={1} plans={mockPlans} />);

    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(document.querySelector('textarea')!, { target: { value: '{"test": "save"}' } });
    fireEvent.click(screen.getByText('Update'));

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeDisabled();

    await waitFor(() => {
      expect(mockUpdatePlanDev).toHaveBeenCalled();
    });
  });

  test('shows error when save fails', async () => {
    mockCreatePlanDev.mockResolvedValue({ success: false, error: 'Save failed' });

    render(<InlinePlanEditor specId={1} plans={[]} />);

    fireEvent.click(screen.getByText('+ New'));
    fireEvent.change(document.querySelector('textarea')!, { target: { value: '{"test": "data"}' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });
});

describe('InlinePlanEditor - Cancel Behavior', () => {
  test('cancels edit mode and returns to view', async () => {
    render(<InlinePlanEditor specId={1} plans={mockPlans} />);

    fireEvent.click(screen.getByText('Edit'));

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"changed": "true"}' } });

    fireEvent.click(screen.getByText('Cancel'));

    // Should be back in view mode
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('resets changes on cancel', async () => {
    render(<InlinePlanEditor specId={1} plans={mockPlans} />);

    const originalContent = (document.querySelector('textarea') as HTMLTextAreaElement)?.value;

    fireEvent.click(screen.getByText('Edit'));

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"changed": "true"}' } });

    fireEvent.click(screen.getByText('Cancel'));

    // Should reset to view mode with original
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('clears errors on cancel', async () => {
    render(<InlinePlanEditor specId={1} plans={[]} />);

    fireEvent.click(screen.getByText('+ New'));

    fireEvent.change(document.querySelector('textarea')!, { target: { value: 'invalid' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Invalid JSON format')).not.toBeInTheDocument();
  });
});

describe('InlinePlanEditor - Edge Cases', () => {
  test('handles plans with no active status', () => {
    const inactivePlans = [
      { ...mockPlans[0], status: 'draft' },
    ];

    render(<InlinePlanEditor specId={1} plans={inactivePlans} />);

    // Should render in view mode
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('handles plans with null architectureDecisions', () => {
    const nullPlan = [
      { ...mockPlans[0], architectureDecisions: null },
    ];

    render(<InlinePlanEditor specId={1} plans={nullPlan} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.queryByText('frontend')).not.toBeInTheDocument();
  });

  test('handles malformed architectureDecisions JSON', () => {
    const badPlan = [
      { ...mockPlans[0], architectureDecisions: '{"bad": "json"}' },
    ];

    render(<InlinePlanEditor specId={1} plans={badPlan} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('handles exception in updatePlan', async () => {
    mockUpdatePlanDev.mockRejectedValue(new Error('Network error'));

    render(<InlinePlanEditor specId={1} plans={mockPlans} />);

    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(document.querySelector('textarea')!, { target: { value: '{"test": "data"}' } });
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('handles plans array with mixed statuses', async () => {
    const mixedPlans = [
      { ...mockPlans[0], status: 'draft' },
      { ...mockPlans[1], status: 'completed' },
    ];

    render(<InlinePlanEditor specId={1} plans={mixedPlans} />);
    fireEvent.click(screen.getByText('Edit'));

    const select = document.querySelector('select');
    expect(select).toBeInTheDocument();

    // Should have both plans in dropdown
    expect(screen.getByText(/Plan #1/)).toBeInTheDocument();
    expect(screen.getByText(/Plan #2/)).toBeInTheDocument();
  });
});
