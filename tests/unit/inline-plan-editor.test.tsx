import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InlinePlanEditor } from '@/components/inline-plan-editor';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock server actions
vi.mock('@/lib/actions', () => ({
  updatePlanDev: vi.fn(),
  createPlanDev: vi.fn(),
}));

import * as actions from '@/lib/actions';
const mockUpdatePlanDev = actions.updatePlanDev as any;
const mockCreatePlanDev = actions.createPlanDev as any;

const mockPlans = [
  {
    id: 1,
    specId: 1,
    version: 1,
    architectureDecisions: { frontend: "Next.js", backend: "API Routes" },
    status: 'draft',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 2,
    specId: 1,
    version: 2,
    architectureDecisions: { frontend: "Next.js 14", backend: "Node.js" },
    status: 'active',
    createdAt: new Date('2024-01-02T00:00:00Z'),
  },
];

describe('InlinePlanEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('View Mode', () => {
    test('renders plan details', () => {
      render(<InlinePlanEditor specId={1} plans={mockPlans} />);
      expect(screen.getByText('Plan')).toBeInTheDocument();
      expect(screen.getByText('Next.js 14')).toBeInTheDocument();
    });

    test('shows status badge', () => {
      render(<InlinePlanEditor specId={1} plans={mockPlans} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    test('enters edit mode and shows form fields', () => {
      render(<InlinePlanEditor specId={1} plans={mockPlans} />);
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    test('updates plan with new decisions and status', async () => {
      mockUpdatePlanDev.mockResolvedValue({ success: true });
      render(<InlinePlanEditor specId={1} plans={mockPlans} />);
      fireEvent.click(screen.getByText('Edit'));

      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: '{"updated": true}' } });
      fireEvent.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(mockUpdatePlanDev).toHaveBeenCalled();
      });
    });
  });

  describe('Creation Mode', () => {
    test('includes intent field when creating new plan', async () => {
      mockCreatePlanDev.mockResolvedValue({ success: true });
      render(<InlinePlanEditor specId={1} plans={[]} />);
      fireEvent.click(screen.getByText('+ New'));

      // Look for the intent field that was added
      const intentInput = screen.getByLabelText(/Intent/i);
      fireEvent.change(intentInput, { target: { value: 'New feature implementation' } });

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(mockCreatePlanDev).toHaveBeenCalledWith(expect.objectContaining({
          intent: 'New feature implementation'
        }));
      });
    });
  });
});
